(function() {
var w, l, d, p, impl,
    Handler;

BOOMR = window.BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

Handler = function(config) {
	this.varname = config.varname;
	this.method = config.method || BOOMR.addVar;
	this.ctx = config.ctx || BOOMR;
	this.preProcessor = config.preProcessor;

	return this;
};

Handler.prototype = {
	apply: function(value) {
		if(this.preProcessor) {
			value = this.preProcessor(value);
		}
		this.method.call(this.ctx, this.varname, value);
	},

	handle: function(o) {
		var h = this;
		if(!this.isValid(o)) {
			return;
		}
		if(o.label) {
			h = new Handler(this);
			h.varname = o.label;
		}
		h[o.type](o);
	},

	isValid: function(o) {
		// Invalid if
		// object is falsy
		// or object is not an object
		// or object does not have a type
		// or object's type is not a valid handler type
		// or object does not have a first parameter
		if(!o || typeof o !== "object" || !o.hasOwnProperty("type")
		      || typeof this[o.type] !== "function") {
			return false;
		}

		// Also invalid if
		// handler does not have a varname and object does not have a label
		if(!this.varname && !o.label) {
			return false;
		}

		return true;
	},

	cleanUp: function(s) {
		return s.replace(/[^\w \-]+/g, '');
	},

	handleRegEx: function(re, extract) {
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

		this.apply(value);
	},

	checkURLPattern: function(u) {
		var re;

		// Empty pattern matches all URLs
		if(!u) {
			return true;
		}
		// Massage pattern into a real regex
		re = u.replace(/([^\.])\*/g, '$1.*');
		try {
			re = new RegExp("^" + re + "$", "i");
		}
		catch(err) {
			BOOMR.debug("Bad pattern: " + re, "PageVars");
			BOOMR.debug(err, "PageVars");
			return false;
		}

		// Check if URL matches
		if(!re.exec(l.href)) {
			BOOMR.debug("No match on " + l.href, "PageVars");
			return false;
		}

		return true;
	},

	runXPath: function(xpath) {
		var el;

		if(d.evaluate) {
			el = d.evaluate(xpath, d, null, 9, null);
		}
		else if(d.selectNodes) {
			el = d.selectNodes(xpath);
		}
		else {
			BOOMR.debug("Could not evaluate XPath", "PageVars");
			return null;
		}

		if(!el || el.resultType !== 9 || !el.singleNodeValue) {
			BOOMR.debug("XPath did not return anything: " + BOOMR.utils.objectToString(el), "PageVars");
			return null;
		}

		return el.singleNodeValue;
	},

	Custom: function(o) {
		var parts, value;

		if(!o.parameter1) {
			return;
		}

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
		if(parts.length !== 0 || value === undefined || typeof value === "object") {
			return;
		}

		BOOMR.debug("final value: " + value, "PageVars");
		// Now remove invalid characters
		value = this.cleanUp("" + value);

		this.apply(value);
	},

	URLPattern: function(o) {
		var value, params, i, kv;
		if(!o.parameter2) {
			return;
		}

		BOOMR.debug("Got URL Pattern: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		if(!this.checkURLPattern(o.parameter1)) {
			return;
		}

		// Now that we match, pull out all query string parameters
		params = l.search.slice(1).split(/&/);

		BOOMR.debug("Got params: " + params, "PageVars");

		for(i=0; i<params.length; i++) {
			if(params[i]) {
				kv = params[i].split("=");
				if(kv.length && kv[0] === o.parameter2) {
					BOOMR.debug("final value: " + kv[1], "PageVars");
					value = this.cleanUp(kv[1]);
					this.apply(value);
					return;
				}
			}
		}
	},

	URLSubstringEndOfText: function(o) {
		return this.URLSubstringTrailingText(o);
	},

	URLSubstringTrailingText: function(o) {
		if(!o.parameter1) {
			return;
		}
		BOOMR.debug("Got URL Substring: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		this.handleRegEx("^"
					+ o.parameter1.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
					+ "(.*)"
					+ (o.parameter2 || "").replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
					+ "$",
				"$1");
	},

	Regexp: function(o) {
		if(!o.parameter1 || !o.parameter2) {
			return;
		}

		BOOMR.debug("Got RegEx: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		this.handleRegEx(o.parameter1, o.parameter2);
	},

	URLPatternType: function(o) {
		var value;
		if(!o.parameter2) {
			return;
		}

		BOOMR.debug("Got XPath: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		if(!this.checkURLPattern(o.parameter1)) {
			return;
		}

		value = this.runXPath(o.parameter2);

		if(!value) {
			return;
		}

		value = this.cleanUp(value.textContent);

		BOOMR.debug("Final value: " + value, "PageVars");

		this.apply(value);
	},

	ResourceTiming: function(o) {
		var el, url, res, st, en;
		if(!o.parameter2 || !o.start || !o.end) {
			return;
		}

		if(!p || !p.getEntriesByName) {
			BOOMR.debug("This browser does not support ResourceTiming", "PageVars");
			return;
		}

		if(!this.checkURLPattern(o.parameter1)) {
			return;
		}

		el = this.runXPath(o.parameter2);

		url = el.src || el.href;

		if(!url) {
			return;
		}

		res = p.getEntriesByName(url);

		if(!res || !res.length) {
			BOOMR.debug("No resource matched", "PageVars");
			return;
		}

		st = parseFloat(res[0][o.start], 10);
		en = parseFloat(res[0][o.end], 10);
		
		
		if(isNaN(st) || isNaN(en)) {
			BOOMR.debug("Start and end were not numeric: " + st + ", " + en, "PageVars");
			return;
		}

		BOOMR.debug("Final values: " + st + ", " + en, "PageVars");
		this.apply(en-st);
	},

	UserTiming: function(o) {
		var res, i;
		if(!o.parameter2) {
			return;
		}

		if(!p || !p.getEntriesByType) {
			BOOMR.debug("This browser does not support UserTiming", "PageVars");
			return;
		}

		if(!this.checkURLPattern(o.parameter1)) {
			return;
		}

		// Check performance.mark
		res = p.getEntriesByType("mark");
		for(i=0; i<res.length; i++) {
			if(res[i].name === o.parameter2) {
				this.apply(res[i].startTime);
				return;
			}
		}

		// Check performance.measure
		res = p.getEntriesByType("measure");
		for(i=0; i<res.length; i++) {
			if(res[i].name === o.parameter2) {
				this.apply(res[i].duration);
				return;
			}
		}
	}
};

impl = {
	pageGroups: [],
	abTests: [],
	customTimers: [],
	customMetrics: [],

	complete: false,

	done: function() {
		var i, v, hconfig, handler;

		if(this.complete) {
			return;
		}

		hconfig = {
			pageGroups:    { varname: "h.pg" },
			abTests:       { varname: "h.ab" },
			customMetrics: { },
			customTimers:  { method: BOOMR.plugins.RT.setTimer, ctx: BOOMR.plugins.RT, preProcessor: function(v) {
								return Math.round(typeof v === "number" ? v : parseFloat(v, 10));
							}
					}
		};

		// Page Groups, AB Tests, Custom Metrics & Timers
		for(v in hconfig) {
			if(hconfig.hasOwnProperty(v)) {
				handler = new Handler(hconfig[v]);

				for(i=0; i<impl[v].length; i++) {
					handler.handle(impl[v][i]);
				}
			}
		}

		this.complete = true;
		BOOMR.sendBeacon();
	}
};


BOOMR.plugins.PageParams = {
	init: function(config) {
		var properties = ["pageGroups", "abTests", "customTimers", "customMetrics"];

		w = BOOMR.window;
		l = w.location;
		d = w.document;
		p = w.performance || null;

		BOOMR.utils.pluginConfig(impl, config, "PageParams", properties);

		BOOMR.subscribe("page_ready", impl.done, null, impl);

		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}());
