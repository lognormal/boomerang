/*global BOOMR*/

/**
 * Add this to the end of your route definitions
 * Router.map(function() {
 *   if (window.BOOMR && BOOMR.version) {
 *     if (BOOMR.plugins.Ember) {
 *       BOOMR.plugins.Ember.hook(App);
 *     }
 *   }
 * });
 *
 * BOOMR.plugins.Ember will take your Application and test if it has ApplicationRoute setup at this point.
 * If that isn't the case it will extend() Ember.Route to with the actions willTransition and didTransition
 * Once didTransition has triggered we set our selfs up for the Run-Loop coming to 'afterRender' at which
 * point we configure our Beacon data and run BOOMR.responseEnd should this not be the first beacon we send.
 */

(function() {
	var initialRouteChangeCompleted = false,
	    lastLocationChange = "",
	    requestStart = 0,
	    appname = "",
	    autoXhrEnabled = false,
	    resource;

	if (BOOMR.plugins.Ember || !BOOMR.plugins.AutoXHR) {
		return;
	}

	/**
	 * Debug logging for this App
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(appname, msg, "Ember");
	}

	function buildResource(url, cb) {
		// construct the resource we'll be waiting for
		return {
			timing: {
				requestStart: requestStart
			},
			initiator: "spa",
			url: url,
			onComplete: cb
		};
	}

	function startMOListener() {
		resource = buildResource(BOOMR.window.document.URL, function() {
			BOOMR.plugins.RT.done();
		});

		// start listening for changes
		resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

		return resource.index;
	}

	BOOMR.plugins.Ember = {
		willTransition: function(transition) {
			// Make sure the original didTransition callback is called before we procede.
			this._super(transition);
			log("willTransition");

			if (transition &&
			    transition.intent &&
			    transition.intent.url) {
				lastLocationChange = transition.intent.url;
			}

			var url = lastLocationChange ? lastLocationChange : BOOMR.window.document.URL;

			resource = buildResource(url);

			// willTransition is only called on in-app transitions so safe
			// call to go for requestStart to be now()
			requestStart = BOOMR.now();

			startMOListener();

			log("willTransition: " + BOOMR.now());
		},
		didTransition: function() {
			// Make sure the original didTransition callback is called before we procede.
			this._super();
			log("didTransition");

			if (!initialRouteChangeCompleted) {
				requestStart = BOOMR.plugins.RT.navigationStart();
			}

			// Make sure the site has finished running before we beacon
			// We're also not guaranteed to have an Ember Object in our
			// global scope so using the one from BOOMR.window is better
			BOOMR.window.Ember.run.scheduleOnce("afterRender", function() {

				BOOMR.addVar("u", BOOMR.window.document.URL);
				BOOMR.addVar("http.initiator", "spa");

				log("Render Finished:" + BOOMR.now() + " for URL: " + BOOMR.window.document.URL + " time since requestStart " + (BOOMR.now() - requestStart));

				// didTransition is the only action called on initial Page Build so we need to check here for resources
				if (!initialRouteChangeCompleted) {
					if (startMOListener() === null) {
						BOOMR.plugins.RT.done();
					}
				}

				initialRouteChangeCompleted = true;

				if (autoXhrEnabled) {
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}
			});
		},
		is_complete: function() {
			return true;
		},
		init: function(config) {
			if (config && config.instrument_xhr) {
				autoXhrEnabled = config.instrument_xhr;
			}
		},
		hook: function(App) {
			if (App.ApplicationRoute) {
				App.ApplicationRoute.reopen({
					actions: {
						didTransition: BOOMR.plugins.Ember.didTransition,
						willTransition: BOOMR.plugins.Ember.willTransition
					}
				});
			}
			else {
				App.ApplicationRoute = BOOMR.window.Ember.Route.extend({
					actions: {
						didTransition: BOOMR.plugins.Ember.didTransition,
						willTransition: BOOMR.plugins.Ember.willTransition
					}
				});
			}

		}
	};
}(BOOMR.window));
