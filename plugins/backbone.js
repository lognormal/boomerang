/**
 * @module Backbone
 * @desc
 * Installation:
 *
 * Before you call `Backbone.history.start()`, add the following code.
 *
 * Substitute `app.Router` in the two places below with your Backbone.Router instance.
 *
 * @example
 *     // ...Backbone startup..., eg. app.Router = Backbone.Router.extend({...});
 *     var hadRouteChange = false;
 *     app.Router.on("route", function() {
 *       hadRouteChange = true;
 *     });
 *     function hookBackboneBoomerang() {
 *       if (window.BOOMR && BOOMR.version) {
 *         if (BOOMR.plugins && BOOMR.plugins.Backbone) {
 *           BOOMR.plugins.Backbone.hook(app.Router, hadRouteChange);
 *         }
 *         return true;
 *       }
 *     }
 *
 *     if (!hookBackboneBoomerang()) {
 *       if (document.addEventListener) {
 *         document.addEventListener("onBoomerangLoaded", hookBackboneBoomerang);
 *       } else if (document.attachEvent) {
 *         document.attachEvent("onpropertychange", function(e) {
 *           e = e || window.event;
 *           if (e && e.propertyName === "onBoomerangLoaded") {
 *             hookBackboneBoomerang();
 *           }
 *         });
 *       }
 *   }]);
 */
(function() {
	var hooked = false,
	    enabled = true,
	    hadMissedRouteChange = false;

	if (BOOMR.plugins.Backbone || typeof BOOMR.plugins.SPA === "undefined") {
		return;
	}

	// register as a SPA plugin
	BOOMR.plugins.SPA.register("Backbone");

	/**
	 * Bootstraps the Backbone plugin
	 *
	 * @param {Backbone.Router} router Backbone router
	 *
	 * @return {boolean} True on success
	 */
	function bootstrap(router) {
		if (typeof BOOMR.window.Backbone === "undefined" ||
		    typeof router === "undefined") {
			return false;
		}

		// We need the AutoXHR and SPA plugins to operate
		if (!BOOMR.plugins.AutoXHR ||
		    !BOOMR.plugins.SPA) {
			return false;
		}

		/**
		 * Debug logging
		 *
		 * @param {string} msg Message
		 */
		function log(msg) {
			BOOMR.debug(msg, "backbone");
		}

		log("Startup");

		// Listen for the 'route' event on the Backbone Router, which is fired whenever a
		// route changes (i.e. a soft navigation, which is associated with the
		// URL in the address bar changing)
		router.on("route", function() {
			if (!enabled) {
				hadMissedRouteChange = true;
				return;
			}

			BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), BOOMR.window.document.URL]);

			log("route");
			BOOMR.plugins.SPA.route_change();
		});

		return true;
	}

	//
	// Exports
	//
	BOOMR.plugins.Backbone = {
		is_complete: function() {
			return true;
		},
		hook: function(router, hadRouteChange, options) {
			if (hooked) {
				return this;
			}

			if (bootstrap(router)) {
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
}(BOOMR.window));
