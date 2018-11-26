/**
 * The `Ember` plugin allows you to automatically monitor Single Page
 * App (SPA) navigations for [Ember.js]{@link https://www.emberjs.com/}
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
 * * Ember.js 1.x
 *
 * **Note**: For Ember.js 2.x, use the {@link BOOMR.plugins.History} plugin.
 *
 * Ember-CLI is not currently supported.
 *
 * ## Beacon Parameters
 *
 * This plugin does not add any additional beacon parameters beyond the
 * {@link BOOMR.plugins.SPA} plugin.
 *
 * ## Usage
 *
 * First, include the {@link BOOMR.plugins.SPA}, {@link BOOMR.plugins.Ember}
 * and {@link BOOMR.plugins.AutoXHR} plugins.  See {@tutorial building} for details.
 *
 * Next, you need to also "hook" Boomerang into the Ember.js lifecycle events.
 *
 * Add the following code to the end of your route definitions, substituting `App`
 * for your Ember app.
 *
 * Example:
 *
 * ```
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
 * ```
 *
 * @class BOOMR.plugins.Ember
 */
(function() {
	var hooked = false,
	    routeHooked = false,
	    enabled = true,
	    hadMissedRouteChange = false;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

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
		 * Called for the Ember `beforeModel` event.
		 *
		 * Often the first route-change event for a model.
		 *
		 * @param {object} transition Ember transition
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
		 * Called for the Ember `willTransition` event.
		 *
		 * Subsequent navigations will use `willTransition`
		 *
		 * @param {object} transition Ember transition
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
		 * Called for the Ember `willTransition` event.
		 *
		 * @param {object} transition Ember transition
		 */
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
		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Ember
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Hooks Boomerang into the Ember.js lifecycle events
		 *
		 * @param {object} $rootScope Ember.js router
		 * @param {boolean} [hadRouteChange] Whether or not there was a route change
		 * event prior to this `hook()` call
		 * @param {object} [options] Options
		 *
		 * @returns {@link BOOMR.plugins.Ember} The Ember plugin for chaining
		 * @memberof BOOMR.plugins.Ember
		 */
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

		/**
		 * Disables the Ember plugin
		 *
		 * @returns {@link BOOMR.plugins.Ember} The Ember plugin for chaining
		 * @memberof BOOMR.plugins.Ember
		 */
		disable: function() {
			enabled = false;
			return this;
		},

		/**
		 * Enables the Ember plugin
		 *
		 * @returns {@link BOOMR.plugins.Ember} The Ember plugin for chaining
		 * @memberof BOOMR.plugins.Ember
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
