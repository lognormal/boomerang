(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.IFrameDelay) {
		return;
	}

	function log(message) {
		BOOMR.debug("(url: " + BOOMR.window.location.href + "): " + message, "IFrameDelay");
	}

	var impl = {
		/**
		 * If true, send postMessage "boomrIframeLoading" and wait for the current frame's BOOMR
		 * to send the beacon. If BOOMR sends a beacon, postMessage "boomrIframeLoaded"
		 */
		registerParent: false,
		/**
		 * If set, count down the amount of times boomrIframeLoaded has been sent
		 */
		monitoredCount: 0,
		/**
		 * Number of frames that went from boomrIframeLoading to boomrIframeLoaded
		 */
		finishedCount: 0,
		/**
		 * Number of registered child iframes currently waiting to finish
		 */
		runningCount: 0,
		/**
		 * Message constants object containing states of BOOMR in current subframe
		 */
		messages: {
			start: "boomrIframeLoading",
			done: "boomrIframeLoaded"
		},
		/**
		 * At onload checks if running frames (those that registered with their parent frame) equal the
		 * expected amount of monitored frames. Should this not be the case set monitored count equal to
		 * the number of registered (running) frames.
		 */
		checkRunningFrames: function() {
			// Need to delay this 50ms as onload is faster than postMessage transfer
			setTimeout(function() {
				// we are strict parents we will only wait for the children that told us to wait for them
				if (impl.monitoredCount !== impl.runningCount) {
					log("monitoredCount(" + impl.monitoredCount + ")  did not match registered running count(" + impl.runningCount + ")");
					impl.monitoredCount = impl.runningCount;
					// Check if we are down to 0 and send page_ready()
					impl.checkCompleteness();
				}
			}, 50);
		},
		/**
		 * IFrame postMessage `onmessage` callback listening for messages from child iframes
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
		 * If we are done with all our monitored frames we will tell Boomerang that the page is ready and send
		 * out a beacon with our information.
		 */
		checkCompleteness: function() {
			if (impl.is_complete()) {
				// add time IFrameDelay was done running
				BOOMR.addVar("ifdl.done", BOOMR.now());

				// Add number for finished/beaconed iframes
				BOOMR.addVar("ifdl.ct", impl.finishedCount);

				// Add number of "still" running iframes - used for diagnostics if we canceled waiting
				// too long for the child page to send a beacon
				BOOMR.addVar("ifdl.r", impl.runningCount);

				// Add number of monitored iframes - if configuration did not dictate number of monitored
				// IFrames we should give this number here to tell how many boomerang saw
				BOOMR.addVar("ifdl.mon", impl.monitoredCount);
				BOOMR.page_ready();
			}
		},
		is_complete: function() {
			return impl.enabled && !impl.registerParent ?
				impl.finishedCount === impl.monitoredCount && impl.runningCount === 0 :
				true;
		}
	};

	/**
	 * This plugin enables users to determine a pages readyness based on child iframes instrumented with boomerang having loaded.
	 * In the parent page the following configuration should be used:
	 *
	 * @example
	 * BOOMR_config = {
	 *   autorun: false,
	 *   IFrameDelay: {
	 *     enabled: true,
	 *     monitoredCount: 1
	 *   }
	 * };
	 *
	 * And in the child iframe:
	 *
	 * @example
	 * BOOMR_config = {
	 *   IFrameDelay: {
	 *     enabled: true,
	 *     registerParent: true
	 *   }
	 * };
	 *
	 * The meanings of the configuration parameters are as follows:
	 *  - `enabled`: determines that this plugin is actively used on this page
	 *  - `registerParent`: if true will send 2 postMessages to the parent frame:
	 *     - 1. `boomrIframeLoading`, which tells the parent frame that our page is loading
	 *     - 2. `boomrIframeLoaded`, which tells the parent frame that the page has sent it's PageLoad beacon
	 *  - `monitoredCount`: A numeric value counting the iframes to wait on
	 *
	 * Internally the plugin will manage two further counters to ensure boomerang is seeing the right amount of child IFrames.
	 * - `finishedCount`: A counter incremented everytime a child page sends the `boomrIframeLoaded` message
	 * - `runningCount`: A counter that is incremented whenever a new page sends `boomrIframeLoading` and decremented whenever
	 *   a `boomrIframeLoaded` message was received by the parent frame.
	 *
	 * Once either all registered pages have finished loading we call page_ready() to tell boomerang to send a beacon with the time
	 * at which all child frames have finished running.
	 */
	BOOMR.plugins.IFrameDelay = {
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "IFrameDelay", ["enabled", "registerParent", "monitoredCount"]);
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
		 * Check if we received a beacon for each of the found/monitored iframes. If not enabled simply return true
		 */
		is_complete: function() {
			return impl.is_complete();
		}
	};
}());
