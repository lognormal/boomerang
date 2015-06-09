/*global BOOMR*/

/**
 * Add this to the end of your route definitions
 *
 * function hookEmberBoomerang() {
 *   if (window.BOOMR && BOOMR.version) {
 *     if (BOOMR.plugins && BOOMR.plugins.Ember) {
 *       BOOMR.plugins.Ember.hook(App);
 *     }
 *     return true;
 *   }
 * }
 *
 * if (!hookEmberBoomerang()) {
 *   if (document.addEventListener) {
 *     document.addEventListener("onBoomerangLoaded", hookEmberBoomerang);
 *   }
 *   else if (document.attachEvent) {
 *     document.attachEvent("onpropertychange", function(e) {
 *       e = e || window.event;
 *       if (e && e.propertyName === "onBoomerangLoaded") {
 *         hookEmberBoomerang();
 *       }
 *     });
 *   }
 * }
 *
 * BOOMR.plugins.Ember will take your Application and test if it has ApplicationRoute setup at this point.
 * If that isn't the case it will extend() Ember.Route to with the action didTransition and activate
 * Once didTransition has triggered we set our selfs up for the Run-Loop coming to 'afterRender' at which
 * point we configure our Beacon data and run BOOMR.responseEnd should this not be the first beacon we send.
 */

(function() {
	var initialRouteChangeCompleted = false,
	    requestStart = 0,
	    hooked = false,
	    autoXhrEnabled = false,
	    container;

	if (BOOMR.plugins.Ember || !BOOMR.plugins.AutoXHR) {
		return;
	}

	/**
	 * Debug logging for this App
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		var currentRouteName = container.lookup("controller:application") ? container.lookup("controller:application").get("currentRouteName") + " " : "";
		BOOMR.debug( currentRouteName + msg, "Ember");
	}

	function hook(App) {

		function changeStart(transition) {
			BOOMR.addVar("http.initiator", "spa");

			var url = transition && transition.intent.url ? transition.intent.url : BOOMR.window.document.URL;
			requestStart = initialRouteChangeCompleted ? BOOMR.now() : BOOMR.plugins.RT.navigationStart();

			var resource = {
				timing: {
					requestStart: requestStart
				},
				initiator: "spa",
				url: url
			};

			if (!initialRouteChangeCompleted) {
				resource.onComplete = function() {
					initialRouteChangeCompleted = true;
				};
			}

			// start listening for changes
			resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

			if (autoXhrEnabled) {
				BOOMR.plugins.AutoXHR.enableAutoXhr();
			}
		}

		function activate() {
			// Make sure the original didTransition callback is called before we proceed.
			this._super();
			log("activate");
			changeStart();
		}

		function willTransition(transition) {
			// Make sure the original didTransition callback is called before we proceed.
			log("willTransition");
			changeStart(transition);

			return true;
		}

		if (App.ApplicationRoute) {
			App.ApplicationRoute.reopen({
				activate: activate,
				actions: {
					willTransition: willTransition
				}
			});
		}
		else {
			App.ApplicationRoute = BOOMR.window.Ember.Route.extend({
				activate: activate,
				actions: {
					willTransition: willTransition
				}
			});
		}

		container = App.__container__;
	}

	BOOMR.plugins.Ember = {
		is_complete: function() {
			return true;
		},
		init: function(config) {
			if (config && config.instrument_xhr) {
				autoXhrEnabled = config.instrument_xhr;
			}
		},
		hook: function(App, hadRouteChange) {

			if (hooked) {
				return this;
			}

			if (hadRouteChange) {
				if (autoXhrEnabled) {
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}

				initialRouteChangeCompleted = true;
				BOOMR.addVar("http.initiator", "spa");
				BOOMR.page_ready();
			}

			if (hook(App) ) {
				hooked = true;
			}
		}
	};
}(BOOMR.window));
