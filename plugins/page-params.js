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
		this.cleanUpRE = config.cleanUpRE;

		return this;
	};

	Handler.prototype = {
		apply: function(value) {
			if (this.preProcessor) {
				value = this.preProcessor(value);
			}
			if (!value && value !== 0) {
				return false;
			}
			this.method.call(this.ctx, this.varname, value);
			return true;
		},

		handle: function(o) {
			var h = this;
			if (!this.isValid(o)) {
				return false;
			}
			if (o.label) {
				h = new Handler(this);
				h.varname = o.label;
			}
			return h[o.type](o);
		},

		isValid: function(o) {
			return (						// Valid iff
				o						// object is non-falsy
				&& typeof o === "object"			// and object is an object
				&& o.hasOwnProperty("type")			// and object has a type attribute
				&& typeof this[o.type] === "function"		// and object's type attribute is a valid handler type
				&& (this.varname || o.label)			// and handler has a varname or object has a label
			);
		},

		cleanUp: function(s) {
			var m;
			if (!s) {
				return s;
			}

			if (this.cleanUpRE) {
				m = s.match(this.cleanUpRE);
				if (m && m.length > 1) {
					return m[1];
				}
				else {
					return "";
				}
			}

			return s.replace(this.sanitizeRE, "");
		},

		isValidObjectMember: function(value, part) {
			if (value === null) {
				return false;
			}

			if (typeof value === "object") {
				return true;
			}

			if (typeof value === "function" && value.hasOwnProperty(part)) {
				return true;
			}

			if (typeof value === "string" && value.hasOwnProperty(part)) {
				return true;
			}

			return false;
		},

		extractFromDOMElement: function(element, o) {
			var m, re, elementValue = "";

			if (element.nodeName.toUpperCase() === "INPUT" || element.nodeName.toUpperCase() === "SELECT") {
				// either it is not a checkbox/radio button or it is checked.
				if ((element.type.toLowerCase() !== "checkbox" && element.type.toLowerCase() !== "radio") || element.checked) {
					elementValue = element.value;
				}
			}
			else {
				elementValue = element.textContent || element.innerText;
			}

			if ((!o.match || o.match === "numeric")) {
				// textContent is way faster than innerText in browsers that support
				// both, but IE8 and lower only support innerText so, we test textContent
				// first and fallback to innerText if that fails
				elementValue = this.cleanUp(elementValue);
			}
			else if (o.match === "boolean") {
				elementValue = 1;
			}
			else if (o.match.match(/^regex:/)) {
				m = o.match.match(/^regex:(.*)/);
				if (!m || m.length < 2) {
					return false;
				}

				try {
					re = new RegExp(m[1], "i");

					if (re.test(elementValue)) {
						elementValue = 1;
					}
				}
				catch (err) {
					BOOMR.debug("Bad pattern: " + o.match, "PageVars");
					BOOMR.debug(err, "PageVars");
					BOOMR.addError(err, "PageVars.URLPatternType", o.match);
					return false;
				}
			}

			return elementValue;
		},

		handleRegEx: function(re, extract, operand) {
			var value, m;

			if (!(re instanceof RegExp)) {
				try {
					re = new RegExp(re, "i");
				}
				catch (err) {
					BOOMR.debug("Error generating regex: " + err, "PageVars");
					BOOMR.addError(err, "PageVars.handleRegEx", re);
					return false;
				}
			}

			if (typeof operand === "undefined") {
				return false;
			}

			m = re.exec(operand);

			if (!m || !m.length) {
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
			if (!u) {
				return true;
			}

			// Massage pattern into a real regex
			re = u.replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*?");
			try {
				re = new RegExp("^" + re + "$", "i");
			}
			catch (err) {
				BOOMR.debug("Bad pattern: " + re, "PageVars");
				BOOMR.debug(err, "PageVars");
				BOOMR.addError(err, "PageVars.checkURLPattern", u);
				return false;
			}

			if (!urlToCheck) {
				urlToCheck = l.href;
			}

			// Check if URL matches
			if (!re.exec(urlToCheck)) {
				BOOMR.debug("No match " + re + " on " + urlToCheck, "PageVars");
				return false;
			}

			return true;
		},

		nodeWalk: function(root, xpath) {
			var m, nodes, index, el;

			if (!xpath) {
				return root;
			}

			m = xpath.match(/^(\w+)(?:\[(\d+)\])?\/?(.*)/);

			if (!m || !m.length) {
				return null;
			}

			nodes = root.getElementsByTagName(m[1]);

			if (m[2]) {
				index = parseInt(m[2], 10);
				if (isNaN(index)) {
					return null;
				}
				index--;	// XPath indices start at 1
				if (nodes.length <= index) {
					return null;
				}
				nodes = [nodes[index]];
			}

			for (index = 0; index < nodes.length; index++) {
				el = this.nodeWalk(nodes[index], m[3]);

				if (el) {
					return el;
				}
			}

			return null;
		},

		runXPath: function(xpath) {
			var el, m, tryOurs = false, err;

			try {
				if (d.evaluate) {
					el = d.evaluate(xpath, d, null, 9, null);
				}
				else if (d.selectNodes) {
					el = d.selectNodes(xpath);
				}
				else {
					tryOurs = true;
				}
			}
			catch (xpath_err) {
				err = xpath_err;
				tryOurs = true;
			}

			if (!el && tryOurs) {
				try {
					if (xpath.match(/^\/html(?:\/\w+(?:\[\d+\])?)*$/)) {
						xpath = xpath.slice(6);
						return this.nodeWalk(d, xpath);
					}
					else if ((m = xpath.match(/\[@id=(["'])([^"']+)\1\]((?:\/\w+(?:\[\d+\])?)*)$/)) !== null) {	// matches an id somewhere, so root it there
						el = d.getElementById(m[2]);
						if (!el || !m[3]) {
							return el;
						}
						return this.nodeWalk(el, m[3].slice(1));
					}
					else {
						BOOMR.debug("Could not evaluate XPath", "PageVars");
						if (err) {
							BOOMR.error("Error evaluating XPath: " + err, "PageVars");
							BOOMR.addError(err, "PageVars.runXPath.native", xpath);
						}
						return null;
					}
				}
				catch (xpath_err) {
					BOOMR.error("Error evaluating XPath: " + xpath_err, "PageVars");
					BOOMR.addError(xpath_err, "PageVars.runXPath.ours", xpath);
					return null;
				}
			}

			if (!el || el.resultType !== 9 || !el.singleNodeValue) {
				BOOMR.debug("XPath did not return anything: " + el + ", " + el.resultType + ", " + el.singleNodeValue, "PageVars");
				return null;
			}

			return el.singleNodeValue;
		},

		runQuerySelector: function(queryselector) {
			var el;

			try {
				if (d.querySelector) {
					el = d.querySelector(queryselector);
				}
				else {
					return null;
				}
			}
			catch (exception) {
				BOOMR.error("" + exception, "PageVars");
				BOOMR.addError(exception, "PageVars.runQueryselector", queryselector);
				return null;
			}

			if (!el) {
				BOOMR.debug("QuerySelector '" + queryselector + "'yielded no result!");
			}

			return el;
		},

		JavaScriptVar: function(o) {
			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			return this.extractJavaScriptVariable(o.varName);
		},

		Custom: function(o) {
			if (!this.checkURLPattern(o.parameter2)) {
				return false;
			}

			return this.extractJavaScriptVariable(o.parameter1);
		},

		extractJavaScriptVariable: function(varname) {
			var parts, value, ctx = w;

			if (!varname) {
				return false;
			}

			BOOMR.debug("Got variable: " + varname, "PageVars");

			// Split variable into its parts
			parts = varname.split(/\./);

			if (!parts || parts.length === 0) {
				return false;
			}

			// Top part needs to be global in the primary window
			value = this.extractJavaScriptVariableValue(w, parts.shift());

			// Then we navigate down the object looking at each part
			// until:
			// - a part evaluates to null (we cannot proceed)
			// - a part is not an object (might be a leaf but we cannot go further down)
			// - a part is a function but has an own property that is in our parts
			// - there are no more parts left (so we can stop)
			try {
				while (parts.length && this.isValidObjectMember(value, parts[0])) {

					BOOMR.debug("looking at " + parts[0], "PageVars");
					ctx = value;
					value = this.extractJavaScriptVariableValue(value, parts.shift());
				}
			}
			catch (err) {
				BOOMR.addError(err, "PageVars.extractJavaScriptVariable", varname + "::" + parts.join("."));
				return false;
			}

			// parts.length !== 0 means we stopped before the end
			// so skip
			if (parts.length !== 0) {
				return false;
			}

			// Value evaluated to a function, so we execute it, and pass the label in as an argument
			// We don't have the ability to pass custom arguments to the function
			if (typeof value === "function") {
				try {
					value = value.call(ctx, this.varname);
				}
				catch (err) {
					BOOMR.addError(err, "PageVars.extractJavaScriptVariable", varname + "()");
					return false;
				}
			}

			if (value === undefined || typeof value === "object") {
				return false;
			}

			BOOMR.debug("final value: " + value, "PageVars");
			// Now remove invalid characters
			value = this.cleanUp(String(value));

			return this.apply(value);
		},

		extractJavaScriptVariableValue: function(value, part) {
			// regex to extract array subscript index
			var match, index, re = /(.+?)\[(\d+)\]((?:\[\d+\])+)*/;

			if ((match = re.exec(part)) === null) {
				// no subscript, return value.part
				return value[part];
			}

			// split into js var name, or subscripts
			re = /([a-zA-Z_$][\w$]*|\[(\d+)\])/g;

			// We'll match either a variable name (the first part of the regex),
			// or an array subsript (the second option in the | in the regex).
			while ((match = re.exec(part)) !== null && typeof value !== "undefined") {
				if (match.length === 3 && match[2]) {
					// when we matched an array subscript, such as '[1]'
					index = parseInt(match[2], 10);
					value = value[index];
				}
				else {
					// when we matched a JavaScript variable name
					value = value[match[1]];
				}
			}

			return value;
		},

		URLPattern: function(o) {
			var value, params, i, kv;
			if (!o.parameter2) {
				return false;
			}

			BOOMR.debug("Got URL Pattern: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			// Now that we match, pull out all query string parameters
			params = l.search.slice(1).split(/&/);

			BOOMR.debug("Got params: " + params, "PageVars");

			for (i = 0; i < params.length; i++) {
				if (params[i]) {
					kv = params[i].split("=");
					if (kv.length && kv[0] === o.parameter2) {
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
			if (!o.parameter1) {
				return false;
			}
			BOOMR.debug("Got URL Substring: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			return this.handleRegEx("^"
						+ o.parameter1.replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, "$1.*?").replace(/^\*/, ".*")
						+ "(.*)"
						+ (o.parameter2 || "").replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, "$1.*")
						+ "$",
					"$1",
					l.href);
		},

		UserAgentRegex: function(o) {
			return this._Regex(o.parameter1, o.regex, o.replacement, navigator.userAgent);
		},

		CookieRegex: function(o) {
			return this._Regex(o.parameter1, o.regex, o.replacement, o.cookieName ? BOOMR.utils.getCookie(o.cookieName) : d.cookie);
		},

		// New method for custom dimensions
		URLRegex: function(o) {
			return this._Regex(o.parameter1, o.regex, o.replacement, l.href);
		},

		// Old method for page groups
		Regexp: function(o) {
			return this._Regex(null, o.parameter1, o.parameter2, l.href);
		},

		_Regex: function(url, regex, replacement, operand) {
			if (!regex || !replacement) {
				return false;
			}

			if (!this.checkURLPattern(url)) {
				return false;
			}

			BOOMR.debug("Got RegEx: " + url + ", " + regex + ", " + replacement, "PageVars");

			return this.handleRegEx(regex, replacement, operand);
		},

		URLPatternType: function(o) {
			var value;

			BOOMR.debug("Got URLPatternType: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			if (o.parameter1 && !o.parameter2 && !o.queryselector) {
				value = "1";
			}
			else if (o.queryselector) {
				value = this.runQuerySelector(o.queryselector);

				if (!value) {
					return false;
				}

				value = this.extractFromDOMElement(value, o);
			}
			else if (o.parameter2) {
				value = this.runXPath(o.parameter2);

				if (!value) {
					return false;
				}

				value = this.extractFromDOMElement(value, o);
			}
			else {
				return false;
			}

			BOOMR.debug("Final value: " + value, "PageVars");

			return this.apply(value);
		},

		ResourceTiming: function(o) {
			var el, url, res, st, en, k;

			// Require at least xpath, queryselector or url
			if (!o.parameter2 && !o.url && !o.queryselector) {
				return false;
			}

			// Require start and end or start==="*"
			if (!o.start || (!o.end && o.start !== "*")) {
				return false;
			}

			// Require browser that supports ResourceTiming
			if (!p || !p.getEntriesByName) {
				BOOMR.debug("This browser does not support ResourceTiming", "PageVars");
				return false;
			}

			BOOMR.debug("Got ResourceTiming: " + o.parameter1 + ", " + o.parameter2 + ", " + o.url, "PageVars");

			// Require page URL to match
			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			if (o.parameter2 === "slowest" || o.url === "slowest") {
				url = "slowest";
			}
			else if (o.url) {
				url = o.url;
			}
			else if (o.parameter2) {
				el = this.runXPath(o.parameter2);
			}
			else if (o.queryselector) {
				el = this.runQuerySelector(o.queryselector);
			}

			if (el) {
				url = el.src || el.href;
			}
			else if (!url) {
				return false;
			}

			res = this.findResource(url);

			if (!res) {
				BOOMR.debug("No resource matched", "PageVars");

				// If we reach here, that means the url wasn't found.  We'll save it for retrying because it's
				// possible that it will be added later in the page, but before we beacon
				impl.mayRetry.push({ handler: this, data: o });

				return false;
			}

			if (url === "slowest") {
				BOOMR.addVar("dom.res.slowest", res.name);
			}

			// If start === "*" then we want all resource timing fields for this resource
			if (o.start === "*") {
				for (k in res) {
					if (res.hasOwnProperty(k) && k.match(/(Start|End)$/) && res[k] > 0) {
						BOOMR.addVar(this.varname + "." + k.replace(/^(...).*(St|En).*$/, "$1$2"), Math.round(res[k]));
					}
				}

				// but we set the timer to the duration
				return this.apply(res.duration);
			}

			if (o.relative_to_nt || o.start === "navigationStart") {
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

			if (isNaN(st) || isNaN(en)) {
				BOOMR.debug("Start and end were not numeric: " + st + ", " + en, "PageVars");
				return false;
			}

			if (en === 0) {
				BOOMR.debug("End was 0 (not supported on this resource)", "PageVars");
				return false;
			}

			BOOMR.debug("Final values: " + st + ", " + en, "PageVars");

			BOOMR.addVar(this.varname + "_st", Math.round(st));
			return this.apply(en - st);
		},

		findResource: function(url, frame) {
			var i, res, reslist;

			if (!frame) {
				frame = w;
			}

			try {
				if (!("performance" in frame
					&& frame.performance
					&& frame.performance.getEntriesByName
					&& frame.performance.getEntriesByType)) {
					return null;
				}

				reslist = frame.performance.getEntriesByName(url);
			}
			catch (e) {
				if (BOOMR.isCrossOriginError(e)) {
					return null;
				}

				try {
					// PDFs in IE will throw this exception
					if ( e.name === "TypeError" && e.message === "Invalid calling object" && frame.document.location.pathname.match(/\.pdf$/)) {
						return null;
					}
				}
				catch (ignore) { /* empty */ }

				BOOMR.addError(e, "PageVars.findResource");
				return null;
			}

			if (reslist && reslist.length > 0) {
				return reslist[0];
			}

			// no exact match, maybe it has wildcards
			reslist = frame.performance.getEntriesByType("resource");
			if (reslist && reslist.length > 0) {
				for (i = 0; i < reslist.length; i++) {

					// if we want the slowest url, then iterate through all till we find it
					if (url === "slowest") {
						if (!res || reslist[i].duration > res.duration) {
							res = reslist[i];
						}
					}

					// else stop at the first that matches the pattern
					else if (reslist[i].name && this.checkURLPattern(url, reslist[i].name)) {
						res = reslist[i];
						url = res.name;
						break;
					}
				}
			}

			if (res) {
				return res;
			}

			if (frame.frames) {
				for (i = 0; i < frame.frames.length; i++) {
					res = this.findResource(url, frame.frames[i]);
					if (res) {
						return res;
					}
				}
			}
		},

		UserTiming: function(o) {
			var res, i;
			if (!o.parameter2) {
				return false;
			}

			if (!p || typeof p.getEntriesByType !== "function") {
				BOOMR.debug("This browser does not support UserTiming", "PageVars");
				return false;
			}

			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			// Check performance.mark
			res = p.getEntriesByType("mark");
			for (i = 0; res && i < res.length; i++) {
				if (res[i].name === o.parameter2) {
					return this.apply(res[i].startTime);
				}
			}

			// Check performance.measure
			res = p.getEntriesByType("measure");
			for (i = 0; res && i < res.length; i++) {
				if (res[i].name === o.parameter2) {
					if (res[i].startTime) {
						BOOMR.addVar(this.varname + "_st", Math.round(res[i].startTime));
					}
					return this.apply(res[i].duration);
				}
			}

			// If we reach here, that means the mark/measure wasn't found.  We'll save it for retrying because it's
			// possible that it will be added later in the page, but before we beacon
			impl.mayRetry.push({ handler: this, data: o });
		}
	};

	BOOMR.utils.runXPath = Handler.prototype.runXPath;
	BOOMR.utils.runQuerySelector = Handler.prototype.runQuerySelector;

	Handler.prototype.XPath = Handler.prototype.URLPatternType;
	Handler.prototype.URLQueryParam = Handler.prototype.URLPattern;

	impl = {
		pageGroups: [],
		abTests: [],
		customTimers: [],
		customMetrics: [],
		customDimensions: [],

		complete: false,
		initialized: false,
		onloadfired: false,

		autorun: true,

		mayRetry: [],

		done: function(edata, ename) {
			var i, v, hconfig, handler, limpl = impl, data;

			hconfig = {
				pageGroups:       { varname: "h.pg", stopOnFirst: true },
				abTests:          { varname: "h.ab", stopOnFirst: true },
				customMetrics:    { cleanUpRE:  /(-?\d+(?:\.\d+)?)/ },
				customDimensions: { sanitizeRE: /[^\w\. \-]/g },
				customTimers:     { cleanUpRE:  /(-?\d+(?:\.\d+)?)/,
						    method: BOOMR.plugins.RT.setTimer,
						    ctx: BOOMR.plugins.RT,
						    preProcessor: function(val) {
							    return Math.round(typeof val === "number" ? val : parseFloat(val, 10));
						    }
						}
			};

			if (ename !== "xhr" && this.complete) {
				return;
			}

			BOOMR_check_doc_domain();

			//
			// XHRs are handled differently than normal or SPA navigations (which apply
			// all Page Groups, Timers, Metrics, Dimensions and ABs).  XHRs look at Page Groups
			// and remove any _subresource in the name.  XHRs also only apply Timers, Metrics
			// and Dimensions that have 'xhr_ok' set.
			//
			if (ename === "xhr" && !BOOMR.utils.inArray(edata.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				limpl = impl.extractXHRParams(edata, hconfig);

				if (limpl === null) {
					return;
				}

				impl.complete = false;

				if (edata.data) {
					data = edata.data;
				}
				else {
					data = edata;
				}

				// Override the URL we check metrics against
				if (data.url) {
					l = d.createElement("a");
					l.href = data.url;

					limpl.pageGroups = impl.pageGroups;

					hconfig.pageGroups.varname = "xhr.pg";

					// Page Group name for an XHR resource can specify if this is a subresource or not
					hconfig.pageGroups.preProcessor = function(val) {
						if (val && val.match(/_subresource$/)) {
							val = val.replace(/_subresource$/, "");
							edata.subresource = "passive";
						}

						return val;
					};
				}
			}
			else {
				l = w.location;
				this.complete = true;
			}

			// Since we're going to write new stuff, clear out anything that we've previously written but couldn't be beaconed
			impl.clearMetrics();

			// Also clear the retry list since we'll repopulate it if needed
			impl.mayRetry = [];

			// Page Groups, AB Tests, Custom Metrics & Timers
			for (v in hconfig) {
				if (hconfig.hasOwnProperty(v)) {
					handler = new Handler(hconfig[v]);

					for (i = 0; i < limpl[v].length; i++) {
						if (ename !== "xhr" && limpl[v][i].only_xhr) {
							// do not process xhr only items for non-xhr requests
							continue;
						}

						if ( handler.handle(limpl[v][i]) && hconfig[v].stopOnFirst ) {
							if (limpl[v][i].subresource && ename === "xhr" && edata) {
								edata.subresource = "active";
							}
							break;
						}
					}
				}
			}

			BOOMR.sendBeacon();
		},

		retry: function() {
			var i, handler, o, retries = impl.mayRetry;

			// We can clear out this array now and work off a copy because anything that doesn't
			// go through on the retry will just re-add itself to the array
			impl.mayRetry = [];

			for (i = 0; i < retries.length; i++) {
				if (retries[i]) {
					o = handler = null;
					try {
						handler = retries[i].handler;
						o = retries[i].data;
						handler[o.type](o);
					}
					catch (e) {
						BOOMR.addError(e, "PageVars.retry." + (o ? o.type : "?") + "." + (handler ? handler.varname : "?"));
					}
				}
			}
		},

		clearMetrics: function() {
			var i, label;

			// Remove custom metrics
			for (i = 0; i < impl.customMetrics.length; i++) {
				label = impl.customMetrics[i].label;

				BOOMR.removeVar(label);
			}

			// Remove slowest url
			BOOMR.removeVar("dom.res.slowest");

			// Remove start time for custom timers
			for (i = 0; i < impl.customTimers.length; i++) {
				label = impl.customTimers[i].label + "_st";

				BOOMR.removeVar(label);
			}

			BOOMR.removeVar("h.pg", "h.ab", "xhr.pg");

			// TODO remove all resource timing components when start==="*"
		},

		onload: function() {
			this.onloadfired = true;
		},

		extractXHRParams: function(edata, hconfig) {
			var limpl, sections, k, section, itemName, value, m, i, j, handler, data;

			if (!edata) {
				return null;
			}
			if (edata.data) {
				data = edata.data;
			}
			else {
				data = edata;
			}

			if (  !data.url
			  && (!data.timers     || !data.timers.length)
			  && (!data.metrics    || !data.metrics.length)
			  && (!data.dimensions || !data.dimensions.length)
			) {
				return null;
			}

			limpl = {
				pageGroups: [],
				abTests: impl.abTests,
				customTimers: [],
				customMetrics: [],
				customDimensions: []
			};

			sections = {
				"timers":     { impl: "customTimers",     data: data.timers },
				"metrics":    { impl: "customMetrics",    data: data.metrics },
				"dimensions": { impl: "customDimensions", data: data.dimensions }
			};

			// for each of timers, metrics & dimensions
			for (k in sections) {
				if (!sections.hasOwnProperty(k)) {
					continue;
				}

				section = sections[k];

				// if there's no data elements passed in
				if (!section.data || !section.data.length) {
					// If we have a URL and customer has not overridden which timers to use, then figure out based on url filters
					if (data.url) {
						for (i = 0; i < impl[section.impl].length; i++) {
							// only allow timers, metrics & dimensions that are xhr_ok
							if (impl[section.impl][i].xhr_ok) {
								limpl[section.impl].push(impl[section.impl][i]);
							}
						}
					}
					continue;
				}

				// If there are data elements passed in, then check which ones we want
				for (j = 0; j < section.data.length; j++) {
					m = section.data[j].split(/\s*=\s*/);
					itemName = m[0];
					value = m[1];	// undefined if no =, empty string if set to empty

					for (i = 0; i < impl[section.impl].length; i++) {
						if (impl[section.impl][i].name === itemName) {
							if (value === undefined) {
								// If no predefined value, then go through the flow
								limpl[section.impl].push(impl[section.impl][i]);
							}
							else {
								// If we have a predefined value, then use it
								handler = new Handler(hconfig[section.impl]);
								handler.varname = impl[section.impl].label;
								handler.apply(handler.cleanUp(value));
								handler = null;
							}
						}
					}
				}
			}

			return limpl;
		}
	};


	BOOMR.plugins.PageParams = {
		init: function(config) {
			var properties = ["pageGroups", "abTests", "customTimers", "customMetrics", "customDimensions", "autorun"];

			w = BOOMR.window;
			l = w.location;	// if client uses history.pushState, parent location might be different from boomerang frame location
			d = w.document;
			p = w.performance || null;

			BOOMR.utils.pluginConfig(impl, config, "PageParams", properties);
			impl.complete = false;

			if (typeof config.autorun !== "undefined") {
				impl.autorun = config.autorun;
			}

			// Fire on the first of load or unload

			/*
			Cases (this is what should happen), PageParams MUST be the first plugin for this to work correctly:
			1. Boomerang & config load before onload, onload fires first, xhr_load next:
			- attach done to load event on first init
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- attach done to load event on second init (skips because of duplicate)
			- done runs on onload, complete === false
			- done runs on xhr_load (ignores complete)
			- done does not run on unload, complete === true
			* 1 or 2 beacons

			2. Boomerang & config load before onload, unload fires before onload:
			- attach done to load event on first init
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- attach done to load event on second init (skips because of duplicate)
			- done runs on unload, complete === false
			* 1 beacon

			3. Boomerang & config load before onload, xhr_load fires before onload:
			- attach done to load event on first init
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- attach done to load event on second init (skips because of duplicate)
			- done runs on xhr_load, tries to send beacon, does not change complete
			- done runs on onload, complete === false
			- done does not run on unload, complete === true
			* 2 beacons

			4. Boomerang loads before onload, config loads after onload, onload fires first, xhr_load next:
			- attach done to load event on first init
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- done runs on onload, skips because of no config, sets complete = true
			- xhr_load will never fire before config (event ignored)
			- complete = false on second init
			- setImmediate `done` on second init (from PageParams.init)
			- done runs immediately, complete === false
			- done runs on xhr_load that fires after config (ignores complete)
			- done does not run on unload, complete === true
			* 1 or 2 beacons

			5. Boomerang loads before onload, config loads after onload, unload fires before onload:
			- attach done to load event on first init
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- done runs on unload, skips because of no config, sets complete = true
			* 0 beacons

			6. Boomerang loads before onload, config loads after onload, xhr_load fires before onload:
			- attach done to load event on first init
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- xhr_load will never fire before config (event ignored)
			- complete = false on second init
			- setImmediate `done` on second init (from PageParams.init)
			- done runs immediately, complete === false, sets complete = true
			- done does not run on unload, complete === true
			* 1 beacon

			7. Boomerang & config load after onload, onload fires first, xhr_load fires next:
			- setImmediate `done` on first init (from BOOMR.init)
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- done runs immediately, skips because of no config, sets complete = true
			- complete = false on second init
			- setImmediate `done` on second init (from PageParams.init)
			- done runs immediately, complete === false, sets to true
			- done runs on xhr_load only if it fires after config loads
			- done does not run on unload, complete === true
			* 1 or 2 beacons

			8. Boomerang & config load after onload, unload fires before onload:
			- boomerang doesn't load
			* 0 beacons

			9. Boomerang & config load after onload, xhr_load fires before onload:
			- xhr_load ignored because of no boomerang
			- setImmediate `done` on first init (from BOOMR.init)
			- attach done to unload event on first init
			- attach done to xhr_load event on first init
			- done runs immediately, skips because of no config, sets complete = true
			- complete = false on second init
			- setImmediate `done` on second init (from PageParams.init)
			- done runs on immediately, complete === false, sets complete = true
			- done does not run on unload, complete === true
			* 1 beacon
			*/

			if (!impl.onloadfired) {
				BOOMR.subscribe("page_ready", impl.onload, "load", impl);
				BOOMR.subscribe("page_ready", impl.done, "load", impl);
			}
			else if (impl.autorun) {
				// If the page has already loaded by the time we get here,
				// then we just run immediately
				BOOMR.setImmediate(impl.done, {}, "load", impl);
			}

			if (!impl.initialized) {
				// We do not want to subscribe to unload or onbeacon more than once
				// because this will just create too many references
				BOOMR.subscribe("before_unload", impl.done, "unload", impl);
				BOOMR.subscribe("onbeacon", impl.clearMetrics, null, impl);
				BOOMR.subscribe("xhr_load", impl.done, "xhr", impl);
				impl.initialized = true;
			}

			return this;
		},

		is_complete: function() {
			// We'll run retry() here because it must run before RT's before_beacon handler
			if (impl.mayRetry.length > 0) {
				impl.retry();
			}
			return true;
		}

		/* BEGIN UNIT_TEST_CODE */,
		Handler: Handler
		/* END UNIT_TEST_CODE */
	};

}());
