/*global angular*/
angular.module("app", ["ngResource", "ngRoute"])
	.factory("Widgets", ["$resource", function($resource) {
		// NOTE: Using absolute urls instead of relative URLs otherwise IE11 has problems
		// resolving them in html5Mode
		return {
			query: function() {
				var rnd = Math.random();

				return $resource("/pages/05-angular/support/widgets.json", {}, {
					query: { method: "GET", params: {rnd: rnd}, isArray: true }
				}).query();
			}
		};
	}])

	.controller("mainCtrl", ["$scope", "Widgets", function($scope, Widgets) {
		// these overwrite what was in the HTML
		window.custom_metric_1 = 11;
		window.custom_metric_2 = function() {
			return 22;
		};

		$scope.rnd = Math.random();

		window.custom_timer_1 = 11;
		window.custom_timer_2 = function() {
			return 22;
		};

		if (typeof window.performance !== "undefined" &&
			typeof window.performance.mark === "function") {
			window.performance.mark("mark_usertiming");
		}

		$scope.imgs = typeof window.angular_imgs !== "undefined" ? window.angular_imgs : [0];
		$scope.hide_imgs = $scope.imgs[0] === -1;

		if (typeof $scope.widgets === "undefined") {
			$scope.widgets = Widgets.query(function() {
				window.lastWidgetJsonTimestamp = +(new Date());
			});
		}
	}])

	.controller("widgetDetailCtrl", ["$scope", "Widgets", "$routeParams", function($scope, Widgets, $routeParams) {
		Widgets.query().$promise.then(function(widgets) {
			$scope.rnd = Math.random();

			var wid = parseInt($routeParams.widgetId);

			for (var i = 0; i < widgets.length; i++) {
				if (widgets[i].id === wid) {
					$scope.widget = widgets[i];
					break;
				}
			}
		});
	}])

	.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
		if (typeof window.angular_html5_mode !== "undefined" && window.angular_html5_mode) {
			$locationProvider.html5Mode(true);
		}

		// NOTE: Using absolute urls instead of relative URLs otherwise IE11 has problems
		// resolving them in html5Mode
		$routeProvider.
			when("/widgets/:widgetId", {
				templateUrl: "/pages/05-angular/support/widget.html",
				controller: "widgetDetailCtrl"
			}).
			when("/04-route-change.html", {
				templateUrl: "/pages/05-angular/support/home.html",
				controller: "mainCtrl"
			}).
			when("/24-route-filter.html", {
				templateUrl: "/pages/05-angular/support/home.html",
				controller: "mainCtrl"
			}).
			when("/08-no-resources.html", {
				template: "<h1>Empty</h1>"
			}).
			when("/empty", {
				template: "<h1>Empty</h1>"
			}).
			otherwise({
				templateUrl: "/pages/05-angular/support/home.html",
				controller: "mainCtrl"
			});
	}])

	.run(["$rootScope", "$location", "$timeout", function($rootScope, $location, $timeout) {
		var hadRouteChange = false;

		$rootScope.$on("$routeChangeStart", function() {
			hadRouteChange = true;
		});

		var hookOptions = {};
		if (window.angular_route_wait) {
			hookOptions.routeChangeWaitFilter = window.angular_route_wait;
		}

		if (window.angular_route_filter) {
			hookOptions.routeFilter = window.angular_route_filter;
		}

		function hookAngularBoomerang() {
			if (window.BOOMR && BOOMR.version) {
				if (BOOMR.plugins && BOOMR.plugins.Angular) {
					BOOMR.plugins.Angular.hook($rootScope, hadRouteChange, hookOptions);
				}
				return true;
			}
		}

		if (!hookAngularBoomerang()) {
			if (document.addEventListener) {
				document.addEventListener("onBoomerangLoaded", hookAngularBoomerang);
			}
			else if (document.attachEvent) {
				document.attachEvent("onpropertychange", function(e) {
					e = e || window.event;
					if (e && e.propertyName === "onBoomerangLoaded") {
						hookAngularBoomerang();
					}
				});
			}
		}


		if (typeof window.angular_nav_routes !== "undefined" &&
			Object.prototype.toString.call(window.angular_nav_routes) === "[object Array]") {
			BOOMR.subscribe("onbeacon", function(beacon) {
				// only continue for SPA beacons
				if (!BOOMR.utils.inArray(beacon["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS)) {
					return;
				}

				if (window.angular_nav_routes.length > 0) {
					var nextRoute = window.angular_nav_routes.shift();

					$timeout(function() {
						$location.url(nextRoute);
					}, 100);
				}
			});
		}
	}]);
