(function() {
	var hooked = false,
	    initialized = false,
	    initialRouteChangeStarted = false,
	    initialRouteChangeCompleted = false,
	    autoXhrEnabled = false,
	    firstSpaNav = true,
	    routeFilter = false,
	    routeChangeWaitFilter = false,
	    disableHardNav = false,
	    supported = [],
	    latestResource,
	    waitingOnHardMissedComplete = false;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.SPA || !BOOMR.plugins.AutoXHR) {
		return;
	}

	/**
	 * Debug logging for this plugin
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(msg, "spa");
	}

	var impl = {
		/**
		 * Called after a SPA Hard navigation that missed the route change
		 * completes.
		 *
		 * We may want to fix-up the timings of the SPA navigation if there was
		 * any other activity after onload.
		 *
		 * If there was not activity after onload, using the timings for
		 * onload from NavigationTiming.
		 *
		 * If there was activity after onload, use the end time of the latest
		 * resource.
		 */
		spaHardMissedOnComplete: function(resource) {
			waitingOnHardMissedComplete = false;

			var p = BOOMR.getPerformance(), startTime, stopTime;

			// gather start times from NavigationTiming if available
			if (p && p.timing && p.timing.navigationStart && p.timing.loadEventEnd) {
				startTime = p.timing.navigationStart;
				stopTime = p.timing.loadEventEnd;
			}
			else {
				startTime = BOOMR.t_start;
			}

			// note that we missed the route change on the beacon for debugging
			BOOMR.addVar("spa.missed", "1");

			// ensure t_done is the time we've specified
			BOOMR.plugins.RT.clearTimer("t_done");

			// always use the start time of navigationStart
			resource.timing.requestStart = startTime;

			if (resource.resources.length === 0 && stopTime) {
				// No other resources were fetched, so set the end time
				// to NavigationTiming's performance.loadEventEnd (instead of 'now')
				resource.timing.loadEventEnd = stopTime;
			}
		},

		/**
		 * Fired on each beacon.
		 */
		onBeacon: function() {
			// remove all of the potential parameters we added to the beacon
			BOOMR.removeVar("spa.missed", "spa.forced", "spa.waiting");
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.SPA = {
		/**
		 * Determines if the plugin is complete
		 *
		 * @returns {boolean} True if the plugin is complete
		 */
		is_complete: function() {
			return !waitingOnHardMissedComplete;
		},
		/**
		 * Called to initialize the plugin via BOOMR.init()
		 *
		 * @param {object} config Configuration
		 */
		init: function(config) {
			if (config && config.instrument_xhr) {
				autoXhrEnabled = config.instrument_xhr;

				// if AutoXHR is enabled, and we've already had
				// a route change, make sure to turn AutoXHR back on
				if (initialRouteChangeStarted && autoXhrEnabled) {
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}
			}

			if (initialized) {
				return;
			}

			initialized = true;

			BOOMR.subscribe("onbeacon", impl.onBeacon, null, impl);
		},
		/**
		 * Registers a framework with the SPA plugin
		 *
		 * @param {string} pluginName Plugin name
		 */
		register: function(pluginName) {
			supported.push(pluginName);
		},
		/**
		 * Gets a list of supported SPA frameworks
		 *
		 * @returns {string[]} List of supported frameworks
		 */
		supported_frameworks: function() {
			return supported;
		},
		/**
		 * Fired when onload happens (or immediately if onload has already fired)
		 * to monitor for additional resources for a SPA Hard navigation
		 */
		onLoadSpaHardMissed: function() {
			if (initialRouteChangeStarted) {
				// we were told the History event was missed, but it happened anyways
				// before onload
				return;
			}

			// We missed the initial route change (we loaded too slowly), so we're too
			// late to monitor for new DOM elements.  Don't hold the initial page load beacon.
			initialRouteChangeCompleted = true;

			if (autoXhrEnabled) {
				// re-enable AutoXHR if it's enabled
				BOOMR.plugins.AutoXHR.enableAutoXhr();
			}

			// ensure the beacon is held until this SPA hard beacon is ready
			waitingOnHardMissedComplete = true;

			if (!disableHardNav) {
				// Trigger a route change
				BOOMR.plugins.SPA.route_change(impl.spaHardMissedOnComplete);
			}
			else {
				waitingOnHardMissedComplete = false;
			}
		},
		/**
		 * Called by a framework when it has hooked into the target SPA
		 *
		 * @param {boolean} hadRouteChange True if a route change has already fired
		 * @param {Object} options Additional options
		 *
		 * @returns {BOOMR} Boomerang object
		 */
		hook: function(hadRouteChange, options) {
			options = options || {};

			log("Hooked");

			if (hooked) {
				return this;
			}

			if (typeof options.routeFilter === "function") {
				routeFilter = options.routeFilter;
			}

			if (typeof options.routeChangeWaitFilter === "function") {
				routeChangeWaitFilter = options.routeChangeWaitFilter;
			}

			if (options.disableHardNav) {
				disableHardNav = options.disableHardNav;
			}

			if (hadRouteChange) {
				// kick off onLoadSpaHardMissed once onload has fired, or immediately
				// if onload has already fired
				BOOMR.attach_page_ready(this.onLoadSpaHardMissed);
			}

			hooked = true;

			return this;
		},
		/**
		 * Called by a framework when a route change has happened
		 *
		 * @param {function} onComplete Called on completion
		 * @param {object[]} routeFilterArgs Route Filter arguments
		 */
		route_change: function(onComplete, routeFilterArgs) {
			log("Route Change");

			var firedEvent = false;

			// if we have a routeFilter, see if they want to track this route
			if (routeFilter) {
				try {
					if (!routeFilter.apply(null, routeFilterArgs)) {
						log("Route filter returned false; not tracking this route");
						return;
					}
				}
				catch (e) {
					BOOMR.addError(e, "SPA.route_change.routeFilter");
				}
			}

			// note we've had at least one route change
			initialRouteChangeStarted = true;

			// If this was the first request, use navStart as the begin timestamp.  Otherwise, use
			// "now" as the begin timestamp.
			var requestStart = initialRouteChangeCompleted ? BOOMR.now() : BOOMR.plugins.RT.navigationStart();

			// use the document.URL even though it may be the URL of the previous nav. We will updated
			// it in AutoXHR sendEvent
			var url = BOOMR.window.document.URL;

			// construct the resource we'll be waiting for
			var resource = {
				timing: {
					requestStart: requestStart
				},
				initiator: firstSpaNav && !disableHardNav ? "spa_hard" : "spa",
				url: url
			};

			firstSpaNav = false;

			if (!initialRouteChangeCompleted || typeof onComplete === "function") {
				initialRouteChangeCompleted = true;

				// if we haven't completed our initial SPA navigation yet (this is a hard nav), wait
				// for all of the resources to be downloaded
				resource.onComplete = function(onCompleteResource) {
					if (!firedEvent) {
						firedEvent = true;

						// fire a SPA navigation completed event so that other plugins can act on it
						BOOMR.fireEvent("spa_navigation");
					}

					if (typeof onComplete === "function") {
						onComplete(onCompleteResource);
					}
				};
			}

			// if we have a routeChangeWaitFilter, make sure AutoXHR waits on the custom event
			if (routeChangeWaitFilter) {
				try {
					if (routeChangeWaitFilter.apply(null, arguments)) {
						resource.wait = true;

						latestResource = resource;
					}
				}
				catch (e) {
					BOOMR.addError(e, "SPA.route_change.routeChangeWaitFilter");
				}
			}

			// start listening for changes
			resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

			// re-enable AutoXHR if it's enabled
			if (autoXhrEnabled) {
				BOOMR.plugins.AutoXHR.enableAutoXhr();
			}
		},
		/**
		 * Return the current SPA beacon type
		 *
		 * @returns {string} SPA beacon type
		 */
		current_spa_nav: function() {
			return !initialRouteChangeCompleted ? "spa_hard" : "spa";
		},
		/**
		 * Called by the SPA consumer if they have a routeChangeWaitFilter and are manually
		 * triggering navigation complete events.
		 */
		wait_complete: function() {
			if (latestResource) {
				latestResource.wait = false;

				if (latestResource.waitComplete) {
					latestResource.waitComplete();
				}

				latestResource = null;
			}
		},

		/**
		 * Marks the current navigation as complete and sends a beacon.
		 */
		markNavigationComplete: function() {
			log("Navigation being marked complete");

			var mh = BOOMR.plugins.AutoXHR.getMutationHandler();
			if (mh) {
				// note that the navigation was forced complete
				BOOMR.addVar("spa.forced", "1");

				// add the count of nodes we were waiting for
				BOOMR.addVar("spa.waiting", mh.nodesWaitingFor());

				// finalize this navigation
				mh.completeEvent();
			}
		}
	};

}());
