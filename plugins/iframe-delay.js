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
	var w,
	    MSG_RETRY_DELAY = 250;  // postMessage retry delay in ms

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.IFrameDelay) {
		return;
	}

	w = BOOMR.window;

	/* BEGIN_DEBUG */
	function debugLog(message) {
		BOOMR.debug(
			"(url: " + w.location.href + "): " + message,
			"IFrameDelay");
	}
	/* END_DEBUG */

	var impl = {
		initialized: false,

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

		loadingIntervalID: undefined,
		loadedIntervalID: undefined,

		loadEnd: 0,  // load timestamp of slowest frame

		/**
		 * postMessage names
		 */
		messages: {
			start: "boomrIframeLoading",
			done: "boomrIframeLoaded",
			startACK: "boomrIframeLoadingACK",
			doneACK: "boomrIframeLoadedACK"
		},

		/**
		 * Parent window postMessage `onmessage` callback listening for messages
		 * from the child IFRAMEs
		 *
		 * @param {Event} event postMessage Event
		 */
		onIFrameMessageAsParent: function(event) {
			var data;
			if (event &&
			    event.data && typeof event.data === "string" && event.data.charAt(0) === "{" &&
			    event.source) {
				try {
					data = JSON.parse(event.data);
				}
				catch (e) {
					return;
				}

				if (data.msg === impl.messages.start) {
					debugLog("Received start message from child IFrame");
					event.source.postMessage(JSON.stringify({"msg": impl.messages.startACK}), event.origin);
					impl.runningCount += 1;
				}
				else if (data.msg === impl.messages.done) {
					debugLog("Received done message from child IFrame");
					event.source.postMessage(JSON.stringify({"msg": impl.messages.doneACK}), event.origin);
					impl.runningCount -= 1;
					impl.finishedCount += 1;
					if (data.loadEnd > impl.loadEnd) {
						impl.loadEnd = data.loadEnd;
					}
					impl.checkCompleteness();
				}
			}
		},

		/**
		 * Child IFRAME postMessage `onmessage` callback listening for messages
		 * from parent window
		 *
		 * @param {Event} event postMessage Event
		 */
		onIFrameMessageAsChild: function(event) {
			var data;
			if (event &&
			    event.data && typeof event.data === "string" && event.data.charAt(0) === "{" &&
			    event.source) {
				try {
					data = JSON.parse(event.data);
				}
				catch (e) {
					return;
				}

				if (data.msg === impl.messages.startACK) {
					debugLog("Received start message ACK from parent");
					clearInterval(impl.loadingIntervalID);
					impl.loadingIntervalID = undefined;
				}
				else if (data.msg === impl.messages.doneACK) {
					debugLog("Received done message ACK from parent");
					clearInterval(impl.loadedIntervalID);
					impl.loadedIntervalID = undefined;
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

				if (BOOMR.hasBrowserOnloadFired()) {
					// if the iframe load time is later than the parent then use it
					BOOMR.page_ready(impl.loadEnd > 0 ? impl.loadEnd : undefined);
				}
				else {
					// if the parent onload hasn't fired yet, then we'll wait for
					// it instead
					BOOMR.attach_page_ready(function() {
						BOOMR.page_ready(undefined, true);
					});
				}
			}
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} True when the plugin is complete
		 */
		is_complete: function() {
			return impl.enabled && !impl.registerParent ?
				impl.finishedCount >= impl.monitoredCount && impl.runningCount === 0 :
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

			if (impl.initialized) {
				return this;
			}
			impl.initialized = true;

			// only run important bits if we're getting the actual configuration
			if (this.is_supported()) {
				if (impl.registerParent) {
					debugLog("Running as Child. Found registerParent=true");
					// listen on this window since it will be the source of postMessage calls
					BOOMR.utils.addListener(window, "message", impl.onIFrameMessageAsChild);
					function postStart() {
						debugLog("Trying to notify parent window of load start");
						w.parent.postMessage(JSON.stringify({"msg": impl.messages.start, "pid": BOOMR.pageId}), "*");
					}
					postStart();
					// keep retrying until we get an ACK
					impl.loadingIntervalID = setInterval(postStart, MSG_RETRY_DELAY);
					BOOMR.subscribe("page_load_beacon", function(vars) {
						var loadEnd;
						if (vars && vars["rt.end"]) {
							loadEnd = vars["rt.end"];
						}
						else {
							loadEnd = BOOMR.now();
						}
						function postEnd() {
							// make sure start message was sent first
							if (!impl.loadingIntervalID) {
								debugLog("Trying to notify parent window of load end");
								w.parent.postMessage(JSON.stringify({"msg": impl.messages.done, "pid": BOOMR.pageId, "loadEnd": loadEnd}), "*");
							}
						}
						postEnd();
						// keep retrying until we get an ACK
						impl.loadedIntervalID = setInterval(postEnd, MSG_RETRY_DELAY);
					});
				}
				else if (!impl.registerParent && impl.monitoredCount && impl.monitoredCount > 0) {
					debugLog("Running as Parent. Found monitoredCount=" + impl.monitoredCount + ", listening for messages from child windows");
					BOOMR.utils.addListener(w, "message", impl.onIFrameMessageAsParent);
				}
				else {
					debugLog("Missing configuration. Setting monitored, finished and running to 0 and closing this plugin");
					impl.finishedCount = impl.monitoredCount = impl.runningCount = 0;
					impl.enabled = false;
				}
			}
			else {
				impl.enabled = false;
			}
			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.IFrameDelay
		 */
		is_complete: function() {
			return impl.is_complete();
		},

		/**
		 * Whether or not this plugin is supported
		 *
		 * @returns {boolean} `true` if the plugin has postMessage and JSON support.
		 * @memberof BOOMR.plugins.IFrameDelay
		 */
		is_supported: function() {
			return BOOMR.utils.hasPostMessageSupport() && window.JSON;
		}
	};
}());
