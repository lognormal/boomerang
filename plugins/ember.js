/*global BOOMR*/

/**
 * @namespace Ember
 * @desc
 * Add this to the end of your route definitions, substituting App for your Ember
 * BOOMR.plugins.Ember will take your Application and test if it has ApplicationRoute setup at this point.
 * If that isn't the case it will extend() Ember.Route to with the action didTransition and activate
 * Once didTransition has triggered we set our selfs up for the Run-Loop coming to 'afterRender' at which
 * point we configure our Beacon data and run BOOMR.responseEnd should this not be the first beacon we send.
 *
 * @example
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
 */

(function() {
	var hooked = false,
	    routeHooked = false,
	    enabled = true,
	    hadMissedRouteChange = false;

	if (BOOMR.plugins.Ember || typeof BOOMR.plugins.SPA === "undefined") {
		return;
	}

	// register as a SPA plugin
	BOOMR.plugins.SPA.register("Ember");

	function hook(App) {
		if (typeof App === "undefined") {
			return false;
		}

		// We need the AutoXHR and SPA plugins to operate
		if (!BOOMR.plugins.AutoXHR ||
		    !BOOMR.plugins.SPA) {
			return false;
		}

		/**
		 * Debug logging for this $rootScope's ID
		 *
		 * @param {string} msg Message
		 */
		function log(msg) {
			BOOMR.debug(msg, "Ember");
		}

		log("Startup");

		/**
		 * beforeModel even earlier than activate
		 */
		function beforeModel(transition) {
			// Make sure the original beforeModel callback is called before we proceed.
			this._super(transition);

			if (!enabled) {
				hadMissedRouteChange = true;

				return true;
			}

			log("beforeModel");

			if (transition && transition.intent && transition.intent.url) {
				log("[beforeModel] LastLocation: " + transition.intent.url);
				BOOMR.plugins.SPA.last_location(transition.intent.url);
				transition.promise.then(function() {
					BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), BOOMR.window.document.URL]);
				});
			}

			if (!routeHooked) {
				BOOMR.plugins.SPA.route_change();
				routeHooked = true;
			}

			return true;
		}

		/**
		 * subsequent navigations will use willTransition
		 */
		function willTransition(transition) {
			this._super(transition);

			if (!enabled) {
				hadMissedRouteChange = true;

				return true;
			}

			log("willTransition");

			if (transition && transition.intent && transition.intent.url) {
				log("[willTransition] LastLocation: " + transition.intent.url);
				BOOMR.plugins.SPA.last_location(transition.intent.url);

				transition.promise.then(function() {
					BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), BOOMR.window.document.URL]);
				});
			}

			if (!routeHooked) {
				BOOMR.plugins.SPA.route_change();
				routeHooked = true;
			}
			return true;
		}

		function didTransition(transition) {
			this._super(transition);

			if (!enabled) {
				return true;
			}

			log("didTransition");
			routeHooked = false;
		}

		if (App.ApplicationRoute) {
			App.ApplicationRoute.reopen({
				beforeModel: beforeModel,
				actions: {
					willTransition: willTransition,
					didTransition: didTransition
				}
			});
		}
		else {
			App.ApplicationRoute = BOOMR.window.Ember.Route.extend({
				beforeModel: beforeModel,
				actions: {
					willTransition: willTransition,
					didTransition: didTransition
				}
			});
		}

		return true;
	}

	//
	// Exports
	//
	BOOMR.plugins.Ember = {
		is_complete: function() {
			return true;
		},
		hook: function(App, hadRouteChange, options) {
			if (hooked) {
				return this;
			}

			if (hook(App)) {
				BOOMR.plugins.SPA.hook(hadRouteChange, options);
				hooked = true;
			}
			return this;
		},
		disable: function() {
			enabled = false;
			return this;
		},
		enable: function() {
			enabled = true;

			if (hooked && hadMissedRouteChange) {
				hadMissedRouteChange = false;
				BOOMR.plugins.SPA.route_change();
			}

			return this;
		}
	};
}());
