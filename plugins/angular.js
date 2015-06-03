/*
* Installation:
*
* Somewhere in your Angular app or module startup, call BOOMR.plugins.Angular.hook($rootScope).
*
* eg:
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
	    initialRouteChangeCompleted = false,
	    lastLocationChange = "",
	    autoXhrEnabled = false;

	if (BOOMR.plugins.Angular) {
		return;
	}

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

		// We need the AutoXHR plugin to operate
		if (!BOOMR.plugins.AutoXHR) {
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

		log("Startup");

		// Listen for AngularJS's $routeChangeStart, which is fired whenever a
		// route changes (i.e. a soft navigation, which is associated with the
		// URL in the address bar changing)
		$rootScope.$on("$routeChangeStart", function(event, currRoute){
			log("$routeChangeStart: " + (currRoute ? currRoute.templateUrl : ""));

			// If this was the first request, use navStart as the begin timestamp.  Otherwise, use
			// "now" as the begin timestamp.
			var requestStart = initialRouteChangeCompleted ? BOOMR.now() : BOOMR.plugins.RT.navigationStart();

			// if we were given a URL by $locationChangeStart use that, otherwise, use the document.URL
			var url = lastLocationChange ? lastLocationChange : BOOMR.window.document.URL;

			// construct the resource we'll be waiting for
			var resource = {
				timing: {
					requestStart: requestStart
				},
				initiator: "spa",
				url: url
			};

			if (!initialRouteChangeCompleted) {
				// if we haven't completed our initial SPA navigation yet (this is a hard nav), wait
				// for all of the resources to be downloaded
				resource.onComplete = function() {
					initialRouteChangeCompleted = true;
				};
			}

			// start listening for changes
			resource.index = BOOMR.plugins.AutoXHR.getMutationHandler().addEvent(resource);

			// re-enable AutoXHR if it's enabled in config.js
			if (autoXhrEnabled) {
				BOOMR.plugins.AutoXHR.enableAutoXhr();
			}
		});

		// Listen for $locationChangeStart to know the new URL when the route changes
		$rootScope.$on("$locationChangeStart", function(event, newState){
			log("$locationChangeStart: " + newState);
			lastLocationChange = newState;
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
		is_hooked: function() {
			return hooked;
		},
		init: function(config) {
			if (config && config.instrument_xhr) {
				autoXhrEnabled = config.instrument_xhr;
			}
		},
		hook: function($rootScope, hadRouteChange) {
			if (hooked) {
				return this;
			}

			if (hadRouteChange) {
				if (autoXhrEnabled) {
					// re-enable AutoXHR if it's enabled in config.js
					BOOMR.plugins.AutoXHR.enableAutoXhr();
				}

				// We missed the initial route change (we loaded too slowly), so we're too
				// late to monitor for new DOM elements.  Don't hold the initial page load beacon.
				initialRouteChangeCompleted = true;

				// Tell BOOMR this is a SPA navigation still
				BOOMR.addVar("http.initiator", "spa");

				// Since we held the original beacon (autorun=false), we need to tell BOOMR
				// that the page has loaded OK.
				BOOMR.page_ready();
			}

			if (bootstrap($rootScope)) {
				hooked = true;
			}

			return this;
		}
	};

}(BOOMR.window));
