(function() {
	var w, l, d, p, impl, Handler;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.PageParams) {
		return;
	}

	//
	// Constants
	//
	var DEFAULT_DECIMAL = ".";
	var DEFAULT_THOUSANDS = ",";

	/**
	 * @constant
	 * Regular Expression to extract a number under en-US internationalization from a body of text
	 * @type {RegExp}
	 */
	var REGEX_NUMBER_US_DEFAULT = /(-?(?:[1-9][\d,]*)?[0-9](?:\.\d+)?)/;

	/**
	 * @constant
	 * Time in milliseconds to keep the observer alive during runtime
	 * @type {number}
	 */
	var RESOURCE_GROUPS_MO_TIMEOUT = 2000;

	/**
	 * @constant
	 * Maximum time in milliseconds to keep the timer alive for constant checking
	 * for new resources being added to a container on the page
	 * @type {number}
	 */
	var RESOURCE_GROUPS_CHILDLISTENER_TIMEOUT = 500;

	/**
	 * @constant
	 * Sets the priority of trying to run PageParam evaluation types.
	 * Based on these priorities we can decide whether or not to run
	 * these evaluation types to retrieve the right value for this
	 * type of page param.
	 *
	 * Keys correspond to the type of page params under either
	 * - custom timers, metrics, dimensions
	 * - abTests
	 * - pageGroups
	 *
	 * The value defines if the type is supposed to be evaluated
	 * immediately (1) or evaluated when a subscribed event is
	 * triggered (2) which are:
	 * - page_ready
	 * - before_unload
	 * - xhr_load
	 * @type {object}
	 */
	var PAGE_PARAM_TRY_PRIORITY = {
		ResourceGroup: 1,
		JavaScriptVar: 2,
		Custom: 2,
		URLPattern: 1,
		URLSubstringEndOfText: 1,
		URLSubstringTrailingText: 1,
		UserAgentRegex: 1,
		CookieRegex: 1,
		URLRegex: 1,
		Regexp: 1,
		URLPatternType: 2,
		ResourceTiming: 2,
		UserTiming: 2
	};

	/**
	 * @constant
	 * Tag names matching element types that have a onload event
	 * @type {string[]}
	 */
	var PAGE_PARAM_RESOURCEGROUP_NETWORK_RESOURCES = ["img", "iframe", "script", "link", "object", "svg", "video"];

	/**
	 * @private
	 * Each handler config has a basic configuration. The configuration is used when initializing the Handler.
	 * The configuration is may be modified for initialization purposes of the specific Handler.
	 *
	 * This needs to be a function as otherwise the BOOMR.RT.setTimer
	 * is not accessible.
	 *
	 * @returns {HandlerConfig} - object containing basic Handler Configuration
	 */
	var PAGE_PARAMS_BASE_HANDLER_CONFIG = function() {
		return {
			pageGroups: {
				varname: "h.pg",
				stopOnFirst: true,
				isDimension: true
			},
			abTests: {
				varname: "h.ab",
				stopOnFirst: true,
				isDimension: true
			},
			customMetrics: {
				cleanUpRE:  REGEX_NUMBER_US_DEFAULT
			},
			customDimensions: {
				sanitizeRE: /[^\w\. \-]/g,
				isDimension: true
			},
			customTimers: {
				cleanUpRE:  REGEX_NUMBER_US_DEFAULT,
				method: BOOMR.plugins.RT && BOOMR.plugins.RT.setTimer,
				ctx: BOOMR.plugins.RT,
				preProcessor: function(val) {
					return Math.round(typeof val === "number" ? val : parseFloat(val, 10));
				}
			}
		};
	};

	/**
	 * @typedef HandlerConfig
	 * @property {object} pageGroups - PageGroups specific configuration
	 * @property {string} pageGroups.varname - Name of the beacon param storing the retrieved page group
	 * @property {boolean} pageGroups.stopOnFirst - If true the first found value for the page group will be taken as the page group name
	 * @property {object} abTests - A/B tests specific configuration
	 * @property {string} abTests.varname - Name of the beacon param storing the retrieved A/B test value
	 * @property {boolean} abTests.stopOnFirst - If true the first found value for the A/B test name will be taken as the A/B test name
	 * @property {object} customMetrics - Custom Metrics configuration
	 * @property {RegExp} customMetrics.cleanUpRE - Regular Expression for filtering out numeric values from a string of text
	 * @property {object} customDimensions - Custom Dimension specific configuration
	 * @property {RegExp} customDimensions.sanitizeRE - Regular Expression to clean body of text for a custom dimension value
	 * @property {object} customTimers - Custom Timers specific configuration
	 * @property {RegExp} customTimers.cleanUpRE - Regular Expression to clean up a numeric value to receive a numeric value from a body of text
	 * @property {function} customTimers.method - Function used to set the timer on the beacon
	 * @property {PluginContext} customTimers.ctx - Instance of Plugin to call {@link HandlerConfig#customTimers~method} in
	 * @property {function} customTimers.preProcessor - Method to pre process the custom timers value before setting the timer with {@link HandlerConfig#customTimers~method}
	 */

	/**
	 * @constant
	 * Names of PageParams types collected by this plugin
	 * @type {string[]}
	 */
	var PAGE_PARAMS_NAMES = ["pageGroups", "abTests", "customTimers", "customMetrics", "customDimensions"];

	/**
	 * @constant
	 * Nodes or Document element fetching new resources on a page may have one of these attributes and should be
	 * classified as resources in case resource groups are used in the page param configuration as a type
	 * @type {string[]}
	 */
	var RESOURCE_GROUPS_URL_SRC_PROPERTIES = [
		// img,script,svg,video
		"src",
		// link,iframe
		"href",
		// object (flash)
		"data",
		// object (flash)
		"codebase"
	];
	//
	// Cache of number regular expressions.
	// key is "[decimal][thousands]", value is the regex
	//
	var regExNumberCache = { ".,": REGEX_NUMBER_US_DEFAULT };
	var regExThousandsCache = {
		".": /\./g,
		",": /,/g,
		" ": / /g,
		"'": /'/g
	};

	/**
	 * @typedef {Object} Resource
	 * A resource is an object with a type and a value.
	 * Valid types for a resource are:
	 *  - `queryselector`: A CSS QuerySelector pointing to one or more elements in a document
	 *  - `xpath`: An XPath pointing to one or multiple elements in a document
	 *  - `resource`: A fully qualified URL to a resource on a page referenced in a href,src or other way resulting in an entry in ResourceTiming
	 * @property {string} type - a type definition for the resource (possible values: `queryselector`, `xpath`, `resource`) see description for more information
	 * @property {string} value - a value mapping to the type of the resource
	 */

	/**
	 * @class
	 * @name BOOMR.plugins.PageParams.impl.Handler
	 * A PageVar Handler taking care of mapping a type of PageVar to its result
	 */
	Handler = function(config) {
		this.varname = config.varname;
		this.method = config.method || BOOMR.addVar;
		this.ctx = config.ctx || BOOMR;
		this.preProcessor = config.preProcessor;
		this.sanitizeRE = config.sanitizeRE || /[^\w \-]/g;
		this.cleanUpRE = config.cleanUpRE;
		this.resourceTime = {};
		this.resources = [];
		this.RTSupport = false;
		this.MOSupport = false;

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

		handle: function(o, eventSrc, edata) {
			var h = this;
			if (!this.isValid(o)) {
				return false;
			}
			if (o.label) {
				h = new Handler(this);
				h.varname = o.label;
			}
			return h[o.type](o, eventSrc, edata);
		},

		isValid: function(o) {
			// Valid iff
			return (
				// object is non-falsy
				o &&
				// and object is an object
				typeof o === "object" &&
				// and object has a type attribute
				o.hasOwnProperty("type") &&
				// and object's type attribute is a valid handler type
				typeof this[o.type] === "function" &&
				// and handler has a varname or object has a label
				(this.varname || o.label)
			);
		},

		/**
		 * Cleans up the specified value according to this type's settings.
		 *
		 * @param {string} value Value to clean up
		 * @param {object} def Custom variable definition
		 *
		 * @returns {string} Cleaned-up value
		 */
		cleanUp: function(value, def) {
			var match, regEx = this.cleanUpRE, decimal, thousands, cacheKey;
			if (!value) {
				return value;
			}

			if (regEx) {
				// use the specified or page-default decimal and thousands separators
				decimal = (def && def.decimal) ? def.decimal : impl.defaultDecimal;
				thousands = (def && def.thousands) ? def.thousands : impl.defaultThousands;

				// if the decimal or thousands are not US format, build a new regex
				if (decimal !== DEFAULT_DECIMAL || thousands !== DEFAULT_THOUSANDS) {
					cacheKey = decimal + thousands;

					// get the regex from our cache
					regEx = regExNumberCache[cacheKey];

					if (typeof regEx === "undefined") {
						// build one similar to: (-?(?:[1-9][\d,]*)?[0-9](?:\.\d+)?)
						regEx = new RegExp("(-?(?:[1-9][\\d" + thousands + "]*)?[0-9](?:\\" + decimal + "\\d+)?)");

						regExNumberCache[cacheKey] = regEx;
					}
				}

				match = value.match(regEx);
				if (match && match.length > 1) {
					value = match[1];

					//
					// Change numbers to US-standard without a thousands separator
					// (e.g. 1.000,00 -> 1000.00)
					//

					// get the regex from our cache
					regEx = regExThousandsCache[thousands];

					if (typeof regEx === "undefined") {
						// strip all thousands-separators
						regEx = new RegExp("\\" + thousands, "g");

						regExThousandsCache[thousands] = regEx;
					}

					// remove the thousands separator
					value = value.replace(regEx, "");

					if (decimal !== DEFAULT_DECIMAL) {
						// if the decimal is specified and is not a period,
						// translate to a period for transmission
						value = value.replace(decimal, DEFAULT_DECIMAL);
					}

					return value;
				}
				else {
					return "";
				}
			}

			return value.replace(this.sanitizeRE, "");
		},

		/**
		 * Checks if {@link part} is a valid object-member of {@link value}
		 *
		 * @param {object} value - value to check if it has {@link part} as a member
		 * @param {string} part - member part name to validate if it is a member of the {@link value} object
		 * @returns {boolean} - True if {@link part} is a property of {@link value} else false
		 */
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

			if (element !== null && element.nodeName && (element.nodeName.toUpperCase() === "INPUT" || element.nodeName.toUpperCase() === "SELECT")) {
				// either it is not a checkbox/radio button or it is checked.
				if ((element.type.toLowerCase() !== "checkbox" && element.type.toLowerCase() !== "radio") || element.checked) {
					elementValue = element.value;
				}
			}
			else if (element !== null) {
				// textContent is way faster than innerText in browsers that support
				// both, but IE8 and lower only support innerText so, we test textContent
				// first and fallback to innerText if that fails
				elementValue = element.textContent || element.innerText;
			}

			if ((!o.match || o.match === "numeric")) {
				elementValue = this.cleanUp(elementValue, o);
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

		execSafeRegEx: function(re, operand) {
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

			return re.exec(operand);
		},

		handleRegEx: function(re, extract, operand) {
			var value, m;

			m = this.execSafeRegEx(re, operand);
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

		checkURLPattern: function(u, urlToCheck, doLog) {
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
				if (doLog) {
					BOOMR.debug("No match " + re + " on " + urlToCheck, "PageVars");
				}
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

		runXPath: function(xpath, element) {
			var el, m, tryOurs = false, err;
			element = element || d;
			try {
				if (element.evaluate) {
					el = element.evaluate(xpath, element, null, 9, null);
				}
				else if (element.selectNodes) {
					el = element.selectNodes(xpath);
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
					else if ((m = xpath.match(/\[@id=(["'])([^"']+)\1\]((?:\/\w+(?:\[\d+\])?)*)$/)) !== null) {
						// matches an id somewhere, so root it there
						el = element.getElementById(m[2]);
						if (!el || !m[3]) {
							return el;
						}
						return this.nodeWalk(el, m[3].slice(1));
					}
					else if ((m = xpath.match(/\[@class="([^"]+)"\]((?:\/\w+(?:\[\d+\])?)*)$/)) !== null) {
						// matches a className somewhere, so root it there
						el = element.getElementsByClassName(m[1]);
						if (el && el.length) {
							el = el[0];
						}

						if (!el || !m[2]) {
							return el;
						}

						return this.nodeWalk(el, m[2].slice(1));
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

		runQuerySelector: function(queryselector, element) {
			var el;
			element = element || d;
			try {
				if (element.querySelector) {
					el = element.querySelector(queryselector);
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
				BOOMR.debug("QuerySelector '" + queryselector + "' yielded no result!");
			}

			return el;
		},

		JavaScriptVar: function(o) {
			var res;

			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			res = this.extractJavaScriptVariable(o.varName, o);
			if (!res) {
				impl.mayRetry.push({ handler: this, data: o });

				return false;
			}

			return res;
		},

		Custom: function(o) {
			var res;

			if (!this.checkURLPattern(o.parameter2)) {
				return false;
			}

			res = this.extractJavaScriptVariable(o.parameter1, o);
			if (!res) {
				impl.mayRetry.push({ handler: this, data: o });

				return false;
			}

			return res;
		},

		extractJavaScriptVariable: function(varname, o, parent) {
			var parts, parts_str_prop, value, ctx = parent || w, partIndex;

			if (!varname) {
				return false;
			}

			BOOMR.debug("Got variable: " + varname, "PageVars");

			// Split variable into its parts
			parts = varname.split(/\[((["'])[\w,.-]*\2|\d*)\]|\./);

			// prevent undefined interfering
			for (partIndex = 0; partIndex < parts.length; partIndex++) {
				if (parts[partIndex]) {
					parts[partIndex] = parts[partIndex].replace(/("|')/g, "");
				}
			}

			// Prevent parts from containing "" when splitting ["abc"][0] and similar
			parts = BOOMR.utils.arrayFilter(parts, function(v) {
				return v && v.length > 0;
			});

			if (!parts || parts.length === 0) {
				return false;
			}

			value = ctx[parts.shift()];

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
					value = value[parts.shift()];
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

			if (value === undefined || typeof value === "object" && value !== null) {
				return false;
			}

			BOOMR.debug("final value: " + value, "PageVars");

			if (o && o.match === "boolean") {
				if (value) {
					return this.apply(1);
				}
				else {
					return undefined;
				}
			}

			// Now remove invalid characters
			value = this.cleanUp(String(value), o);

			return this.apply(value);
		},

		URLPattern: function(o) {
			var value;
			if (!o.parameter2) {
				return false;
			}

			BOOMR.debug("Got URL Pattern: " + o.parameter1 + ", " + o.parameter2, "PageVars");

			if (!this.checkURLPattern(o.parameter1)) {
				return false;
			}

			value = BOOMR.utils.getQueryParamValue(o.parameter2, l);
			if (value) {
				BOOMR.debug("final value: " + value, "PageVars");
				value = this.cleanUp(value);
				return this.apply(value);
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

			return this.handleRegEx(
				(
					"^" +
					o.parameter1.replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, "$1.*?").replace(/^\*/, ".*") +
					"(.*)" +
					(o.parameter2 || "").replace(/([.+?\^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/([^\.])\*/g, "$1.*") +
					"$"
				),
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
		Regexp: function(o, url) {
			var m;
			if (url && typeof url === "string") {
				m = url.match("http(|s)://");
			}

			if (m && m.length > 0) {
				return this._Regex(null, o.parameter1, o.parameter2, url);
			}
			else {
				return this._Regex(null, o.parameter1, o.parameter2, l.href);
			}
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

		/**
		 * Finds first resource matching slowest, a url or a URLPattern in all available frames
		 * if we have access to them.
		 * This function masks usage of {@link Handler.prototype.findResources} but pre-sets limit to 1
		 *
		 * @param {String} url - Full URL, a URL pattern Regex or "slowest"
		 * @param {Window} frame - Frame to query for Resource Timings
		 *
		 * @returns {(PerformanceResourceTiming|null)} - First ResourceTiming entity matching url in any frame or null if none found
		 */
		findResource: function(url, frame) {
			var resources = this.findResources(url, frame);

			if (resources === null) {
				return null;
			}

			if (resources && resources.length > 0) {
				return resources[0];
			}
			else {
				return null;
			}
		},
		/**
		 * Check if we are allowed to access perfomance timing information on a given frame
		 *
		 * @param {string} url - URL of a given Resource Timing entry
		 * @param {HTMLFrameElement} frame - Frame to access performance timing on
		 *
		 * @return {(PerformanceResourceTiming[]|null)} - Either the PerformanceResourceTiming object associated with the URL or null if access is denied
		 */
		getFrameResourcesForUrl: function(url, frame) {
			var frameLoc;

			try {
				// Try to access location.href first to trigger any Cross-Origin
				// warnings.  There's also a bug in Chrome ~48 that might cause
				// the browser to crash if accessing X-O frame.performance.
				// https://code.google.com/p/chromium/issues/detail?id=585871
				// This variable is not otherwise used.
				frameLoc = frame.location && frame.location.href;

				if (!("performance" in frame &&
				    frame.performance &&
				    frame.performance.getEntriesByName &&
				    frame.performance.getEntriesByType)) {
					return null;
				}

				return frame.performance.getEntriesByName(url);
			}
			catch (e) {
				if (BOOMR.isCrossOriginError(e)) {
					return null;
				}

				try {
					// PDFs in IE will throw this exception
					if (e.name === "TypeError" && e.message === "Invalid calling object" && frame.document.location.pathname.match(/\.pdf$/)) {
						return null;
					}
				}
				catch (ignore) { /* empty */ }

				BOOMR.addError(e, "PageVars.getFrameResourcesForUrl");
				return null;
			}
		},

		/**
		 * Finds all resources matching slowest or a url or a URLPattern in all available frames
		 * if we have access to them.
		 *
		 * @param {String} url - Full URL, a URL pattern Regex or "slowest"
		 * @param {Window} frame - Frame to query for Resource Timings
		 * @param {Number} limit - the maximum number of resources to look for
		 *
		 * @returns {PerformanceResourceTiming[]} - Resources found matching a URL Pattern
		 */
		findResources: function(url, frame, limit) {
			var i, res, reslist, foundList = [], tempReslist, tempResListIndex;

			if (typeof frame === "number") {
				limit = frame;
				frame = null;
			}

			if (!frame) {
				frame = w;
			}

			reslist = this.getFrameResourcesForUrl(url, frame);

			if (reslist === null) {
				return reslist;
			}

			if (reslist && reslist.length > 0) {
				if (limit && limit === 1 && reslist.length > 1) {
					return [reslist[0]];
				}
				else {
					return reslist;
				}
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
					else if (reslist[i].name && this.checkURLPattern(url, reslist[i].name, false)) {
						foundList.push(reslist[i]);
						if (limit && foundList.length === limit) {
							return foundList;
						}
					}
				}
			}

			if (res) {
				return [res];
			}

			if (frame.frames) {
				for (i = 0; i < frame.frames.length; i++) {
					tempReslist = this.findResources(url, frame.frames[i]);
					if (tempReslist) {
						for (tempResListIndex = 0; tempResListIndex < tempReslist.length; tempResListIndex++) {
							foundList.push(tempReslist[tempResListIndex]);
							if (limit && foundList.length === limit) {
								return foundList;
							}
						}
					}
				}
			}

			return foundList;
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
		},
		Payload: function(o, ename, data) {
			var element, parser, dom, m, value, content, DP = BOOMR.window.DOMParser, JSON = BOOMR.window.JSON;
			// If no data was passed in we're not the main audience for this request
			if (!data) {
				return null;
			}

			if (o.url && !this.checkURLPattern(o.url, data.url)) {
				return null;
			}

			if (o.parameter1 && o.parameter2) {
				// If no actual content was given we can stop right away
				if (!data.response || !data.response.raw) {
					return null;
				}

				if (o.parameter1 === "queryselector" || o.parameter1 === "xpath") {
					// if xml was passed in we can attempt to use it as DOM, otherwise we'll fallback to DOMParsing
					if (data.response.xml) {
						if (o.parameter1 === "queryselector") {
							element = this.runQuerySelector(o.parameter2, data.response.xml);
						}
						else if (o.parameter1 === "xpath") {
							element = this.runXPath(o.parameter2, data.response.xml);
						}
						if (!element) {
							try {
								// Only run this if DOMParser is supported by the browser
								if (DP) {
									parser = new DP();
									dom = parser.parseFromString(data.response.raw);
									if (o.parameter1 === "queryselector") {
										element = this.runQuerySelector(o.parameter2, dom);
									}
									else if (o.parameter1 === "xpath") {
										element = this.runXPath(o.parameter2, dom);
									}
								}
							}
							catch (ex) {
								// Parsing failed
								return null;
							}
						}
						return this.apply(this.extractFromDOMElement(element, o));
					}
				}
				else if (o.parameter1 === "json") {
					if (data.response.json) {
						return this.extractJavaScriptVariable(o.parameter2, o, data.response.json);
					}
					else if (data.response.raw) {
						try {
							if (JSON && typeof JSON.parse === "function") {
								var parsed = JSON.parse(data.response.raw);
								return this.extractJavaScriptVariable(o.parameter2, o, parsed);
							}
						}
						catch (ex) {
							return null;
						}
					}
				}
				else if (o.parameter1 === "substring") {
					content = data.response.text || data.response.raw;

					m = this.execSafeRegEx(o.parameter2, data.response.text);
					if (!m || !m.length) {
						return false;
					}

					value = this.cleanUp(m[0]);

					if (!value) {
						return false;
					}

					return this.apply(value);
				}

			}

			return null;
		},
		/**
		 * @desc
		 * Resource Groups is a Handler Type listening to the fetchStart and stop of a resource or set of
		 * resources on the page initiated by either a SPA navigation type or XHR event we are listening to.
		 *
		 * A resource-set here describes a set of type and value pairs designating a queriable element on the page
		 * An event source is an event on the page we are listening for that we are expecting to correlate with the
		 * resource set element arrival on the page.
		 *
		 * Furthermore these Resource Groups can be delimited in their occurence by the page they appear on.
		 *
		 * For example if we have a page in our app `/app/overview` where we expect to be navigated to and it
		 * is a simple onload procedure on this page we expect there to be an image generated by a previously set
		 * configuration. The image URL would be: `/app/generated/image.gif`
		 *
		 * We can address this image by it's URL or the DOM element via a selector (XPath or CSS).
		 * So, our configuration may look like this:
		 *
		 * @example
		 * {
		 *   name: "Resource Group for generated GIF",
		 *   index: 0,
		 *   label: "ctim.CT0",
		 *   type: "ResourceGroup",
		 *   value: {
		 *     "/app/overview": {
		 *       on: ["onload"],
		 *       resource: [{
		 *         type: "resource",
		 *         value: "/app/generated/image.gif"
		 *       }]
		 *     }
		 *   }
		 * }
		 *
		 * If we wanted to address it by it's CSS Selector:
		 * @example
		 * {
		 *   name: "Resource Group for generated GIF",
		 *   index: 0,
		 *   label: "ctim.CT0",
		 *   type: "ResourceGroup",
		 *   value: {
		 *     "/app/overview": {
		 *       on: ["onload"],
		 *       resource: [{
		 *         type: "queryselector",
		 *         value: "#generated-gif"
		 *       }]
		 *     }
		 *   }
		 * }
		 */
		ResourceGroup: function(config, params) {
			var resourceSet = [], path, resource, performance, resourceSetIndex, listener, obs, src, eventsrc, url, onindex;

			if (BOOMR.utils.isArray(params)) {
				eventsrc = params[0];
				url = params[1];
			}
			else {
				eventsrc = params;
				url = BOOMR.window.document.URL;
			}

			// assume events are onload and need to be run immediately if no eventsrc is given
			src = (typeof eventsrc !== "undefined" ? eventsrc : "onload");
			src = (src === "load" ? "onload" : eventsrc);

			if (!config.value) {
				return;
			}
			this.config = config;
			// Validate that the value keys match the URL we're loaded on
			for (path in config.value) {
				if (config.value.hasOwnProperty(path)) {

					// Match the URL against current location if that matches check resource property is available and is populated
					if (this.checkURLPattern(path, url) &&
						(config.value[path].resources &&
						 config.value[path].resources.length > 0)) {

						// Check the event this resource is supposed to be tracked on (spa_hard, spa, xhr, onload)
						// If we are running on init and resources are `onload` include them as well as they might be added after boomerang is loaded via JavaScript
						if (config.value[path].on &&
							config.value[path].on.length > 0 &&
							(BOOMR.utils.inArray(src, config.value[path].on) || src === "init" && BOOMR.utils.inArray("onload", config.value[path].on))) {

							// For each Resource in resource[]
							for (var resourceIndex in config.value[path].resources) {

								if (config.value[path].resources.hasOwnProperty(resourceIndex)) {
									// If `on` is defined and has more than one element in it we check against the eventsrc
									// Otherwise expect the onload and immediate evaluation
									resourceSet.push(config.value[path].resources[resourceIndex]);
								}
							}
						}

						// Skip the Rest of the URLs if the first URL matches!
						break;
					}
				}
			}

			// No Matching resourceSets found
			if (resourceSet.length === 0) {
				return null;
			}

			this.resourceSet = resourceSet;
			performance = BOOMR.getPerformance();

			if (performance && typeof performance.getEntriesByType === "function") {
				this.RTSupport = true;
			}

			if (BOOMR.window && BOOMR.window.MutationObserver) {
				this.MOSupport = true;
			}

			this.eventsrc = src;

			if (this.RTSupport) {
				// iterate through resources finding URLs
				for (resourceSetIndex = 0; resourceSetIndex < resourceSet.length; resourceSetIndex++) {
					// If the type is `init` this is after the Handler was initialized so don't check Resource Groups now
					if (src !== "init" && src !== "xhr") {
						this.refreshResourceGroupTimings(this.lookupResources(resourceSetIndex));
					}

					if (this.MOSupport && (src === "init" || this.isOnPageEvent())) {
						this.obs = this.setupMutationObserver(resourceSetIndex);
					}
				}
			}
			else if (!this.RTSupport && this.MOSupport && (src === "init" || this.isOnPageEvent())) {
				for (resourceSetIndex = 0; resourceSetIndex < resourceSet.length; resourceSetIndex++) {
					obs = this.setupMutationObserver(resourceSetIndex);
					if (obs) {
						this.observer = obs;
					}
				}
			}
			else if (!this.RTSupport && !this.MOSupport && (src === "init" || this.isOnPageEvent())) {
				for (resourceSetIndex = 0; resourceSetIndex < resourceSet.length; resourceSetIndex++) {
					listener = this.setupListener(resourceSetIndex);
					if (listener) {
						this.listener = listener;
					}
				}
			}

			var self = this;
			BOOMR.subscribe("before_beacon", function(vars) {
				// not applying on unload beacon
				if (vars.hasOwnProperty("rt.quit")) {
					return;
				}

				if (!self.attached) {
					self.applyTimedResources(true);
					self.attached = true;
				}
				return;
			});

			return this;
		},
		/**
		 * @desc
		 * Setup a mutation observer watching nodes referenced by the Resource passed in
		 * This will only work if the Resource in question also is a container. Otherwise we are returning null.
		 *
		 * @param {Resource} resource - resource to potentially watch
		 */
		setupMutationObserver: function(index) {
			var resource = this.resourceSet[index], node = this.getNode(index), obsConfig = {
				childList: true,
				attributes: true,
				subtree: true,
				attributeFilter: RESOURCE_GROUPS_URL_SRC_PROPERTIES
			};

			if (!this.isOnPageEvent() && this.eventsrc === "onload") {
				return;
			}

			if (resource.type === "resource") {
				node = BOOMR.window.document.body;
			}

			if (!node && node === null) {
				this.resourceSet[index].found = false;
				this.resourceSet[index].fallback = true;

				// node may be null because the element hasn't been added yet so we are waiting for it on the document;
				node = BOOMR.window.document.body;
			}

			if (node && !this.isContainer(node)) {
				this.resourceSet[index].found = true;
				// Don't setup an MO if this is not a container
				return null;
			}

			// Even if we expect new elements to arrive via MO we need to check the already added elements
			this.traverseElements(node, index);

			BOOMR.debug("Starting a Mutation observer for Resource: " + this.config.label + "", "PageVars.ResourceGroup");
			return BOOMR.utils.addObserver(node, obsConfig, null, this.mutationCb.bind(this), index, this);
		},
		/**
		 * @desc
		 * Attaches `onload`-listeners to elements matching resource set. Will start an interval with a callback checking our found node and if it has new elements
		 * @param {number} index - Array index of resource set element to use
		 */
		setupListener: function(index) {
			var resource = this.resourceSet[index], node = this.getNode(index), timeout = null, runtime = 0, that = this, lastRun = BOOMR.now();

			if (resource.type === "resource") {
				node = BOOMR.window.document.body;
			}

			if ((!node || node === null) && BOOMR.window.document.body) {
				this.resourceSet[index].found = false;
				this.resourceSet[index].fallback = true;

				// node may be null because the element hasn't been added yet so we are waiting for it on the document;
				node = BOOMR.window.document.body;
			}

			// Body might still be null if we run in IE8 returning
			// waiting for a later run.
			if (BOOMR.window.document.body === node && node === null) {
				return null;
			}

			// If the node is not a container attach to it
			if (node && !this.isContainer(node)) {
				this.resourceSet[index].found = true;
				this.initResourceGroupListener(node, index);
				return null;
			}

			this.traverseElements(node, index);

			function timeoutCb() {
				if (runtime >= RESOURCE_GROUPS_CHILDLISTENER_TIMEOUT) {
					clearInterval(timeout);
					return;
				}

				that.traverseElements(node, index);
				runtime += BOOMR.now() - lastRun;
				lastRun = BOOMR.now();
			}
			timeout = setInterval(timeoutCb, 100);

		},
		/**
		 * @desc
		 * Finds all child elements that are network bound
		 * @param {Node} node - Node with child elements
		 *
		 * @returns {Node[]} - All network-bound nodes with in @param{node}
		 */
		findResourceChildren: function(node) {
			var nodeChildren = [], networkResourceIndex, foundIndex, foundElements;
			if (!node || !node.getElementsByTagName) {
				return nodeChildren;
			}

			for (networkResourceIndex = 0; networkResourceIndex < PAGE_PARAM_RESOURCEGROUP_NETWORK_RESOURCES.length; networkResourceIndex++) {
				foundElements = node.getElementsByTagName(PAGE_PARAM_RESOURCEGROUP_NETWORK_RESOURCES[networkResourceIndex]);
				for (foundIndex = 0; foundIndex < foundElements.length; foundIndex++) {
					nodeChildren.push(foundElements[foundIndex]);
				}
			}

			return nodeChildren;
		},
		/**
		 * @desc
		 * Finds all network-bound elements in a container and attaches a listener to them if matching our resource group
		 * @param {Node} node - A container element to search
		 * @param {number} index - resourceSet array index to search for
		 */
		attachContainerElements: function(node, index) {
			var resource = this.resourceSet[index], nodeChildren = [], childIndex, nodeURL;
			nodeChildren = this.findResourceChildren(node);
			for (childIndex in nodeChildren) {
				nodeURL = this.getNodeURL(nodeChildren[childIndex]);
				// If we're looking for only one resource check that we are looking at the right URL
				// otherwise attach to all elements matching
				if (resource.type === "resource" && nodeURL && this.checkURLPattern(resource.value, nodeURL)) {
					this.resourceSet[index].found = true;
					this.initResourceGroupListener(nodeChildren[childIndex], index);
					break;
				}
				else if (resource.type === "resource" && !(nodeURL && this.checkURLPattern(resource.value, nodeURL))) {
					if (!nodeURL && this.isOnPageEvent()) {
						// Some SPAs don't attach a src value to the node when mutationCb was called and needs to
						// attach. So we're checking that this eventsrc was spa/spa_hard/xhr and make sure to still attach
						// to the element
						this.initResourceGroupListener(nodeChildren[childIndex], index);
					}
					continue;
				}
				else {
					this.initResourceGroupListener(nodeChildren[childIndex], index);
				}
			}
		},
		/**
		 * @desc
		 * Search node and child nodes for elements we need to attach ourselves to if required by resourceSet element
		 */
		traverseElements: function(node, index) {
			var resource = this.resourceSet[index], nodes = [], nodeURL;
			nodeURL = this.getNodeURL(node);

			if (resource.type === "resource") {
				if (nodeURL && this.checkURLPattern(resource.value, nodeURL)) {
					this.resourceSet[index].found = true;
					this.initResourceGroupListener(node, index);
				}
				else if (this.isContainer(node)) {
					this.attachContainerElements(node, index);
				}
			}
			else {
				if (this.isContainer(node) && !resource.fallback) {
					this.resourceSet[index].found = true;
					this.attachContainerElements(node, index);
				}
				else if (!this.isContainer(node)) {
					this.resourceSet[index].found = true;
					this.initResourceGroupListener(node, index);
				}
			}
		},
		/**
		 * @desc
		 * Called when the mutation observer sees a new set of resources added to the page
		 * @callback Handler~mutationCb
		 * @param {MutationRecord[]} mutation - Mutation
		 */
		mutationCb: function(mutations, index) {
			var resource = this.resourceSet[index], node, nodes = [], mutation, mutationIndex, nodeIndex, addedNodes, addedIndex;
			if (mutations && mutations.length > 0) {
				for (mutationIndex = 0; mutationIndex < mutations.length; mutationIndex++) {
					mutation = mutations[mutationIndex];
					if (mutation.addedNodes && mutation.addedNodes.length > 0) {
						addedNodes = mutation.addedNodes;
						for (addedIndex = 0; addedIndex < addedNodes.length; addedIndex++) {
							nodes.push(addedNodes[addedIndex]);
						}
					}
				}

				if (nodes && nodes.length > 0) {
					node = this.getNode(index);

					if (this.RTSupport) {
						this.refreshResourceGroupTimings(this.lookupResources(index), this.config);
					}

					for (nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
						this.traverseElements(nodes[nodeIndex], index);
					}

					// Re-Start MO on node since we found it now!
					if (node && !node.hasOwnProperty("length")) {
						if (this.obs && this.obs.observer && this.resourceSet[index].fallback) {
							BOOMR.debug("Re-Starting MO since we found the node for the ResourceSet", "PageVars.ResourceGroup");
							this.resourceSet[index].fallback = false;

							this.obs.observer.disconnect();
							clearTimeout(this.obs.timer);
							this.setupMutationObserver(index);
						}
					}
				}
			}
		},
		/**
		 * @desc
		 * Test if current event source is an on-page event such as SPA soft/hard navigation or XHR
		 * @returns {bool} - True if the current event source is an on-page event
		 */
		isOnPageEvent: function(src) {
			if (!src) {
				return (this.eventsrc === "spa" ||
						this.eventsrc === "spa_hard" ||
						this.eventsrc === "xhr");
			}
			else {
				return (src === "spa" ||
						src === "spa_hard" ||
						src === "xhr");
			}
		},
		/**
		 * @desc
		 * Check if all resource sets assigned to this handler have been resolved
		 * @returns {boolean} - True if all resourceSet elements have been found
		 */
		resourceSetIsResolved: function() {
			var index = this.getUnresolvedIndex();
			// If we get a number we know that RG failed!
			if (typeof index === "boolean") {
				return true;
			}
			else if (typeof index === "number"){
				return false;
			}
		},
		/**
		 * @desc
		 * Return the Resource Set array index of the element that has not been resolved to an element on the page
		 * @returns {number} - Index of the Resource Set element in resource set Array for this configured item
		 */
		getUnresolvedIndex: function() {
			var resourceSetIndex = 0;
			for (resourceSetIndex; resourceSetIndex < this.resourceSet.length; resourceSetIndex++) {
				if (!this.resourceSet[resourceSetIndex].found) {
					return resourceSetIndex;
				}
			}
			return false;
		},
		/**
		 * @desc
		 * If there are resourceSet elements that have not been resolved add them to the beacon as a param if all are
		 * resolved return true.
		 */
		hasUnresolvedAddVar: function() {
			if (!this.resourceSetIsResolved()) {
				var unresolvedIndex = this.getUnresolvedIndex();
				BOOMR.addVar(this.varname + "_rg.err", "nf|" + unresolvedIndex);
				this.resolved = false;
				BOOMR.debug("Resource Group '" + this.config.label + "' has not been resolved fully, not going to apply timer!", "PageVars.ResourceGroup");

				return true;
			}
			return false;
		},
		/**
		 * @desc
		 * Takes the delta of the stored {@link resourceTime} objects `start` and `stop` and applies it as a current custom timer value
		 * If the resource group was not fully resolved add a var to the beacon pointing to the varname that was not found
		 */
		applyTimedResources: function(log) {
			if (isNaN(this.resourceTime.start) || isNaN(this.resourceTime.stop)) {
				BOOMR.debug("Start or stop time for this resource group were not numeric (" + this.resourceTime.start + "," + this.resourceTime.stop + ")", "PageVars");
				return false;
			}

			if (this.resourceTime.stop === 0) {
				BOOMR.debug("Stop time was 0, this should not happen!", "PageVars");
				BOOMR.addVar(this.varname + "_rg.err", "ne|-");
				return false;
			}

			if (this.hasUnresolvedAddVar()) {
				// Not applying anything to the beacon until everything is resolved!
				return false;
			}
			else {
				this.resolved = true;
				BOOMR.removeVar(this.varname + "_rg.err");
			}

			if (log) {
				BOOMR.debug("Resource Group '" + this.config.label + "' final values: " + (this.resourceTime.stop - this.resourceTime.start), "PageVars.ResourceGroup");
			}
			BOOMR.addVar(this.varname + "_st", Math.round(this.resourceTime.start));
			if (this.obs && this.obs.observer) {
				this.obs.observer.disconnect();
				clearTimeout(this.obs.timer);
			}
			return this.apply(this.resourceTime.stop - this.resourceTime.start);
		},
		/**
		 * @desc
		 * Resolves a node or resource to an array of resources if ResourceTiming is supported
		 *
		 * @param {Resource} resource - a resource that is part of a resource group
		 * @return {Object[]} - An array of resources mapping to the found ResourceTiming entries found referring to the Resource passed in
		 */
		lookupResources: function(index) {
			var resource = this.resourceSet[index], ret = this.getNode(index), resources = [], url, children;

			// check that returned value is a node type
			if (ret && !ret.hasOwnProperty("length")) {
				this.resourceSet[index].found = true;
				url = this.getNodeURL(ret);
				// if url is a string
				if (url) {
					// We have a qualified URL time to find it in resource timing
					resources = this.findResources(url);
				}
				else {
					children = this.findChildElements(ret);
					for (var childIndex = 0; childIndex < children.length; childIndex++) {
						// we know it's a exact URL so it's fine to call findResource instead of the plural equivalent
						resources.push(this.findResource(this.getNodeURL(children[childIndex])));
					}
				}
			}
			else if (ret && ret.hasOwnProperty("length")) {
				if (ret.length > 0) {
					this.resourceSet[index].found = true;
				}
				// we have an array from findResources
				return ret;
			}

			// ret had an unexpected value hoping resources was filled by the first if-branch
			return resources;
		},
		/**
		 * @desc
		 * Takes an array of resources and applies their timing to the current ResourceGroup timing
		 */
		refreshResourceGroupTimings: function(resources) {
			if (resources.length > 0) {
				// We found resources for this RG time to map
				for (var resourceIndex = 0; resourceIndex < resources.length; resourceIndex++) {
					this.updateResourceGroupDelta(resources[resourceIndex]);
				}

				// if applying the timer failed we will try again at a later point
				if (!this.applyTimedResources()) {
					BOOMR.debug("Applying timed Resources failed", "PageParams.ResourceGroup");
				}
			}
		},
		/**
		 * @desc
		 * If node passed in as only param does not return with a src URL or a URL of any kind we
		 * define it as a container element
		 *
		 * @param {HTMLElement} node - Node to test if it's a node or not
		 * @return {boolean}
		 */
		isContainer: function(node) {
			var url;
			if (node && typeof node.nodeName === "string") {
				url = this.getNodeURL(node);
				if (!url) {
					return true;
				}
				else {
					return false;
				}
			}
		},
		/**
		 * @desc
		 * Get's node from {@link Resource}
		 *
		 * @param {Resource} resource - a resource that is part of a resource group
		 * @return {(Node|PerformanceResourceTiming[])} - Either a node or a PerformanceResourceTiming object referring to a Resource
		 */
		getNode: function(index) {
			var ret, resource = this.resourceSet[index];
			switch (resource.type) {
			case "xpath":
				ret = this.runXPath(resource.value);
				break;
			case "queryselector":
				ret = this.runQuerySelector(resource.value);
				break;
			case "resource":
				if (this.RTSupport) {
					ret = this.findResources(resource.value);
				}
				break;
			default:
				BOOMR.debug("Found Item of unknown type (" + resource.type + "), skipping...", "PageVars");
				break;
			}

			if (!ret) {
				this.resourceSet[index].found = false;
			}

			return ret;
		},
		/**
		 * @desc
		 * Find child elements of a node that can trigger a network request
		 *
		 * @param {HTMLElement} node - Parent node that is a container that may contain elements that can trigger network requests
		 * @return {HTMLElement[]} - Array of child nodes
		 */
		findChildElements: function(node) {
			var nodes = [], foundNodes, nodeIndex, tagIndex;
			for (tagIndex in PAGE_PARAM_RESOURCEGROUP_NETWORK_RESOURCES) {
				foundNodes = node.getElementsByTagName(PAGE_PARAM_RESOURCEGROUP_NETWORK_RESOURCES[tagIndex]);
				for (nodeIndex = 0; nodeIndex < foundNodes.length; nodeIndex++) {
					nodes.push(foundNodes[nodeIndex]);
				}
			}
			return nodes;
		},
		/**
		 * @desc
		 * Extract URL from a node that can have a resource bound to it
		 *
		 * @param {HTMLElement} node - DOM node element with a possible URL attribute triggering network requests
		 * @return {string|null} - will return URL referring to a downloadable resource or null if it did not match a node-type
		 */
		getNodeURL: function(node) {
			var nodeProp, nodeName;

			if (!node) {
				return null;
			}

			switch (node.nodeName) {
			case "IMG":
			case "IFRAME":
			case "SCRIPT":
			case "LINK":
			case "OBJECT":
			case "SVG":
				for (var srcPropertiesIndex = 0; srcPropertiesIndex < RESOURCE_GROUPS_URL_SRC_PROPERTIES.length; srcPropertiesIndex++) {
					nodeProp = node[RESOURCE_GROUPS_URL_SRC_PROPERTIES[srcPropertiesIndex]];
					if (typeof nodeProp === "string" && nodeProp.length > 0) {
						return nodeProp;
					}
				}
				break;
			default:
				return null;
				break;
			}
		},
		/**
		 * @desc
		 * Update the distance between start and end of a set of resources start and end times
		 * @param {ResourceEntry} resource - a resource with a fetchStart and responseEnd entry to match against the current earliest start timestamp and last response ending time.
		 */
		updateResourceGroupDelta: function(resource) {
			if (!resource || (resource && !resource.responseEnd)) {
				BOOMR.debug("Tried to update ResourceGroup delta with unfinished resource!", "PageVars");
				return;
			}

			if (!this.resourceTime.start || this.resourceTime.start > resource.fetchStart) {
				this.resourceTime.start = resource.fetchStart;
			}

			if (!this.resourceTime.stop || this.resourceTime.stop < resource.responseEnd) {
				this.resourceTime.stop = resource.responseEnd;
			}

			BOOMR.debug("New Resource Times for resource: '" + this.config.label + "' start(" + this.resourceTime.start + ") , stop (" + this.resourceTime.stop + ") delta(" + (this.resourceTime.stop - this.resourceTime.start) + ")", "PageVars.ResourceGroup");
		},
		/**
		 * @desc
		 * Attaches a resource group listener to a node and adds attributes to the Node object to set fetchStart and responseEnd
		 * These attributes are only used when ResourceTiming is not available
		 */
		initResourceGroupListener: function(nodeChild, index) {
			var resource = this.resourceSet[index], tempRG;

			nodeChild._bmr_rg = nodeChild._bmr_rg || {};
			nodeChild._bmr_rg.fetchStart = nodeChild._bmr_rg.fetchStart ? nodeChild._bmr_rg.fetchStart : BOOMR.now();

			// this may be run twice on the same element if the resource is part of multiple overlapping resource groups
			if (!nodeChild._bmr_rg_resource) {
				nodeChild._bmr_rg_resource = resource;
				this.addResourceGroupListener(nodeChild, index);
				return;
			}
			else if (nodeChild._bmr_rg_resource && !nodeChild._bmr_rg_resource.hasOwnProperty("length")) {
				tempRG = nodeChild._bmr_rg_resource;
				nodeChild._bmr_rg_resource = [];
			}

			nodeChild._bmr_rg_resource.push(tempRG, resource);
			this.addResourceGroupListener(nodeChild, index);
		},
		/**
		 * @desc
		 * Add an EventListener to the node found to listen to
		 */
		addResourceGroupListener: function(node, index) {
			var that = this, resource = this.resourceSet[index];

			function nodeLoaded(event) {
				// event.targeg is not defined on IE8, but srcElement is
				var nodeTarget = event.target ? event.target : event.srcElement, nodeURL = that.getNodeURL(nodeTarget), resources;

				if (that.RTSupport) {
					// Since in SPA navigations image resources may have been initially added to the
					// page without a src URL we're checking here if the resource now has a URL and if it matches the resource we're looking for
					if (resource.type === "resource" && nodeURL && that.checkURLPattern(resource.value, nodeURL)) {
						resources = that.findResources(nodeURL);
						if (resources.length > 0) {
							that.resourceSet[index].found = true;
							that.refreshResourceGroupTimings(resources, that.config);
						}
					}
					else {
						that.refreshResourceGroupTimings(that.findResources(that.getNodeURL(nodeTarget)), that.config);
					}
				}
				else {
					nodeURL = that.getNodeURL(nodeTarget);
					if (resource.type === "resource" && nodeURL && that.checkURLPattern(resource.value, nodeURL)) {
						nodeTarget._bmr_rg.responseEnd = nodeTarget._bmr_rg.responseEnd || BOOMR.now();
						that.updateResourceGroupDelta(nodeTarget._bmr_rg);
					}
					else {
						// Multiple eventlisteners due to multiple resource groups overlapping
						if (nodeTarget._bmr_rg && nodeTarget._bmr_rg.responseEnd && nodeTarget._bmr_rg.fetchStart) {
							that.updateResourceGroupDelta(nodeTarget._bmr_rg);
						}
						else {
							// Prevent overlapping elements to update the end value
							nodeTarget._bmr_rg.responseEnd = nodeTarget._bmr_rg.responseEnd || BOOMR.now();
							that.updateResourceGroupDelta(nodeTarget._bmr_rg);
						}
					}
				}
				that.applyTimedResources();
			}

			if (node.addEventListener) {
				node.addEventListener("load", nodeLoaded);
			}
			else if (node.attachEvent) {
				node.attachEvent("onload", nodeLoaded);
			}
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
		xhrPageGroups: [],
		priorityHandler: {},

		complete: false,
		initialized: false,
		configReceived: false,
		rerunAfterConfig: false,
		unloadFired: false,
		onloadfired: false,

		defaultDecimal: DEFAULT_DECIMAL,
		defaultThousands: DEFAULT_THOUSANDS,
		hasXhrOn: false,
		hasXhrIgnore: false,
		autorun: true,

		beaconQueue: [],

		mayRetry: [],
		matchPageGroupList: function(url, list, handler) {
			var xhrPgIndex = 0, ret;
			for (xhrPgIndex = 0; xhrPgIndex < list.length; xhrPgIndex++) {
				ret = handler.handle(list[xhrPgIndex], url);
				BOOMR.debug("Found XHR PageParam matching URL: " + BOOMR.utils.objectToString(ret), "PageParams");
				if (ret) {
					return true;
				}
			}
			return false;
		},
		excludeXhrFilter: function(anchor) {
			var xhrPgIndex = 0, hconfig = PAGE_PARAMS_BASE_HANDLER_CONFIG(), pgArray, ret;

			hconfig.pageGroups.varname = "xhr.pg";

			// Only iterate over xhrPageroups if on:["xhr"] was set on the pageGroups
			if (impl.hasXhrOn) {
				pgArray = impl.xhrPageGroups;
			}
			else {
				pgArray = impl.pageGroups;
			}

			var handler = new Handler(hconfig.pageGroups);
			// only run the filter if we have an xhr flag in the config
			if (typeof impl.xhr !== "undefined") {
				/*
				 - match: Only instrument matching filters
				 - none: Do not instrument at all
				 - all: Instrument all XHRs
				 - subresource: to be flagged as subresource
				 */
				// Match against the PageGroups
				if (impl.xhr === "match") {
					for (xhrPgIndex = 0; xhrPgIndex < pgArray.length; xhrPgIndex++) {
						ret = handler.handle(pgArray[xhrPgIndex], anchor.href);
						if (!ret) {
							BOOMR.debug("Found XHR PageParam matching URL: " + BOOMR.utils.objectToString(ret), "PageParams");
							return true;
						}
					}

					return false;
				}
				else {
					if (impl.xhr === "none") {
						return true;
					}
					else if (impl.xhr === "all" || impl.xhr === "subresource") {
						// Even though our xhr flag was set to instrument all XHRs we need to honor ignore flags
						// If we find an entry with ignore and the Handler matches throw away that XHR
						for (xhrPgIndex = 0; xhrPgIndex < pgArray.length; xhrPgIndex++) {
							if (pgArray[xhrPgIndex].ignore) {
								ret = handler.handle(pgArray[xhrPgIndex], anchor.href);
								if (ret) {
									BOOMR.debug("Found XHR PageParam matching URL: " + BOOMR.utils.objectToString(ret), "PageParams");
									return true;
								}
							}
						}
					}
				}
			}
			// If the config did not contain xhr flag, we're expecting not to filter out anything
			return false;
		},
		done: function(edata, ename) {
			var i, v, hconfig, handler, limpl = impl, data, pg, match, onlyDimensions = false;

			if (!impl.configReceived) {
				// we should try to run again after config comes in
				impl.rerunAfterConfig = {
					edata: edata,
					ename: ename
				};
				return;
			}

			hconfig = PAGE_PARAMS_BASE_HANDLER_CONFIG();

			if (ename !== "xhr" && ename !== "error" && this.complete) {
				return;
			}

			BOOMR_check_doc_domain();

			//
			// XHRs are handled differently than normal or SPA navigations (which apply
			// all Page Groups, Timers, Metrics, Dimensions and ABs).  XHRs look at Page Groups
			// and remove any _subresource in the name.  XHRs also only apply Timers, Metrics
			// and Dimensions that have 'xhr_ok' set.
			//
			if (ename === "xhr" && edata && !BOOMR.utils.inArray(edata.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
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

					// Flag this resource as subresource if it wasn't explicitly called out in the configuration to be a instrumented XHR
					match = impl.matchPageGroupList(l.href, impl.hasXhrOn ? impl.xhrPageGroups : impl.pageGroups, new Handler(hconfig.pageGroups));
					if (impl.xhr === "subresource" && !match) {
						edata.subresource = "active";
					}

					// Use XHR PG List if it's available
					if (impl.hasXhrOn) {
						limpl.pageGroups = impl.xhrPageGroups;
					}
					else {
						limpl.pageGroups = impl.pageGroups;
					}

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

			if (ename === "error") {
				// for error beacons, only include dimensions, not metrics or timers
				onlyDimensions = true;
			}

			// Since we're going to write new stuff, clear out anything that we've previously written but couldn't be beaconed
			impl.clearMetrics();

			// Also clear the retry list since we'll repopulate it if needed
			impl.mayRetry = [];

			// Page Groups, AB Tests, Custom Metrics & Timers
			for (v in hconfig) {
				if (hconfig.hasOwnProperty(v)) {
					handler = new Handler(hconfig[v]);

					if (onlyDimensions && !hconfig[v].isDimension) {
						// skip this type if we're only asking for dimensions and this isn't a dimension
						continue;
					}

					// if data.pg (hard set page group from xhr_send/xhr_load/...) just skip the pageGroups config and move on
					if (ename === "xhr" && v === "pageGroups" && data && data.pg && typeof data.pg === "string") {
						BOOMR.debug("Found data.pg on data param " + data.pg, "PageParams");
						handler.apply(data.pg);
						continue;
					}
					for (i = 0; i < limpl[v].length; i++) {
						if (ename !== "xhr" && limpl[v][i].only_xhr) {
							// do not process xhr only items for non-xhr requests
							continue;
						}
						if (handler.handle(limpl[v][i], ename, data) && hconfig[v].stopOnFirst) {
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
		/**
		 * @desc
		 * If configuration for PageParams contains a page param Handler type with a value of 1 in
		 * {@link PAGE_PARAM_TRY_PRIORITY} run them and run their handle. This allows us to listen for later
		 * changes to the page via EventListeners and fetch data to attach to the beacon as early as possible.
		 */
		checkPrioritizedPageParams: function(type) {
			var highPriorityParams = impl.checkHighPriorityParams(), hconfig, handleConfig, handler, handlerInstance, hpPpNameIndex, ppName, ppNameIndex;
			if (highPriorityParams) {
				for (ppNameIndex = 0; ppNameIndex < PAGE_PARAMS_NAMES.length; ppNameIndex++) {
					ppName = PAGE_PARAMS_NAMES[ppNameIndex];

					if (!highPriorityParams[ppName]) {
						continue;
					}

					for (hpPpNameIndex = 0; hpPpNameIndex < highPriorityParams[ppName].length; hpPpNameIndex++) {
						hconfig = PAGE_PARAMS_BASE_HANDLER_CONFIG();
						handleConfig = highPriorityParams[ppName][hpPpNameIndex];

						if (hconfig.hasOwnProperty(ppName) && !impl.priorityHandler.hasOwnProperty(handleConfig.label)) {
							handler = new Handler(hconfig[ppName]);
							handlerInstance = handler.handle(handleConfig, type);
							if (handlerInstance) {
								impl.priorityHandler[handleConfig.label] = handlerInstance;
							}
						}
					}
				}
			}
		},
		/**
		 * @desc
		 * Handlers that we returned an instance for when running prioritized and stuck around are removed from impl object onbeacon
		 */
		removeDoneHandlers: function()  {
			var label;
			for (label in impl.priorityHandler) {
				if (impl.priorityHandler.hasOwnProperty(label) && impl.priorityHandler[label].resolved) {
					delete impl.priorityHandler[label];
				}
			}
		},
		/**
		 * @desc
		 * Iterate through page params and find elements that match the {@link PAGE_PARAM_TRY_PRIORITY}
		 * high priority values (value = 1) thus being able to be run at an earlier time
		 *
		 * @return {object} - Returns an object with keys corresponding to page params and array holding
		 * objects containing the page param
		 */
		checkHighPriorityParams: function() {
			var collected = {};

			for (var ppIndex = 0; ppIndex < PAGE_PARAMS_NAMES.length; ppIndex++) {
				var param = impl[PAGE_PARAMS_NAMES[ppIndex]];
				if (param && param.hasOwnProperty("length") && param.length > 0) {
					for (var paramIndex = 0; paramIndex < param.length; paramIndex++) {
						if (param[paramIndex].type &&
							PAGE_PARAM_TRY_PRIORITY[param[paramIndex].type] &&
							PAGE_PARAM_TRY_PRIORITY[param[paramIndex].type] === 1) {

							collected[PAGE_PARAMS_NAMES[ppIndex]] = collected[PAGE_PARAMS_NAMES[ppIndex]] || [];
							collected[PAGE_PARAMS_NAMES[ppIndex]].push(param[paramIndex]);
						}
					}
				}
			}
			return collected;
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

			if (!data.url &&
			    (!data.timers     || !data.timers.length) &&
			    (!data.metrics    || !data.metrics.length) &&
			    (!data.dimensions || !data.dimensions.length)
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
		},

		/**
		 * Fired on before_unload
		 */
		onunload: function() {
			impl.unloadFired = true;
			return this;
		},

		/**
		 * Fired on before_beacon
		 */
		onBeforeBeacon: function(vars) {
			if (vars && vars["http.initiator"] === "error") {
				impl.done({}, "error");
			}
		},

		prerenderToVisible: function() {
			// ensure we add our data to the beacon even if we had added it
			// during prerender (in case another beacon went out in between)
			this.complete = false;

			// add our data to the beacon
			this.done({}, "load");
		},

		/**
		 * Runs the specified PageParams handler
		 *
		 * @param {string} type Type of dimension (e.g. pageGroups)
		 * @param {function} setMethod Method to run on match
		 */
		runPageParamsHandler: function(type, setMethod) {
			var i,
			    handlerConfig = PAGE_PARAMS_BASE_HANDLER_CONFIG()[type],
			    handler,
			    config = impl[type],
			    ret;

			// set the location
			l = BOOMR.window.location;

			handlerConfig.method = setMethod;
			handler = new Handler(handlerConfig);

			for (i = 0; i < config.length; i++) {
				if (config[i].only_xhr) {
					// do not process XHR only items for non-XHR requests
					continue;
				}

				ret = handler.handle(config[i], "custom");

				if (ret && handlerConfig.stopOnFirst) {
					return ret;
				}
			}
		},

		/**
		 * Processes all dimension handlers (Page Groups, A/B tests and Custom Dimensions)
		 * and runs the specified method for any matches.
		 *
		 * @param {function} method Method to run on match
		 */
		runAllDimensions: function(method) {
			impl.runPageParamsHandler("pageGroups", method);
			impl.runPageParamsHandler("abTests", method);
			impl.runPageParamsHandler("customDimensions", method);
		},

		/**
		 * Sends a Custom Metric immediately
		 *
		 * @param {string} name Metric name
		 * @param {number} [value] Metric value (1 if not specified)
		 */
		sendMetric: function(name, value) {
			if (typeof name !== "string") {
				return;
			}

			if (typeof value !== "undefined" &&
				typeof value !== "number") {
				return;
			}

			if (typeof value === "undefined") {
				value = 1;
			}

			var metrics = {};
			metrics[name] = value;

			impl.sendMetrics(metrics);
		},

		/**
		 * Sends a set of Custom Metrics immediately
		 *
		 * @param {object} metrics An object containing Custom Metric names and values
		 */
		sendMetrics: function(metrics) {
			if (typeof metrics !== "object") {
				return;
			}

			impl.addToBeaconQueue("metric", metrics);
			BOOMR.setImmediate(impl.processBeaconQueue);
		},

		/**
		 * Sends a Custom Timer immediately
		 *
		 * @param {string} name Timer name
		 * @param {number} value Timer value
		 */
		sendTimer: function(name, value) {
			if (typeof name !== "string") {
				return;
			}

			if (typeof value !== "number") {
				return;
			}

			var timers = {};
			timers[name] = value;

			impl.sendTimers(timers);
		},

		/**
		 * Sends a set of Custom Timers immediately
		 *
		 * @param {object} timers An object containing Custom Timer names and values
		 */
		sendTimers: function(timers) {
			if (typeof timers !== "object") {
				return;
			}

			impl.addToBeaconQueue("timer", timers);
			BOOMR.setImmediate(impl.processBeaconQueue);
		},

		/**
		 * Adds a Custom Timer or Custom Metric to the queue
		 *
		 * @param {string} type "metrics" or "timers"
		 * @param {string} values Data
		 */
		addToBeaconQueue: function(type, values) {
			var vars = {};

			var data = {
				type: type,
				values: values,
				vars: vars,
				when: BOOMR.now()
			};

			if (impl.configReceived) {
				// we have config, process all dimensions
				impl.runAllDimensions(function(name, val) {
					vars[name] = val;
				});
			}
			else {
				// run dimensions when config comes in
				data.needsDimensions = true;
			}

			impl.beaconQueue.push(data);
		},

		/**
		 * Processes the Custom Timer / Custom Metric beacons queue
		 *
		 * @param {boolean} calledFromTimer Whether or not we were called from a timer
		 */
		processBeaconQueue: function(calledFromTimer) {
			var q, data = {}, i, valName, found = false, anyFound = false, varName;

			if (impl.beaconQueue.length === 0) {
				// no work
				return;
			}

			if (!impl.configReceived) {
				// will trigger again once config comes in
				return;
			}

			// get and remove the top thing of the queue
			q = impl.beaconQueue.shift();

			// when this beacon fired
			data["rt.tstart"] = q.when;
			data["rt.end"] = q.when;

			// initiator
			data["http.initiator"] = "api_custom_" + q.type;

			if (q.type === "metric") {
				for (valName in q.values) {
					if (q.values.hasOwnProperty(valName)) {
						found = false;

						for (i = 0; i < impl.customMetrics.length; i++) {
							if (valName === impl.customMetrics[i].name) {
								found = anyFound = true;

								data[impl.customMetrics[i].label] = q.values[valName];

								break;
							}
						}

						if (!found) {
							BOOMR.warn("Custom Metric " + valName + " not found");
						}
					}
				}
			}
			else if (q.type === "timer") {
				for (valName in q.values) {
					if (q.values.hasOwnProperty(valName)) {
						found = false;

						for (i = 0; i < impl.customTimers.length; i++) {
							if (valName === impl.customTimers[i].name) {
								found = anyFound = true;

								if (data.t_other) {
									data.t_other += ",";
								}
								else {
									data.t_other = "";
								}

								data.t_other += impl.customTimers[i].label + "|" + q.values[valName];

								break;
							}
						}

						if (!found) {
							BOOMR.warn("Custom Timer " + valName + " not found");
						}
					}
				}
			}

			if (!anyFound) {
				BOOMR.warn("No data found to send, aborting Custom beacon");
				return;
			}

			// add all variables
			for (var varName in q.vars) {
				if (q.vars.hasOwnProperty(varName)) {
					data[varName] = q.vars[varName];
				}
			}

			// send the beacon
			impl.sendBeacon(data);

			// and run again soon until it's empty in case there's another beacon
			BOOMR.setImmediate(impl.processBeaconQueue);
		},

		/**
		 * Sends a beacon
		 *
		 * @param {object} params Parameters array
		 */
		sendBeacon: function(params) {
			//
			// Add additional parameters
			//

			// tokens
			params.d = BOOMR.session.domain;
			params["h.key"] = BOOMR.getVar("h.key");
			params["h.d"] = BOOMR.getVar("h.d");
			params["h.cr"] = BOOMR.getVar("h.cr");
			params["h.t"] = BOOMR.getVar("h.t");

			// page id
			params.pid = BOOMR.pageId;

			// start event
			params["rt.start"] = "manual";

			// session data
			if (BOOMR.session && BOOMR.session.ID !== false) {
				params["rt.si"] = BOOMR.session.ID;
				params["rt.ss"] = BOOMR.session.start;
				params["rt.sl"] = BOOMR.session.length;
			}

			// API info
			params.api = 1;
			params["api.v"] = 2;
			params["api.l"] = "boomr";

			// let others add data to the beacon
			BOOMR.fireEvent("before_custom_beacon", params);

			// send the beacon data to the specified URL
			BOOMR.sendBeaconData(params);
		}
	};

	// patch BOOMR with sendMetric and sendTimer
	BOOMR.sendMetric = impl.sendMetric;
	BOOMR.sendMetrics = impl.sendMetrics;
	BOOMR.sendTimer = impl.sendTimer;
	BOOMR.sendTimers = impl.sendTimers;

	BOOMR.plugins.PageParams = {
		init: function(config) {
			var properties = [
				"pageGroups",
				"abTests",
				"customTimers",
				"customMetrics",
				"customDimensions",
				"autorun",
				"defaultDecimal",
				"defaultThousands",
				"xhr"
			];
			var pgIndex = 0, pgList = [];

			w = BOOMR.window;
			l = w.location;	// if client uses history.pushState, parent location might be different from boomerang frame location
			d = w.document;
			p = BOOMR.getPerformance();

			BOOMR.utils.pluginConfig(impl, config, "PageParams", properties);
			impl.complete = false;

			if (impl.pageGroups && impl.pageGroups.length > 0) {
				for (pgIndex = 0; pgIndex < impl.pageGroups.length; pgIndex++) {
					if ((impl.pageGroups[pgIndex].on && impl.pageGroups[pgIndex].on.indexOf("xhr") > -1) || impl.pageGroups[pgIndex].ignore) {

						impl.xhrPageGroups.push(impl.pageGroups[pgIndex]);
						impl.hasXhrOn = true;

						if (impl.pageGroups[pgIndex].ignore) {
							impl.hasXhrIgnore = true;
						}

						// Ensure PGs definitions only matching XHRs are removed from PG List
						if ((impl.pageGroups[pgIndex].on && impl.pageGroups[pgIndex].on.length === 1) || impl.pageGroups[pgIndex].ignore) {
							delete impl.pageGroups[pgIndex];
						}
					}
				}
			}

			// Remove undefined array indices from pageGroups array
			for (pgIndex = 0; pgIndex < impl.pageGroups.length; pgIndex++) {
				if (impl.pageGroups[pgIndex]) {
					pgList.push(impl.pageGroups[pgIndex]);
				}
			}
			impl.pageGroups = pgList;

			if (typeof config.autorun !== "undefined") {
				impl.autorun = config.autorun;
			}

			if (impl.initialized) {
				// second init is from config.js
				impl.configReceived = true;

				impl.checkPrioritizedPageParams("init");

				// process Custom Dimensions for any Custom Metrics/Timers that
				// were queued before config.js was loaded
				for (var i = 0; i < impl.beaconQueue.length; i++) {
					if (impl.beaconQueue[i].needsDimensions) {
						/*eslint-disable no-loop-func*/
						impl.runAllDimensions(function(name, val) {
							impl.beaconQueue[i].vars[name] = val;
						});
						/*eslint-enable no-loop-func*/

						delete impl.beaconQueue[i].needsDimensions;
					}
				}

				// if we had previously run before config.js came in, re-run now
				if (impl.rerunAfterConfig) {
					BOOMR.debug("Re-running now that config came in");
					impl.done(impl.rerunAfterConfig.edata, impl.rerunAfterConfig.ename);

					impl.rerunAfterConfig = false;
					return;
				}
			}

			// process any Custom Timer or Custom Metric beacons after all other plugins
			// react to config
			BOOMR.setImmediate(impl.processBeaconQueue);

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
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, "load", impl);
				BOOMR.subscribe("spa_init", impl.checkPrioritizedPageParams);
				BOOMR.subscribe("xhr_init", impl.checkPrioritizedPageParams);
			}
			else if (impl.autorun) {
				// If the page has already loaded by the time we get here,
				// then we just run immediately
				impl.done("load");
			}

			if (!impl.initialized) {
				// We do not want to subscribe to unload or onbeacon more than once
				// because this will just create too many references
				BOOMR.subscribe("before_unload", impl.onunload, null, impl);
				BOOMR.subscribe("before_unload", impl.done, "unload", impl);
				BOOMR.subscribe("onbeacon", impl.clearMetrics, null, impl);
				BOOMR.subscribe("onbeacon", impl.removeDoneHandlers);
				BOOMR.subscribe("xhr_load", impl.done, "xhr", impl);
				BOOMR.subscribe("before_beacon", impl.onBeforeBeacon, null, impl);
				if (BOOMR.plugins.AutoXHR) {
					BOOMR.plugins.AutoXHR.addExcludeFilter(impl.excludeXhrFilter, impl, "BOOMR.plugins.PageParams.PageGroups");
				}
				impl.initialized = true;
			}

			return this;
		},

		is_complete: function() {
			// We'll run retry() here because it must run before RT's before_beacon handler
			if (impl.mayRetry.length > 0) {
				impl.retry();
			}

			// only allow beacons if we got config.js or if we're unloading
			return impl.configReceived || impl.unloadFired;
		},

		readyToSend: function() {
			return impl.configReceived || impl.unloadFired;
		}

		/* BEGIN_DEBUG */,
		Handler: Handler
		/* END_DEBUG */
	};

}());
