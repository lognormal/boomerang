/*global Ember,App*/
window.App = Ember.Application.create({
	LOG_TRANSITIONS: false,
	LOG_TRANSITIONS_INTERNAL: false
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
						}, 1000);
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
		return Ember.$.getJSON("support/widget.json");
	}
});

App.WidgetRoute = Ember.Route.extend({
	beforeModel: function() {
		return Ember.$.get("support/widget.html").then(function(data) {
			Ember.TEMPLATES.widget = Ember.Handlebars.compile(data);
		});
	},
	model: function(params)  {
		return Ember.$.getJSON("support/widget.json").then(function(data) {
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
		return Ember.$.getJSON("support/widget.json");
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

	if (window.BOOMR && BOOMR.version) {
		if (BOOMR.plugins.Ember) {
			BOOMR.plugins.Ember.hook(App);
		}
	}
});
