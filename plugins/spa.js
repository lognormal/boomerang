(function() {
	var hooked = false,
	    initialRouteChangeStarted = false,
	    initialRouteChangeCompleted = false,
	    lastLocationChange = "",
	    autoXhrEnabled = false,
	    supported = [];

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

				// if AutoXHR is enabled via config.js, and we've already had
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
		 *
		 * @returns {BOOMR} Boomerang object
		 */
		hook: function(hadRouteChange) {
			if (hooked) {
				return this;
			}

			if (hadRouteChange) {
				if (autoXhrEnabled) {
					// re-enable AutoXHR if it's enabled in config.js
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}

				// We missed the initial route change (we loaded too slowly), so we're too
				// late to monitor for new DOM elements.  Don't hold the initial page load beacon.
				initialRouteChangeCompleted = true;

				// Tell BOOMR this is a SPA navigation still
				BOOMR.addVar("http.initiator", "spa");

				// Since we held the original beacon (autorun=false), we need to tell BOOMR
				// that the page has loaded OK.
				BOOMR.page_ready();
			}

			hooked = true;

			return this;
		},
		/**
		 * Called by a framework when a route change has happened
		 */
		route_change: function() {
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
				initiator: "spa",
				url: url
			};

			if (!initialRouteChangeCompleted) {
				// if we haven't completed our initial SPA navigation yet (this is a hard nav), wait
				// for all of the resources to be downloaded
				resource.onComplete = function() {
					initialRouteChangeCompleted = true;
				};
			}

			// start listening for changes
			resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

			// re-enable AutoXHR if it's enabled in config.js
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
		}
	};

}(BOOMR.window));
