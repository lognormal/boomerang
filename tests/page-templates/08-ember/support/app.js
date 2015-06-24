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
				BOOMR.subscribe("onbeacon", function() {
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
		return Ember.$.get("support/widgets.html").then(function(data) {
			Ember.TEMPLATES.widgets = Ember.Handlebars.compile(data);
		});
	},
	model: function() {
		return Ember.$.getJSON("support/widgets.json");
	}
});

App.WidgetRoute = Ember.Route.extend({
	beforeModel: function() {
		return Ember.$.get("support/widget.html").then(function(data) {
			Ember.TEMPLATES.widget = Ember.Handlebars.compile(data);
		});
	},
	model: function(params)  {
		return Ember.$.getJSON("support/widgets.json").then(function(data) {
			return data.filter(function(model) {
				return String(model.id) === params.id;
			})[0];
		});
	}
});

App.MetricRoute = Ember.Route.extend({
	beforeModel: function() {
		return Ember.$.get("support/metric.html").then(function(data) {
			Ember.TEMPLATES.metric = Ember.Handlebars.compile(data);
		});
	},
	model: function() {
		return Ember.$.getJSON("support/widgets.json").then(function(data) {
			data.imgs = window.imgs ? window.imgs : [];

			return data;
		});
	}
});

App.Router.map(function() {
	this.resource("widgets", {path: "/widgets"});
	this.resource("widget", {path: "/widget/:id"});
	this.route("metric", { path: "/" });

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

	function hookEmberBoomerang() {
		if (window.BOOMR && BOOMR.version) {
			if (BOOMR.plugins && BOOMR.plugins.Ember) {
				BOOMR.plugins.Ember.hook(App, hadRouteChange);
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
	var path = window.location.pathname.split("/"),
	    rootURL = "/" + path[path.length-1];

	App.Router.reopen({
		location: "history",
		rootURL: rootURL
	});
}
