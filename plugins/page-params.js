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
	this.sanitizeRE = config.sanitizeRE || /[^\w \-]/g;

	return this;
};

Handler.prototype = {
	apply: function(value) {
		if(this.preProcessor) {
			value = this.preProcessor(value);
		}
		this.method.call(this.ctx, this.varname, value);
		return true;
	},

	handle: function(o) {
		var h = this;
		if(!this.isValid(o)) {
			return false;
		}
		if(o.label) {
			h = new Handler(this);
			h.varname = o.label;
		}
		return h[o.type](o);
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
		if(!s) {
			return s;
		}
		return s.replace(this.sanitizeRE, '');
	},

	handleRegEx: function(re, extract) {
		var value, m;

		try {
			re = new RegExp(re, "i");
		}
		catch(err) {
			BOOMR.debug("Error generating regex: " + err, "PageVars");
			return false;
		}

		m = re.exec(l.href);

		if(!m || !m.length) {
			return false;
		}

		value = extract.replace(
			/\$([1-9])/g,
			function(m0, m1) {
				return decodeURIComponent(m[parseInt(m1, 10)]);
			});

		value = this.cleanUp(value);

		return this.apply(value);
	},

	checkURLPattern: function(u, urlToCheck) {
		var re;

		// Empty pattern matches all URLs
		if(!u) {
			return true;
		}
		// Massage pattern into a real regex
		re = u.replace(/([^\.])\*/g, '$1.*').replace(/^\*/, '.*');
		try {
			re = new RegExp("^" + re + "$", "i");
		}
		catch(err) {
			BOOMR.debug("Bad pattern: " + re, "PageVars");
			BOOMR.debug(err, "PageVars");
			return false;
		}

		if(!urlToCheck) {
			urlToCheck = l.href;
		}

		// Check if URL matches
		if(!re.exec(urlToCheck)) {
			BOOMR.debug("No match on " + urlToCheck, "PageVars");
			return false;
		}

		return true;
	},

	nodeWalk: function(root, xpath) {
		var m, nodes, index, el;

		if(!xpath) {
			return root;
		}

		m = xpath.match(/^(\w+)(?:\[(\d+)\])?\/?(.*)/);

		if(!m || !m.length) {
			return null;
		}

		nodes = root.getElementsByTagName(m[1]);

		if(m[2]) {
			index = parseInt(m[2], 10);
			if(isNaN(index)) {
				return null;
			}
			index--;	// XPath indices start at 1
			if(nodes.length <= index) {
				return null;
			}
			nodes = [nodes[index]];
		}

		for(index=0; index<nodes.length; index++) {
			el = this.nodeWalk(nodes[index], m[3]);

			if(el) {
				return el;
			}
		}

		return null;
	},

	runXPath: function(xpath) {
		var el;

		try {
			if(d.evaluate) {
				el = d.evaluate(xpath, d, null, 9, null);
			}
			else if(d.selectNodes) {
				el = d.selectNodes(xpath);
			}
			else if(xpath.match(/^\/html(?:\/\w+(?:\[\d+\])?)*$/)) {
				xpath = xpath.slice(6);
				return this.nodeWalk(d, xpath);
			}
			else {
				BOOMR.debug("Could not evaluate XPath", "PageVars");
				return null;
			}
		}
		catch(xpath_err) {
			BOOMR.error("Error evaluating XPath: " + xpath_err, "PageVars");
			return null;
		}

		if(!el || el.resultType !== 9 || !el.singleNodeValue) {
			BOOMR.debug("XPath did not return anything: " + el + ", " + el.resultType + ", " + el.singleNodeValue, "PageVars");
			return null;
		}

		return el.singleNodeValue;
	},

	Custom: function(o) {
		var parts, value, ctx=w;

		if(!o.parameter1) {
			return false;
		}

		BOOMR.debug("Got variable: " + o.parameter1, "PageVars");

		// Split variable into its parts
		parts = o.parameter1.split(/\./);

		if(!parts || parts.length === 0) {
			return false;
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
			ctx = value;
			value = value[parts.shift()];
		}

		// parts.length !== 0 means we stopped before the end
		// so skip
		if(parts.length !== 0) {
			return false;
		}

		// Value evaluated to a function, so we execute it
		// We don't have the ability to pass arguments to the function
		if(typeof value === "function") {
			value = value.call(ctx);
		}

		if(value === undefined || typeof value === "object") {
			return false;
		}

		BOOMR.debug("final value: " + value, "PageVars");
		// Now remove invalid characters
		value = this.cleanUp(String(value));

		return this.apply(value);
	},

	URLPattern: function(o) {
		var value, params, i, kv;
		if(!o.parameter2) {
			return false;
		}

		BOOMR.debug("Got URL Pattern: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		if(!this.checkURLPattern(o.parameter1)) {
			return false;
		}

		// Now that we match, pull out all query string parameters
		params = l.search.slice(1).split(/&/);

		BOOMR.debug("Got params: " + params, "PageVars");

		for(i=0; i<params.length; i++) {
			if(params[i]) {
				kv = params[i].split("=");
				if(kv.length && kv[0] === o.parameter2) {
					BOOMR.debug("final value: " + kv[1], "PageVars");
					value = this.cleanUp(decodeURIComponent(kv[1]));
					return this.apply(value);
				}
			}
		}
	},

	URLSubstringEndOfText: function(o) {
		return this.URLSubstringTrailingText(o);
	},

	URLSubstringTrailingText: function(o) {
		if(!o.parameter1) {
			return false;
		}
		BOOMR.debug("Got URL Substring: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		return this.handleRegEx("^"
					+ o.parameter1.replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, '$1.*?').replace(/^\*/, '.*')
					+ "(.*)"
					+ (o.parameter2 || "").replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, '$1.*')
					+ "$",
				"$1");
	},

	Regexp: function(o) {
		if(!o.parameter1 || !o.parameter2) {
			return false;
		}

		BOOMR.debug("Got RegEx: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		return this.handleRegEx(o.parameter1, o.parameter2);
	},

	URLPatternType: function(o) {
		var value;

		BOOMR.debug("Got URLPatternType: " + o.parameter1 + ", " + o.parameter2, "PageVars");

		if(!this.checkURLPattern(o.parameter1)) {
			return false;
		}

		if(!o.parameter2) {
			value = "1";
		}
		else {

			value = this.runXPath(o.parameter2);

			if(!value) {
				return false;
			}

			// textContent is way faster than innerText in browsers that support
			// both, but IE8 and lower only support innerText so, we test textContent
			// first and fallback to innerText if that fails
			value = this.cleanUp(value.textContent || value.innerText);
		}

		BOOMR.debug("Final value: " + value, "PageVars");

		return this.apply(value);
	},

	ResourceTiming: function(o) {
		var el, url, res, reslist, st, en, i, k;

		// Require at least xpath or url
		if(!o.parameter2 && !o.url) {
			return false;
		}

		// Require start and end or start==="*"
		if(!o.start || (!o.end && o.start !== "*")) {
			return false;
		}

		// Require browser that supports ResourceTiming
		if(!p || !p.getEntriesByName) {
			BOOMR.debug("This browser does not support ResourceTiming", "PageVars");
			return false;
		}

		// Require page URL to match
		if(!this.checkURLPattern(o.parameter1)) {
			return false;
		}

		if(o.parameter2 === "slowest" || o.url === "slowest") {
			url = "slowest";
		}
		else if(o.url) {
			url = o.url;
		}
		else if(o.parameter2) {
			el = this.runXPath(o.parameter2);
			if(!el) {
				return false;
			}

			url = el.src || el.href;
		}

		if(!url) {
			return false;
		}

		reslist = p.getEntriesByName(url);

		if(reslist && reslist.length > 0) {
			res = reslist[0];
		}
		else {
			// no exact match, maybe it has wildcards
			reslist = p.getEntries();
			if(reslist && reslist.length > 0) {
				for(i=0; i<reslist.length; i++) {

					// if we want the slowest url, then iterate through all till we find it
					if(url === "slowest") {
						if(!res || reslist[i].duration > res.duration) {
							res = reslist[i];
						}
					}

					// else stop at the first that matches the pattern
					else if(reslist[i].name && this.checkURLPattern(url, reslist[i].name)) {
						res = reslist[i];
						url = res.name;
						break;
					}
				}
			}
		}

		if(!res) {
			BOOMR.debug("No resource matched", "PageVars");
			return false;
		}

		// If start === "*" then we want all resource timing fields for this resource
		if(o.start === "*") {
			for(k in res) {
				if(res.hasOwnProperty(k) && k.match(/(Start|End)$/) && res[k] > 0) {
					BOOMR.addVar(this.varname + "." + k.replace(/^(...).*(St|En).*$/, '$1$2'), res[k]);
				}
			}

			// but we set the timer to the duration
			return this.apply(res.duration);
		}

		if(o.relative_to_nt || o.start === "navigationStart") {
			st = 0;
		}
		else {
			st = parseFloat(res[o.start], 10);
		}
		en = parseFloat(res[o.end], 10);
		
		
		if(isNaN(st) || isNaN(en)) {
			BOOMR.debug("Start and end were not numeric: " + st + ", " + en, "PageVars");
			return false;
		}

		if(url === "slowest") {
			BOOMR.addVar("dom.res.slowest", res.name);
		}

		BOOMR.debug("Final values: " + st + ", " + en, "PageVars");
		return this.apply(en-st);
	},

	UserTiming: function(o) {
		var res, i;
		if(!o.parameter2) {
			return false;
		}

		if(!p || !p.getEntriesByType) {
			BOOMR.debug("This browser does not support UserTiming", "PageVars");
			return false;
		}

		if(!this.checkURLPattern(o.parameter1)) {
			return false;
		}

		// Check performance.mark
		res = p.getEntriesByType("mark");
		for(i=0; i<res.length; i++) {
			if(res[i].name === o.parameter2) {
				return this.apply(res[i].startTime);
			}
		}

		// Check performance.measure
		res = p.getEntriesByType("measure");
		for(i=0; i<res.length; i++) {
			if(res[i].name === o.parameter2) {
				return this.apply(res[i].duration);
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
	initialized: false,

	done: function() {
		var i, v, hconfig, handler;

		if(this.complete) {
			return;
		}

		hconfig = {
			pageGroups:    { varname: "h.pg", stopOnFirst: true },
			abTests:       { varname: "h.ab", stopOnFirst: true },
			customMetrics: { sanitizeRE: /[^\d\.\-]/g },
			customTimers:  { sanitizeRE: /[^\d\.\-]/g,
					 method: BOOMR.plugins.RT.setTimer,
					 ctx: BOOMR.plugins.RT,
					 preProcessor: function(v) {
							return Math.round(typeof v === "number" ? v : parseFloat(v, 10));
						}
					}
		};

		// Page Groups, AB Tests, Custom Metrics & Timers
		for(v in hconfig) {
			if(hconfig.hasOwnProperty(v)) {
				handler = new Handler(hconfig[v]);

				for(i=0; i<impl[v].length; i++) {
					if( handler.handle(impl[v][i]) && hconfig[v].stopOnFirst ) {
						break;
					}
				}
			}
		}

		this.complete = true;
		BOOMR.sendBeacon();
	},

	clearMetrics: function(vars) {
		var i, label;
		for(i=0; i<impl.customMetrics.length; i++) {
			label = impl.customMetrics[i].label;

			if(vars.hasOwnProperty(label)) {
				BOOMR.removeVar(label);
			}
		}
	}
};


BOOMR.plugins.PageParams = {
	init: function(config) {
		var properties = ["pageGroups", "abTests", "customTimers", "customMetrics"];

		w = BOOMR.window;
		l = location;
		d = w.document;
		p = w.performance || null;

		BOOMR.utils.pluginConfig(impl, config, "PageParams", properties);
		impl.complete = false;

		// Fire on the first of load or unload

		// We need to subscribe to page ready every time init is called
		// because it's possible that the onload event fired before config.js
		// loaded, and so our config will only be available after onload.
		// If page_ready is subscribed to after onload, it fires immediately
		BOOMR.subscribe("page_ready", impl.done, null, impl);

		if(!impl.initialized) {
			// We do not want to subscribe to unload or onbeacon more than once
			// because this will just create too many references
			BOOMR.subscribe("page_unload", impl.done, null, impl);
			BOOMR.subscribe("onbeacon", impl.clearMetrics, null, impl);
			impl.initialized = true;
		}

		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}());
