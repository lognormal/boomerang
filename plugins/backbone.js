/**
 * The `Backbone` plugin allows you to automatically monitor Single Page
 * App (SPA) navigations for [Backbone.js]{@link https://backbonejs.org/}
 * websites.
 *
 * **Note**: This plugin requires the {@link BOOMR.plugins.AutoXHR} and
 * {@link BOOMR.plugins.SPA} plugins to be loaded first (in that order).
 *
 * For details on how Boomerang Single Page App instrumentation works, see the
 * {@link BOOMR.plugins.SPA} documentation.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Compatibility
 *
 * * Backbone.js 1.x
 *
 * ## Beacon Parameters
 *
 * This plugin does not add any additional beacon parameters beyond the
 * {@link BOOMR.plugins.SPA} plugin.
 *
 * ## Usage
 *
 * First, include the {@link BOOMR.plugins.SPA}, {@link BOOMR.plugins.Backbone}
 * and {@link BOOMR.plugins.AutoXHR} plugins.  See {@tutorial building} for details.
 *
 * Next, you need to also "hook" Boomerang into the Backbone.js lifecycle events.
 *
 * Before you call `Backbone.history.start()`, add the following code.
 *
 * Substitute `app.Router` in the two places below with your `Backbone.Router` instance.
 *
 * Example:
 *
 * ```
 * // ...Backbone startup..., eg. app.Router = Backbone.Router.extend({...});
 * var hadRouteChange = false;
 *
 * app.Router.on("route", function() {
 *   hadRouteChange = true;
 * });
 *
 * function hookBackboneBoomerang() {
 *   if (window.BOOMR && BOOMR.version) {
 *     if (BOOMR.plugins && BOOMR.plugins.Backbone) {
 *       BOOMR.plugins.Backbone.hook(app.Router, hadRouteChange);
 *     }
 *     return true;
 *   }
 * }
 *
 * if (!hookBackboneBoomerang()) {
 *   if (document.addEventListener) {
 *     document.addEventListener("onBoomerangLoaded", hookBackboneBoomerang);
 *   } else if (document.attachEvent) {
 *     document.attachEvent("onpropertychange", function(e) {
 *       e = e || window.event;
 *       if (e && e.propertyName === "onBoomerangLoaded") {
 *         hookBackboneBoomerang();
 *       }
 *     });
 *   }
 * }]);
 * ```
 *
 * @class BOOMR.plugins.Backbone
 */
(function() {
	var hooked = false,
	    enabled = true,
	    hadMissedRouteChange = false;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

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
			BOOMR.debug(msg, "Backbone");
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
		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Backbone
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Hooks Boomerang into the Backbone lifecycle events
		 *
		 * @param {object} $rootScope Backbone router
		 * @param {boolean} [hadRouteChange] Whether or not there was a route change
		 * event prior to this `hook()` call
		 * @param {object} [options] Options
		 *
		 * @returns {@link BOOMR.plugins.Backbone} The Backbone plugin for chaining
		 * @memberof BOOMR.plugins.Backbone
		 */
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

		/**
		 * Disables the Backbone plugin
		 *
		 * @returns {@link BOOMR.plugins.Backbone} The Backbone plugin for chaining
		 * @memberof BOOMR.plugins.Backbone
		 */
		disable: function() {
			enabled = false;
			return this;
		},

		/**
		 * Enables the Backbone plugin
		 *
		 * @returns {@link BOOMR.plugins.Backbone} The Backbone plugin for chaining
		 * @memberof BOOMR.plugins.Backbone
		 */
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
