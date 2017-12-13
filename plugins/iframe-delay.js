/**
 * This plugin delays the Page Load beacon until all specified IFRAMEs have
 * also signalled they are also fully loaded.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Usage
 * In the parent page the following configuration should be used:
 *
 *     BOOMR_config = {
 *       autorun: false,
 *       IFrameDelay: {
 *         enabled: true,
 *         monitoredCount: 1
 *       }
 *     };
 *
 * And in the child IFRAME:
 *
 *     BOOMR_config = {
 *       IFrameDelay: {
 *         enabled: true,
 *         registerParent: true
 *       }
 *     };
 *
 * See the {@link BOOMR.plugins.IFrameDelay.init init()} function for more
 * details on each parameter.
 *
 * Once all registered IFRAMEs have finished loading, the Page Load time
 * is set with the load time of the final IFRAME.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `ifdl.done`: When all of the IFRAMEs have finished loading
 * * `ifdl.ct`: Number of finished IFRAMEs
 * * `ifdl.r`: Number of still-running IFRAMEs
 * * `ifdl.mon`: Total number of monitored IFRAMEs
 *
 * @class BOOMR.plugins.IFrameDelay
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.IFrameDelay) {
		return;
	}

	function log(message) {
		BOOMR.debug(
			"(url: " + BOOMR.window.location.href + "): " + message,
			"IFrameDelay");
	}

	var impl = {
		/**
		 * If true, send postMessage `boomrIframeLoading` and wait for the current
		 * frame to send the beacon. When Boomerang sends a beacon, it will
		 * also postMessage `boomrIframeLoaded`.
		 */
		registerParent: false,

		/**
		 * If set, count down the amount of times `boomrIframeLoaded` has been sent
		 */
		monitoredCount: 0,

		/**
		 * Number of frames that went from `boomrIframeLoading` to `boomrIframeLoaded`
		 */
		finishedCount: 0,

		/**
		 * Number of registered child IFRAMEs currently waiting to finish
		 */
		runningCount: 0,

		/**
		 * postMessage names
		 */
		messages: {
			start: "boomrIframeLoading",
			done: "boomrIframeLoaded"
		},

		/**
		 * At `onload`, checks if running frames (those that registered with
		 * their parent frame) equal the expected amount of monitored frames.
		 *
		 * Should this not be the case, set monitored count equal to the number
		 * of registered (running) frames.
		 */
		checkRunningFrames: function() {
			// Need to delay this 50ms as onload is faster than postMessage transfer
			setTimeout(function() {
				// we are strict parents we will only wait for the children that told us to wait for them
				if (impl.monitoredCount !== impl.runningCount) {
					log("monitoredCount(" + impl.monitoredCount + ") did not match " +
						"registered running count(" + impl.runningCount + ")");

					impl.monitoredCount = impl.runningCount;

					// Check if we are down to 0 and send page_ready()
					impl.checkCompleteness();
				}
			}, 50);
		},

		/**
		 * IFRAME postMessage `onmessage` callback listening for messages from
		 * the child IFRAMEs.
		 *
		 * @param {Event} event postMessage Event
		 */
		onIFrameMessage: function(event) {
			log("Received message: '" + event.data + "' from child IFrame");

			if (event && event.data && typeof event.data === "string") {
				if (event.data === impl.messages.start) {
					impl.runningCount += 1;
				}

				if (event.data === impl.messages.done) {
					impl.runningCount -= 1;
					impl.finishedCount += 1;
					impl.checkCompleteness();
				}
			}
		},

		/**
		 * If we are done with all our monitored frames we will tell
		 * Boomerang that the page is ready and send out a beacon with
		 * our information.
		 */
		checkCompleteness: function() {
			if (impl.is_complete()) {
				// Add time IFrameDelay was done running.
				BOOMR.addVar("ifdl.done", BOOMR.now());

				// Add number for finished/beaconed IFRAMEs.
				BOOMR.addVar("ifdl.ct", impl.finishedCount);

				// Add number of "still" running IFRAMEs - used for diagnostics
				// if we canceled waiting too long for the child page to send a
				// beacon.
				BOOMR.addVar("ifdl.r", impl.runningCount);

				// Add number of monitored IFRAMEs - if configuration did not
				// dictate number of monitored IFRAMEs we should give this
				// number here to tell how many boomerang saw.
				BOOMR.addVar("ifdl.mon", impl.monitoredCount);
				BOOMR.page_ready();
			}
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} True when the plugin is complete
		 */
		is_complete: function() {
			return impl.enabled && !impl.registerParent ?
				impl.finishedCount === impl.monitoredCount && impl.runningCount === 0 :
				true;
		}
	};

	BOOMR.plugins.IFrameDelay = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {boolean} [config.IFrameDelay.registerParent] Should be set to
		 * `true` for child IFRAMEs.  If `true`, the parent frame will wait on
		 * this child IFRAME.
		 * @param {number} [config.IFrameDelay.monitoredCount] Should be set by
		 * the parent frame to indiciate the number of child IFRAMEs it expects
		 * to wait on.
		 * @returns {@link BOOMR.plugins.IFrameDelay} The IFrameDelay plugin for chaining
		 * @memberof BOOMR.plugins.IFrameDelay
		 */

		init: function(config) {
			BOOMR.utils.pluginConfig(
				impl,
				config,
				"IFrameDelay",
				["enabled", "registerParent", "monitoredCount"]);

			// only run important bits if we're getting the actual configuration
			if (BOOMR.utils.hasPostMessageSupport()) {
				if (impl.registerParent) {
					log("Found registerParent=true, trying to notify parent window");

					BOOMR.window.parent.postMessage(impl.messages.start, "*");
					BOOMR.subscribe("page_load_beacon", function(vars) {
						BOOMR.window.parent.postMessage(impl.messages.done, "*");
					});
				}
				else if (!impl.registerParent && impl.monitoredCount && impl.monitoredCount > 0) {
					BOOMR.utils.addListener(BOOMR.window, "message", impl.onIFrameMessage);
					BOOMR.attach_page_ready(impl.checkRunningFrames);
				}
				else {
					log("Missing configuration. Setting monitored, finished and running to 0 and closing this plugin");
					impl.finishedCount = impl.monitoredCount = impl.runningCount = 0;
				}
			}
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.IFrameDelay
		 */
		is_complete: function() {
			return impl.is_complete();
		}
	};
}());
