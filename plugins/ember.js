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
 * If that isn't the case it will extend() Ember.Route to with the action didTransition and activate
 * Once didTransition has triggered we set our selfs up for the Run-Loop coming to 'afterRender' at which
 * point we configure our Beacon data and run BOOMR.responseEnd should this not be the first beacon we send.
 */

(function() {
	var initialRouteChangeCompleted = false,
	    requestStart = 0,
	    autoXhrEnabled = false;

	if (BOOMR.plugins.Ember || !BOOMR.plugins.AutoXHR) {
		return;
	}

	/**
	 * Debug logging for this App
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(msg, "Ember");
	}

	function startMOListener() {
		requestStart = initialRouteChangeCompleted ? BOOMR.now() : BOOMR.plugins.RT.navigationStart();

		var resource = {
			timing: {
				requestStart: requestStart
			},
			initiator: "spa",
			url: BOOMR.window.document.URL
		};
		// start listening for changes
		resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);
	}

	BOOMR.plugins.Ember = {
		activate: function() {
			// Make sure the original didTransition callback is called before we procede.
			this._super.apply(arguments);
			log("activate" + BOOMR.utils.objectToString(arguments));

			startMOListener();

			log("activate: " + BOOMR.now());
		},
		didTransition: function() {
			// Make sure the original didTransition callback is called before we procede.
			this._super();
			log("didTransition");

			// Make sure the site has finished running before we beacon
			// We're also not guaranteed to have an Ember Object in our
			// global scope so using the one from BOOMR.window is better
			BOOMR.window.Ember.run.scheduleOnce("afterRender", function() {

				BOOMR.addVar("u", BOOMR.window.document.URL);
				BOOMR.addVar("http.initiator", "spa");

				initialRouteChangeCompleted = true;

				if (autoXhrEnabled) {
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}
				log("Render Finished:" + BOOMR.now() + " for URL: " + BOOMR.window.document.URL + " time since requestStart " + (BOOMR.now() - requestStart));
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
					activate: BOOMR.plugins.Ember.activate,
					actions: {
						didTransition: BOOMR.plugins.Ember.didTransition
					}
				});
			}
			else {
				App.ApplicationRoute = BOOMR.window.Ember.Route.extend({
					activate: BOOMR.plugins.Ember.activate,
					actions: {
						didTransition: BOOMR.plugins.Ember.didTransition
					}
				});
			}

		}
	};
}(BOOMR.window));
