/**
 * The `Angular` plugin allows you to automatically monitor Single Page
 * App (SPA) navigations for [AngularJS 1.x]{@link https://angularjs.org/}
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
 * * AngularJS 1.x
 * * Router support:
 *   * {@link https://docs.angularjs.org/api/ngRoute|ngRoute}
 *   * {@link https://github.com/angular-ui/ui-router|ui-router}
 *
 * **Note**: For AngularJS 2.x, use the {@link BOOMR.plugins.History} plugin.
 *
 * ## Beacon Parameters
 *
 * This plugin does not add any additional beacon parameters beyond the
 * {@link BOOMR.plugins.SPA} plugin.
 *
 * ## Usage
 *
 * First, include the {@link BOOMR.plugins.SPA}, {@link BOOMR.plugins.Angular}
 * and {@link BOOMR.plugins.AutoXHR} plugins.  See {@tutorial building} for details.
 *
 * Next, you need to also "hook" Boomerang into the AngularJS lifecycle events.
 *
 * Somewhere in your AngularJS app or module startup, add a `.run()` block with
 * a `$rootScope` dependency.  In this run block, add the code below, calling
 * {@link BOOMR.plugins.Angular.hook}.
 *
 * Example:
 *
 * ```
 * angular.module("app")
 *   .run(["$rootScope", function($rootScope) {
 *     var hadRouteChange = false;
 *
 *     // The following listener is required if you're using ng-router
 *     $rootScope.$on("$routeChangeStart", function() {
 *       hadRouteChange = true;
 *     });
 *
 *     // The following listener is required if you're using ui-router
 *     $rootScope.$on("$stateChangeStart", function() {
 *       hadRouteChange = true;
 *     });
 *
 *     function hookAngularBoomerang() {
 *       if (window.BOOMR && BOOMR.version) {
 *         if (BOOMR.plugins && BOOMR.plugins.Angular) {
 *           BOOMR.plugins.Angular.hook($rootScope, hadRouteChange);
 *         }
 *         return true;
 *       }
 *     }
 *
 *     if (!hookAngularBoomerang()) {
 *       if (document.addEventListener) {
 *         document.addEventListener("onBoomerangLoaded", hookAngularBoomerang);
 *       } else if (document.attachEvent) {
 *         document.attachEvent("onpropertychange", function(e) {
 *           e = e || window.event;
 *           if (e && e.propertyName === "onBoomerangLoaded") {
 *             hookAngularBoomerang();
 *           }
 *         });
 *       }
 *   }]);
 * ```
 *
 * @class BOOMR.plugins.Angular
 */
