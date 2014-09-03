(function() {
var w, l, d, p, impl,
    Handler;

BOOMR = window.BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if (BOOMR.plugins.PageParams) {
	return;
}

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
		return s.replace(this.sanitizeRE, "");
	},

	handleRegEx: function(re, extract) {
		var value, m;

		try {
			re = new RegExp(re, "i");
		}
		catch(err) {
			BOOMR.debug("Error generating regex: " + err, "PageVars");
			BOOMR.addError(err, "PageVars.handleRegEx");
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
		re = u.replace(/([^\.])\*/g, "$1.*").replace(/^\*/, ".*");
		try {
			re = new RegExp("^" + re + "$", "i");
		}
		catch(err) {
			BOOMR.debug("Bad pattern: " + re, "PageVars");
			BOOMR.debug(err, "PageVars");
			BOOMR.addError(err, "PageVars.checkURLPattern");
			return false;
		}

		if(!urlToCheck) {
			urlToCheck = l.href;
		}

		// Check if URL matches
		if(!re.exec(urlToCheck)) {
			BOOMR.debug("No match " + re + " on " + urlToCheck, "PageVars");
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
		var el, m;

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
			else if((m = xpath.match(/\[@id="([^"]+)"\]((?:\/\w+(?:\[\d+\])?)*)$/)) !== null) {	// matches an id somewhere, so root it there
				el = d.getElementById(m[1]);
				if(!el || !m[2]) {
					return el;
				}
				return this.nodeWalk(el, m[2].slice(1));
			}
			else {
				BOOMR.debug("Could not evaluate XPath", "PageVars");
				return null;
			}
		}
		catch(xpath_err) {
			BOOMR.error("Error evaluating XPath: " + xpath_err, "PageVars");
			BOOMR.addError(xpath_err, "PageVars.runXPath." + xpath);
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
					+ o.parameter1.replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, "$1.*?").replace(/^\*/, ".*")
					+ "(.*)"
					+ (o.parameter2 || "").replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, "$1.*")
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
		var el, url, res, st, en, k;

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

		BOOMR.debug("Got ResourceTiming: " + o.parameter1 + ", " + o.parameter2 + ", " + o.url, "PageVars");

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

		res = this.findResource(url);

		if(!res) {
			BOOMR.debug("No resource matched", "PageVars");
			return false;
		}

		// If start === "*" then we want all resource timing fields for this resource
		if(o.start === "*") {
			for(k in res) {
				if(res.hasOwnProperty(k) && k.match(/(Start|End)$/) && res[k] > 0) {
					BOOMR.addVar(this.varname + "." + k.replace(/^(...).*(St|En).*$/, "$1$2"), res[k]);
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

			if (!isNaN(st) && st === 0) {
				BOOMR.debug("Start was 0 (not supported on this resource)", "PageVars");
				return false;
			}
		}
		
		en = parseFloat(res[o.end], 10);
		
		if(isNaN(st) || isNaN(en)) {
			BOOMR.debug("Start and end were not numeric: " + st + ", " + en, "PageVars");
			return false;
		}

		if (en === 0) {
			BOOMR.debug("End was 0 (not supported on this resource)", "PageVars");
			return false;
		}

		if(url === "slowest") {
			BOOMR.addVar("dom.res.slowest", res.name);
		}

		BOOMR.debug("Final values: " + st + ", " + en, "PageVars");
		return this.apply(en-st);
	},

	findResource: function(url, frame) {
		var i, res, reslist;

		if (!frame) {
			frame = w;
		}

		try {
			if (!("performance" in frame) || !frame.performance) {
				return null;
			}

			reslist = frame.performance.getEntriesByName(url);
		}
		catch(e) {
			// These are expected for cross-origin iframe access, although the Internet Explorer check will only
			// work for browsers using English.
			if ( !(e.name === "SecurityError" || (e.name === "TypeError" && e.message === "Permission denied")) ) {
				BOOMR.addError(e, "PageVars.findResource");
			}
			return null;
		}

		if(reslist && reslist.length > 0) {
			return reslist[0];
		}

		// no exact match, maybe it has wildcards
		reslist = frame.performance.getEntriesByType("resource");
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

		if(res) {
			return res;
		}

		if (frame.frames) {
			for(i=0; i<frame.frames.length; i++) {
				res = this.findResource(url, frame.frames[i]);
				if (res) {
					return res;
				}
			}
		}
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
	onloadfired: false,

	done: function(edata, ename) {
		var i, j, v, hconfig, handler, limpl=impl;

		if(ename !== "xhr"  && this.complete) {
			return;
		}

		if(ename === "xhr") {
			if (!edata || !edata.data) {
				return;
			}
			edata = edata.data;
			if((!edata.timers || !edata.timers.length) && (!edata.metrics || !edata.metrics.length)) {
				return;
			}

			impl.complete = false;

			limpl = {
				pageGroups: [],
				abTests: impl.abTests,
				customTimers: [],
				customMetrics: []
			};

			if (edata.timers && edata.timers.length) {
				for(i=0; i<impl.customTimers.length; i++) {
					for(j=0; j<edata.timers.length; j++) {
						if(impl.customTimers[i].name === edata.timers[j]) {
							limpl.customTimers.push(impl.customTimers[i]);
						}
					}
				}
			}

			if (edata.metrics && edata.metrics.length) {
				for(i=0; i<impl.customMetrics.length; i++) {
					for(j=0; j<edata.metrics.length; j++) {
						if(impl.customMetrics[i].label === "cmet." + edata.metrics[j]) {
							limpl.customMetrics.push(impl.customMetrics[i]);
						}
					}
				}
			}

			// Override the URL we check metrics against
			if(edata.url) {
				l = d.createElement("a");
				l.href = edata.url;
			}
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

				for(i=0; i<limpl[v].length; i++) {
					if( handler.handle(limpl[v][i]) && hconfig[v].stopOnFirst ) {
						break;
					}
				}
			}
		}

		this.complete = true;
		BOOMR.sendBeacon();

		l = location;
	},

	clearMetrics: function(vars) {
		var i, label;
		for(i=0; i<impl.customMetrics.length; i++) {
			label = impl.customMetrics[i].label;

			if(vars.hasOwnProperty(label)) {
				BOOMR.removeVar(label);
			}
		}
	},

	onload: function() {
		this.onloadfired=true;
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

		if (!impl.onloadfired) {
			BOOMR.subscribe("page_ready", impl.onload, "load", impl);
			BOOMR.subscribe("page_ready", impl.done, "load", impl);
		}
		else {
			// If the page has already loaded by the time we get here,
			// then we just run immediately
			BOOMR.setImmediate(impl.done, {}, "load", impl);
		}

		if(!impl.initialized) {
			// We do not want to subscribe to unload or onbeacon more than once
			// because this will just create too many references
			BOOMR.subscribe("page_unload", impl.done, "unload", impl);
			BOOMR.subscribe("onbeacon", impl.clearMetrics, null, impl);
			BOOMR.subscribe("xhr_load", impl.done, "xhr", impl);
			impl.initialized = true;
		}

		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}());
