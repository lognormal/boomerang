/*global Ember,App*/
window.App = Ember.Application.create({
	LOG_TRANSITIONS: true,
	LOG_TRANSITIONS_INTERNAL: true
});

Ember.Handlebars.helper("random", function() {
	return new Ember.Handlebars.SafeString(Math.floor(Math.random() * 1000 * 1000) + "");
});
App.ApplicationRoute = Ember.Route.extend({
	init: function() {
		var router = this;
		this._super.apply(arguments);
		Ember.run.scheduleOnce("afterRender", function() {
			if (typeof window.ember_nav_routes !== "undefined" &&
			    Object.prototype.toString.call(window.ember_nav_routes) === "[object Array]") {
				BOOMR.subscribe("onbeacon", function(beacon) {
					// only continue for SPA beacons
					if (!BOOMR.utils.inArray(beacon["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS)) {
						return;
					}

					if (window.ember_nav_routes.length > 0) {
						var nextRoute = window.ember_nav_routes.shift();
						setTimeout(function() {
							router.transitionTo(nextRoute);
						}, 100);
					}
				});
			}
		});
	}
});

App.WidgetsRoute = Ember.Route.extend({
	beforeModel: function() {
		return Ember.$.get("support/widgets.html?rnd=" + Math.random()).then(function(data) {
			Ember.TEMPLATES.widgets = Ember.Handlebars.compile(data);
		});
	},
	model: function() {
		return Ember.$.getJSON("support/widgets.json?rnd=" + Math.random());
	}
});

App.WidgetsWidgetRoute = Ember.Route.extend({
	beforeModel: function() {
		return Ember.$.get("support/widget.html?rnd=" + Math.random()).then(function(data) {
			Ember.TEMPLATES.widget = Ember.Handlebars.compile(data);
		});
	},
	model: function(params)  {
		return Ember.$.getJSON("support/widgets.json?rnd=" + Math.random()).then(function(data) {
			return data.filter(function(model) {
				return String(model.id) === params.id;
			})[0];
		});
	}
});

App.WidgetRoute = App.WidgetsWidgetRoute;

App.HomeRoute = Ember.Route.extend({
	beforeModel: function() {
		if (!Ember.TEMPLATES.home) {
			return Ember.$.get("support/home.html?rnd=" + Math.random()).then(function(data) {
				Ember.TEMPLATES.home = Ember.Handlebars.compile(data);
			});
		}
	},
	model: function() {
		return Ember.$.getJSON("support/widgets.json?rnd=" + Math.random()).then(function(data) {
			var model = {};
			model.widgets = data;
			model.imgs = typeof window.imgs !== "undefined" ? window.imgs : [0];
			console.log(model.imgs);
			model.hide = model.imgs[0] === -1;
			model.rnd = Math.random();
			return model;
		});
	}
});

App.EmptyRoute = Ember.Route.extend({
	beforeModel: function() {
	},
	model: function() {
		return {};
	}
});

App.Router.map(function() {
	this.resource("widgets");
	this.resource("widget", {path: "widgets/:id"});

	this.resource("empty", { path: "empty" });

	this.route("home", { path: "" });

	window.custom_metric_1 = 11;
	window.custom_metric_2 = function() {
		return 22;
	};

	window.custom_timer_1 = 11;
	window.custom_timer_2 = function() {
		return 22;
	};

	if (typeof window.performance !== "undefined" &&
	    typeof window.performance.mark === "function") {
		window.performance.mark("mark_usertiming");
	}

	var hadRouteChange = false;
	var hadRouteChangeToggle = function() {
		hadRouteChange = true;
	};

	if (App.ApplicationRoute) {
		App.ApplicationRoute.reopen({
			activate: hadRouteChangeToggle
		});
	}
	else {
		App.ApplicationRoute = Ember.Route.extend({
			activate: hadRouteChangeToggle
		});
	}

	var hookOptions = {};
	if (window.ember_route_wait) {
		hookOptions.routeChangeWaitFilter = window.ember_route_wait;
	}

	if (window.ember_route_filter) {
		hookOptions.routeFilter = window.ember_route_filter;
	}

	function hookEmberBoomerang() {
		if (window.BOOMR && BOOMR.version) {
			if (BOOMR.plugins && BOOMR.plugins.Ember) {
				BOOMR.plugins.Ember.hook(App, hadRouteChange, hookOptions);
			}
			return true;
		}
	}


	if (!hookEmberBoomerang()) {
		if (document.addEventListener) {
			document.addEventListener("onBoomerangLoaded", hookEmberBoomerang);
		}
		else if (document.attachEvent) {
			document.attachEvent("onpropertychange", function(e) {
				e = e || window.event;
				if (e && e.propertyName === "onBoomerangLoaded") {
					hookEmberBoomerang();
				}
			});
		}
	}
});

if (window.html5_mode) {
	App.Router.reopen({
		location: "history",
		rootURL: ""
	});
}