(function() {
	var hooked = false,
	    enabled = true,
	    hadMissedRouteChange = false,
	    lastRouteChangeTime = 0,
	    locationChangeTrigger = false,
	    disableLocationChangeTrigger = false;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.Angular || typeof BOOMR.plugins.SPA === "undefined") {
		return;
	}

	// register as a SPA plugin
	BOOMR.plugins.SPA.register("Angular");

	/**
	 * Bootstraps the Angular plugin with the specified $rootScope of the host
	 * Angular app.
	 *
	 * @param $rootScope Host AngularJS app's $rootScope
	 *
	 * @return {boolean} True on success
	 */
	function bootstrap($rootScope) {
		if (typeof $rootScope === "undefined") {
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
			BOOMR.debug($rootScope.$id + ": " + msg, "Angular");
		}

		/**
		 * Fires the SPA route_change event.
		 *
		 * If it's been over 50ms since the last route change, fire a new
		 * route change event. Several Angular events may call this function that
		 * trigger off each other (e.g. $routeChangeStart from $locationChangeStart),
		 * so this combines them into a single route change.
		 *
		 * We also want $routeChangeStart/$stateChangeStart to trigger the route_change()
		 * if possible because those have arguments that we'll pass to the routeFilter
		 * if specified.
		 *
		 * To do this, $locationChangeStart sets a timeout before calling this
		 * that will be cleared by the $routeChangeStart/$stateChangeStart.
		 */
		function fireRouteChange() {
			var now = BOOMR.now();

			if (now - lastRouteChangeTime > 50) {
				BOOMR.plugins.SPA.route_change.call(null, null, arguments);
			}

			lastRouteChangeTime = now;

			// clear any $locationChangeStart triggers since we've handled it
			// either via $routeChangeStart or $stateChangeStart
			clearTimeout(locationChangeTrigger);
			locationChangeTrigger = false;
		}

		//
		// Traditional Angular Router events
		//

		// Listen for AngularJS's $routeChangeStart, which is fired whenever a
		// route changes (i.e. a soft navigation, which is associated with the
		// URL in the address bar changing)
		$rootScope.$on("$routeChangeStart", function(event, next, current){
			if (!enabled) {
				hadMissedRouteChange = true;
				return;
			}

			log("$routeChangeStart: " + (next ? next.templateUrl : ""));

			fireRouteChange(event, next, current);

			// Since we've seen a $routeChangeStart, we don't need to have
			// $locationChangeStarts also trigger navigations.
			disableLocationChangeTrigger = true;
		});

		// Listen for $locationChangeStart to know the new URL when the route changes
		$rootScope.$on("$locationChangeStart", function(event, newState){
			if (!enabled) {
				return;
			}

			log("$locationChangeStart: " + newState);

			BOOMR.fireEvent("spa_init", [BOOMR.plugins.SPA.current_spa_nav(), newState]);

			// If we haven't yet seen $routeChangeStart or $stateChangeStart, we might
			// be in an app that only uses $locationChangeStart to trigger navigations.
			if (!disableLocationChangeTrigger) {
				// Fire a route change (on a short delay) after this callback in case
				// $routeChangeStart is about to fire.  We'd prefer to use $routeChangeStart's
				// arguments (next, current) for any routeFilter, so use a setTimeout
				// that may be cancelled by the $routeChangeStart/$stateChangeStart event.
				locationChangeTrigger = setTimeout(fireRouteChange, 0);
			}
		});

		//
		// Angular's UI-router
		//
		$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
			if (!enabled) {
				hadMissedRouteChange = true;
				return;
			}

			log("$stateChangeStart: " + toState);

			fireRouteChange(event, toState, toParams, fromState, fromParams);

			// Since we've seen a $stateChangeStart, we don't need to have
			// $locationChangeStarts also trigger navigations.
			disableLocationChangeTrigger = true;
		});

		return true;
	}

	//
	// Exports
	//
	BOOMR.plugins.Angular = {
		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Angular
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Hooks Boomerang into the AngularJS lifecycle events
		 *
		 * @param {object} $rootScope AngularJS `$rootScope` dependecy
		 * @param {boolean} [hadRouteChange] Whether or not there was a route change
		 * event prior to this `hook()` call
		 * @param {object} [options] Options
		 *
		 * @returns {@link BOOMR.plugins.Angular} The Angular plugin for chaining
		 * @memberof BOOMR.plugins.Angular
		 */
		hook: function($rootScope, hadRouteChange, options) {
			if (hooked) {
				return this;
			}

			if (bootstrap($rootScope)) {
				BOOMR.plugins.SPA.hook(hadRouteChange, options);

				hooked = true;
			}

			return this;
		},

		/**
		 * Disables the AngularJS plugin
		 *
		 * @returns {@link BOOMR.plugins.Angular} The Angular plugin for chaining
		 * @memberof BOOMR.plugins.Angular
		 */
		disable: function() {
			enabled = false;
			return this;
		},

		/**
		 * Enables the AngularJS plugin
		 *
		 * @returns {@link BOOMR.plugins.Angular} The Angular plugin for chaining
		 * @memberof BOOMR.plugins.Angular
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
