/*global BOOMR*/

/**
 * Add this to the end of your route definitions, substituting App for your Ember
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
	var hooked = false;

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
		 * activate will be called on first navigation
		 */
		function activate() {
			// Make sure the original didTransition callback is called before we proceed.
			this._super();
			log("activate");

			BOOMR.plugins.SPA.route_change();
		}

		/**
		 * subsequent navigations will use willTransition
		 */
		function willTransition(transition) {
			log("willTransition");
			BOOMR.plugins.SPA.route_change();

			BOOMR.plugins.SPA.last_location(transition && transition.intent.url ?
							transition.intent.url :
							BOOMR.window.document.URL);
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

		return true;
	}

	//
	// Exports
	//
	BOOMR.plugins.Ember = {
		is_complete: function() {
			return true;
		},
		hook: function(App, hadRouteChange) {
			if (hooked) {
				return this;
			}

			if (hook(App)) {
				BOOMR.plugins.SPA.hook(hadRouteChange);

				hooked = true;
			}
		}
	};
}());
