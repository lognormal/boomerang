(function() {
var w = BOOMR.window,
    CONFIG,
    impl;

CONFIG = w.mPulse || w.SOASTA || w.LOGN || w;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

impl = {
	pageGroups: [],
	abTest: [],
	customTimers: [],
	customMetrics: [],

	complete: false,

	trim: function(str) {
		return str.replace(/^ +/, '').replace(/ +$/, '');
	},

	runOn: function(method, variable) {
		var i, o, components, kv, parts, parameter;

		if(!variable) {
			return;
		}

		components = variable.split(',');

		for(i=0; i<components.length; i++) {
			kv = impl.trim(components[i]).split(':');
			parameter = impl.trim(kv[0]);
			parts = impl.trim(kv[1]).split(/\./);

			o = CONFIG;
			while(o && parts.length > 0) {
				o = o[parts.shift];
			}
			if(o) {
				method(parameter, o);
			}
		}
	},

	run: function(variable) {
		impl.runOn(BOOMR.addVar, variable);
	},

	runTimer: function(variable) {
		if(BOOMR.plugins.RT) {
			impl.runOn(BOOMR.plugins.RT.setTimer, variable);
		}
	},

	pageGroupHandlers: {
		cleanUp: function(s) {
			return o.replace(/[^\w -]+/g, '');
		},

		checkURLPattern: function(u) {
			// Massage pattern into a real regex
			var re = u.replace(/[^\.]\*/g, '.*');
			try {
				re = new RegExp("^" + re + "$", "i");
			}
			catch(err) {
				BOOMR.debug("Bad pattern: " + re, "PageVars");
				BOOMR.debug(err, "PageVars");
				return false;
			}


			// Check if URL matches
			if(!re.exec(w.location.href)) {
				BOOMR.debug("No match on " + w.location.href, "PageVars");
				return false;
			}
			return true;
		},

		Custom: function(o) {
			var parts, pg;
			if(!o.parameter1) {
				return;
			}

			BOOMR.debug("Got page group variable: " + o.parameter1, "PageVars");

			// Split variable into its parts
			parts = o.parameter1.split(/\./);

			if(!parts || parts.length === 0) {
				return;
			}

			// Top part needs to be global in the primary window
			pg = w[parts.shift()];

			// Then we navigate down the object looking at each part
			// until:
			// - a part evaluates to null (we cannot proceed)
			// - a part is not an object (might be a leaf but we cannot go further down)
			// - there are no more parts left (so we can stop)
			while(pg !== null && typeof pg === "object" && parts.length) {
				BOOMR.debug("looking at " + parts[0], "PageVars");
				pg = pg[parts.shift()];
			}

			// parts.length !== 0 means we stopped before the end
			// so skip
			if(parts.length !== 0 || typeof pg === "object") {
				return;
			}

			BOOMR.debug("final value: " + pg, "PageVars");
			// Now remove invalid characters
			pg = this.cleanUp("" + pg);

			BOOMR.addVar("h.pg", pg);
		},

		URLPattern: function(o) {
			var pg, params, i, kv;
			if(!o.parameter1 || !o.parameter2) {
				return;
			}

			BOOMR.debug("Got page group URL Pattern: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			if(!this.checkURLPattern(o.parameter1)) {
				return;
			}

			// Now that we match, pull out all query string parameters
			params = w.location.search.split(/&/);

			BOOMR.debug("Got params: " + params, "PageVars");

			for(i=0; i<params.length; i++) {
				if(params[i]) {
					kv = params[i].split(/=/);
					if(kv.length && kv[0] === o.parameter2) {
						BOOMR.debug("final value: " + kv[1], "PageVars");
						pg = this.cleanUp("" + kv[1]);
						BOOMR.addVar("h.pg", pg);
						return;
					}
				}
			}
		},

		URLSubstringEndOfText: function(o) {
			return this.URLSubstringTrailingText(o);
		},

		URLSubstringTrailingText: function(o) {
			var pg, re;
			if(!o.parameter1) {
				return;
			}

			BOOMR.debug("Got page group URL Substring: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			if(!this.checkURLPattern(o.parameter1)) {
				return;
			}

			try {
				re = new RegExp("^"
						+ o.parameter1.replace(/[\W\S]/g, '\\$1')
						+ "(.*)"
						+ (o.parameter2 || "").replace(/[\W\S]/g, '\\$1')
						+ "$",
					"i")

				pg = re.exec(w.location.href);
				if(!pg || !pg.length) {
					return;
				}

				pg = this.cleanUp(pg[1]);

				BOOMR.addVar("h.pg", pg);
				return;
			}
			catch(err) {
				return;
			}

		},

		Regexp: function(o) {
		}
	},

	done: function() {
		var parts, i, o;
		if(!CONFIG) {
			impl.complete = true;
			BOOMR.sendBeacon();
			return;
		}

		// Page Groups
		for(i=0; i<impl.pageGroups; i++) {
			var o = impl.pageGroups[i];
			if(!o || typeof o !== "object" || !o.hasOwnProperty("definitionType")) {
				continue;
			}

			this[o.definitionType](o);
		}


		// AB Tests
		impl.run(impl.abTest);

		// Custom Metrics
		impl.run(impl.customMetrics)

		// Custom Time
		impl.runTimer(impl.customTimers);
	}
};


BOOMR.plugins.PageParams = {
	init: function(config) {
		var properties = ["pageGroups", "abTests", "customTimers", "customMetrics"];

		BOOMR.utils.pluginConfig(impl, config, "PageParams", properties);


		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

})();
