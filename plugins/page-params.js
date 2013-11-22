(function() {
var w = BOOMR.window,
    l = w.location,
    d = w.document,
    impl;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

impl = {
	pageGroups: [],
	abTests: [],
	customTimers: [],
	customMetrics: [],

	complete: false,

	trim: function(str) {
		return str.replace(/^ +/, '').replace(/ +$/, '');
	},

	varHandlers: {
		cleanUp: function(s) {
			return o.replace(/[^\w -]+/g, '');
		},

		handleRegEx: function(re, extract, varname, callback) {
			var value, m;

			try {
				re = new RegExp(re, "i");
			}
			catch(err) {
				BOOMR.debug("Error generating regex: " + err, "PageVars");
				return;
			}

			m = re.exec(l.href);

			if(!m || !m.length) {
				return;
			}

			value = extract.replace(
				/\$([1-9])/g,
				function(m0, m1) {
					return m[parseInt(m1, 10)];
				});

			value = this.cleanUp(value);

			callback(varname, value);
		},

		Custom: function(o, varname, callback) {
			var parts, value;

			BOOMR.debug("Got variable: " + o.parameter1, "PageVars");

			// Split variable into its parts
			parts = o.parameter1.split(/\./);

			if(!parts || parts.length === 0) {
				return;
			}

			// Top part needs to be global in the primary window
			value = w[parts.shift()];

			// Then we navigate down the object looking at each part
			// until:
			// - a part evaluates to null (we cannot proceed)
			// - a part is not an object (might be a leaf but we cannot go further down)
			// - there are no more parts left (so we can stop)
			while(value !== null && typeof value === "object" && parts.length) {
				BOOMR.debug("looking at " + parts[0], "PageVars");
				value = value[parts.shift()];
			}

			// parts.length !== 0 means we stopped before the end
			// so skip
			if(parts.length !== 0 || typeof value === "object") {
				return;
			}

			BOOMR.debug("final value: " + value, "PageVars");
			// Now remove invalid characters
			value = this.cleanUp("" + value);

			callback(varname, value);
		},

		URLPattern: function(o, varname, callback) {
			var value, re, params, i, kv;
			if(!o.parameter2) {
				return;
			}

			BOOMR.debug("Got URL Pattern: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			// Massage pattern into a real regex
			o.parameter1.replace(/[^\.]\*/g, '.*');
			try {
				re = new RegExp("^" + re + "$", "i");
			}
			catch(err) {
				BOOMR.debug("Bad pattern: " + re, "PageVars");
				BOOMR.debug(err, "PageVars");
				return;
			}


			// Check if URL matches
			if(!re.exec(l.href)) {
				BOOMR.debug("No match on " + l.href, "PageVars");
				return;
			}

			// Now that we match, pull out all query string parameters
			params = l.search.split(/&/);

			BOOMR.debug("Got params: " + params, "PageVars");

			for(i=0; i<params.length; i++) {
				if(params[i]) {
					kv = params[i].split(/=/);
					if(kv.length && kv[0] === o.parameter2) {
						BOOMR.debug("final value: " + kv[1], "PageVars");
						value = this.cleanUp("" + kv[1]);
						callback(varname, value);
						return;
					}
				}
			}
		},

		URLSubstringEndOfText: function(o, varname, callback) {
			return this.URLSubstringTrailingText(o, varname, callback);
		},

		URLSubstringTrailingText: function(o, varname, callback) {
			BOOMR.debug("Got URL Substring: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			this.handleRegEx("^"
						+ o.parameter1.replace(/[\W\S]/g, '\\$1')
						+ "(.*)"
						+ (o.parameter2 || "").replace(/[\W\S]/g, '\\$1')
						+ "$",
					"$1",
					varname,
					callback);
		},

		Regexp: function(o, varname, callback) {
			if(!o.parameter2) {
				return;
			}

			BOOMR.debug("Got RegEx: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			this.handleRegEx(o.parameter1, o.parameter2, varname, callback);
		},

		URLPatternType: function(o, varname, callback) {
			var value, re, el;
			if(!o.parameter2) {
				return;
			}

			BOOMR.debug("Got XPath: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			// Massage pattern into a real regex
			o.parameter1.replace(/[^\.]\*/g, '.*');
			try {
				re = new RegExp("^" + re + "$", "i");
			}
			catch(err) {
				BOOMR.debug("Bad pattern: " + re, "PageVars");
				BOOMR.debug(err, "PageVars");
				return;
			}


			// Check if URL matches
			if(!re.exec(l.href)) {
				BOOMR.debug("No match on " + l.href, "PageVars");
				return;
			}

			if(d.evaluate) {
				el = d.evaluate(o.parameter2, d, null, 9, null);
			}
			else if(d.selectNodes) {
				el = d.selectNodes(o.parameter2);
			}
			else {
				BOOMR.debug("Could not evaluate XPath", "PageVars");
				return;
			}

			if(!el || el.resultType !== 9 || !el.singleNodeValue) {
				BOOMR.debug("XPath did not return anything: " + BOOMR.utils.objectToString(el), "PageVars");
				return;
			}

			value = this.cleanUp(el.singleNodeValue.textContent);

			BOOMR.debug("Final value: " + value, "PageVars");

			callback(varname, value);
		}

	},

	isValid: function(o, handlers) {
		if(!o || typeof o !== "object" || !o.hasOwnProperty("type")
		      || typeof varHandlers[o.type] !== "function" || !o.parameter1) {
			return false;
		}
		return true;
	},

	done: function() {
		var i, o, t,
		    varTypes = {"pageGroups": "h.pg", "abTests": "h.ab"},
		    cusTypes = {"customMetrics": BOOMR.addVar, "customTimers": BOOMR.plugins.RT.setTimer);

		// Page Groups & AB Tests
		for(v in varTypes) {
			if(varTypes.hasOwnProperty(v)) {
				for(i=0; i<impl[v]; i++) {
					o = impl[v][i];

					if(isValid(o)) {
						this.varHandlers[o.type](o, varTypes[v], BOOMR.addVar);
					}
				}
			}
		}

		// Custom Metrics & Timers
		for(v in cusTypes) {
			if(cusTypes.hasOwnProperty(v)) {
				for(i=0; i<impl[v]; i++) {
					o = impl[v][i];

					if(isValid(o) && o.label) {
						this.varHandlers[o.type](o, o.label, cusTypes[v]);
					}
				}
			}
		}
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
