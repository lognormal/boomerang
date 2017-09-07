/**
 * @module Angular
 * @desc
 * Installation:
 *
 * Somewhere in your Angular app or module startup, call BOOMR.plugins.Angular.hook($rootScope).
 *
 * @example
 * angular.module('app')
 *   .run(['$rootScope', function($rootScope) {
 *     var hadRouteChange = false;
 *     $rootScope.$on("$routeChangeStart", function() {
 *       hadRouteChange = true;
 *     });
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
			BOOMR.debug($rootScope.$id + ": " + msg, "angular");
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
		is_complete: function() {
			return true;
		},
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
