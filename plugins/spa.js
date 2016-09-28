(function() {
	var hooked = false,
	    initialRouteChangeStarted = false,
	    initialRouteChangeCompleted = false,
	    lastLocationChange = "",
	    autoXhrEnabled = false,
	    firstSpaNav = true,
	    routeFilter = false,
	    routeChangeWaitFilter = false,
	    supported = [],
	    latestResource;

	if (BOOMR.plugins.SPA) {
		return;
	}

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
			return true;
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
		 * Called by a framework when it has hooked into the target SPA
		 *
		 * @param {boolean} hadRouteChange True if a route change has already fired
		 * @param {Object} options Additional options
		 *
		 * @returns {BOOMR} Boomerang object
		 */
		hook: function(hadRouteChange, options) {
			options = options || {};

			if (hooked) {
				return this;
			}

			if (hadRouteChange) {
				if (autoXhrEnabled) {
					// re-enable AutoXHR if it's enabled
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}

				// We missed the initial route change (we loaded too slowly), so we're too
				// late to monitor for new DOM elements.  Don't hold the initial page load beacon.
				initialRouteChangeCompleted = true;

				// send any queued beacons first
				BOOMR.real_sendBeacon();

				// Tell BOOMR this is a Hard SPA navigation still
				BOOMR.addVar("http.initiator", "spa_hard");
				firstSpaNav = false;

				// note that we missed the route change on the beacon for debugging
				BOOMR.addVar("spa.missed", "1");

				// Since we held the original beacon (autorun=false), we need to tell BOOMR
				// that the page has loaded OK.
				BOOMR.page_ready();
			}

			if (typeof options.routeFilter === "function") {
				routeFilter = options.routeFilter;
			}

			if (typeof options.routeChangeWaitFilter === "function") {
				routeChangeWaitFilter = options.routeChangeWaitFilter;
			}

			hooked = true;

			return this;
		},
		/**
		 * Called by a framework when a route change has happened
		 */
		route_change: function() {
			// if we have a routeFilter, see if they want to track this route
			if (routeFilter) {
				try {
					if (!routeFilter.apply(null, arguments)) {
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

			// if we were given a URL by $locationChangeStart use that, otherwise, use the document.URL
			var url = lastLocationChange ? lastLocationChange : BOOMR.window.document.URL;

			// construct the resource we'll be waiting for
			var resource = {
				timing: {
					requestStart: requestStart
				},
				initiator: firstSpaNav ? "spa_hard" : "spa",
				url: url
			};

			firstSpaNav = false;

			if (!initialRouteChangeCompleted) {
				// if we haven't completed our initial SPA navigation yet (this is a hard nav), wait
				// for all of the resources to be downloaded
				resource.onComplete = function() {
					initialRouteChangeCompleted = true;

					// fire a SPA navigation completed event so that other plugins can act on it
					BOOMR.fireEvent("spa_navigation");
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
		 * Called by a framework when the location has changed to the specified URL.  This
		 * should be called prior to route_change() to use the specified URL.
		 * @param {string} url URL
		 */
		last_location: function(url) {
			lastLocationChange = url;
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
		}
	};

}(BOOMR.window));
