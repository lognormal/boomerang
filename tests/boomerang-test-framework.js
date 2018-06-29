/*eslint-env mocha*/
/*global _*/

//
// BOOMR.plugins.TestFramework
//
(function(window) {

	// set our namespace
	var BOOMR = window.BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.TestFramework) {
		return;
	}

	BOOMR.plugins.TestFramework = {
		initialized: false,
		fired_page_ready: false,
		fired_onbeacon: false,
		fired_before_unload: false,
		beacons: [],
		sendBeacons: [],
		page_ready: function() {
			this.fired_page_ready = true;
		},
		onbeacon: function(data) {
			this.beacons.push(_.clone(data));
			this.fired_onbeacon = true;
		},
		lastBeacon: function() {
			if (this.beacons.length === 0) {
				return false;
			}

			return this.beacons[this.beacons.length - 1];
		},
		beaconCount: function() {
			return this.beacons.length;
		},
		before_unload: function() {
			this.fired_before_unload = true;
		},
		init: function() {
			if (this.initialized) {
				return this;
			}

			BOOMR.subscribe("page_ready", this.page_ready, null, this);
			BOOMR.subscribe("beacon", this.onbeacon, null, this);
			BOOMR.subscribe("before_unload", this.before_unload, null, this);

			this.initialized = true;

			return this;
		},
		is_complete: function() {
			return true;
		}
	};

	(function() {
		var savedSendBeacon;
		if (window.navigator && typeof window.navigator.sendBeacon === "function") {
			savedSendBeacon = window.navigator.sendBeacon;
			window.navigator.sendBeacon = function(url, data) {
				"[native code]";
				// ^ fool ourselves

				var result = savedSendBeacon.apply(window.navigator, arguments);
				if (result) {
					var reader = new FileReader();
					reader.addEventListener("loadend", function() {
						BOOMR.plugins.TestFramework.sendBeacons.push(reader.result);
					});
					reader.readAsText(data);
				}
				return result;
			};
		}
	})();
})(window);

//
// BOOMR_test
//
(function(window) {
	"use strict";

	var t = {};

	var complete = false;
	var initialized = false;
	var testFailures = [];
	var testPasses = [];

	var beaconsSeen = 0;

	var doNotTestErrorsParam = false;
	var doNotTestSpaAbort = false;

	// test framework
	var assert;

	//
	// Constants
	//
	t.BEACON_URL = "/beacon";
	t.MAX_RESOURCE_WAIT = 500;

	//
	// Exports
	//
	t.templates = {};

	t.isComplete = function() {
		return complete;
	};

	t.isInitialized = function() {
		return initialized;
	};

	t.getTestFailures = function() {
		return complete ? testFailures : [];
	};

	t.getTestFailureMessages = function() {
		if (!complete) {
			return "";
		}

		var messages = "";
		for (var i = 0; i < testFailures.length; i++) {
			messages += i > 0 ? "\n" : "";
			messages += testFailures[i].titles + ": " + testFailures[i].name + " | " + testFailures[i].message;
		}

		return messages;
	};

	t.getTestPasses = function() {
		return complete ? testPasses : [];
	};

	t.CONFIG_DEFAULTS = {
		beacon_url: t.BEACON_URL,
		ResourceTiming: {
			enabled: false
		},
		doNotTestErrorsParam: false,
		doNotTestSpaAbort: false
	};

	t.flattenTestTitles = function(test) {
		var titles = [];
		while (test.parent.title) {
			titles.push(test.parent.title);
			test = test.parent;
		}
		return titles.reverse();
	};

	t.runTests = function() {
		var runner = window.mocha.run();

		runner.on("pass", function(test){
			testPasses.push({
				test: test
			});
		})
		.on("fail", function(test, err){
			testFailures.push({
				name: test.title,
				result: false,
				message: err.message,
				// stack: err.stack,
				titles: t.flattenTestTitles(test)
			});
		})
		.on("end", function() {
			complete = true;

			// for saucelabs-mocha
			window.mochaResults = runner.stats;
			window.mochaResults.reports = testFailures;

			// convenient way for selenium to wait
			var competeDiv = document.createElement("div");
			competeDiv.id = "BOOMR_test_complete";
			document.body.appendChild(competeDiv);
		});
	};

	t.init = function(config) {
		if (initialized) {
			return;
		}

		if (!window.BOOMR || !window.BOOMR.version) {
			window.BOOMR_test_config = config;
			return;
		}

		config = _.merge({}, t.CONFIG_DEFAULTS, config);

		if (config.testAfterOnBeacon) {
			// default to waiting until one beacon was sent, otherwise use
			// the number passed in
			if (typeof config.testAfterOnBeacon !== "number") {
				config.testAfterOnBeacon = 1;
			}

			BOOMR.subscribe("beacon", function() {
				if (++beaconsSeen === config.testAfterOnBeacon) {
					// wait a few more ms so the beacon fires
					// TODO: Trim this timing down if we can make it more reliable
					setTimeout(t.runTests, 1000);
				}
			});
		}

		t.doNotTestErrorsParam = config.doNotTestErrorsParam;
		t.doNotTestSpaAbort = config.doNotTestSpaAbort;

		if (config.afterFirstBeacon) {
			var xhrSent = false;
			BOOMR.subscribe(
				"beacon",
				function() {
					if (xhrSent) {
						return;
					}
					xhrSent = true;

					setTimeout(function() {
						config.afterFirstBeacon();
					}, 0);
				});
		}

		t.configureTestEnvironment(config);

		// Initialize if waiting for LOGN plugin or if the plugin doesn't exist
		if (window.BOOMR_LOGN_always !== true || !BOOMR.plugins.LOGN) {
			// fake session details so beacons send
			BOOMR.addVar({
				"h.key": window.BOOMR_API_key ? window.BOOMR_API_key : "aaaaa-bbbbb-ccccc-ddddd-eeeee",
				"h.d": window.location.hostname,
				"h.t": new Date().getTime(),
				"h.cr": "abc"
			});

			BOOMR.init(config);
			BOOMR.fireEvent("config", config);  // this might unblock a waiting beacon
		}

		if (config.onBoomerangLoaded) {
			config.onBoomerangLoaded();
		}

		if (!config.testAfterOnBeacon && config.testAfterOnBeacon !== false) {
			BOOMR.setImmediate(t.runTests);
		}

		initialized = true;
	};

	t.configureTestEnvironment = function(config) {
		// setup Mocha
		var globals = ["BOOMR", "PageGroupVariable", "mochaResults", "BOOMR_configt", "_bmrEvents"];
		if (config && config.ignoreGlobals) {
			Array.prototype.push.apply(globals, config.ignoreGlobals);
		}
		window.mocha.globals(globals);
		window.mocha.checkLeaks();

		// set globals
		assert = window.assert = window.chai.assert;
	};

	t.findResourceTimingBeacon = function() {
		if (!t.isResourceTimingSupported()) {
			return null;
		}

		// if included statically, it'll be on the main window
		var entries = BOOMR.window.performance.getEntriesByType("resource");
		for (var i = 0; i < entries.length; i++) {
			var e = entries[i];
			if (e.name && e.name.indexOf(t.BEACON_URL) !== -1) {
				return e;
			}
		}

		// if included via snippet, it'll be in the IFRAME
		var entries = BOOMR.boomerang_frame.performance.getEntriesByType("resource");
		for (var i = 0; i < entries.length; i++) {
			var e = entries[i];
			if (e.name && e.name.indexOf(t.BEACON_URL) !== -1) {
				return e;
			}
		}

		return null;
	};

	t.isResourceTimingSupported = function() {
		return (window.performance &&
		    typeof window.performance.getEntriesByType === "function" &&
		    typeof window.PerformanceResourceTiming !== "undefined");
	};

	t.isServerTimingSupported = function() {
		return this.isResourceTimingSupported() && typeof PerformanceServerTiming !== "undefined";
	};

	t.isQuerySelectorSupported = function() {
		return typeof window.document.querySelector === "function" ||
		    typeof window.document.querySelector === "object";  // old IE
	};

	t.isNavigationTimingSupported = function() {
		return typeof BOOMR.plugins.RT.navigationStart() !== "undefined";
	};

	t.isNavigationTiming2Supported = function() {
		// check for NavTiming1 first
		if (!t.isNavigationTimingSupported()) {
			return false;
		}

		return window.performance &&
		    typeof window.performance.getEntriesByType === "function" &&
		    window.performance.getEntriesByType("navigation").length > 0;
	};

	t.isNavigationTiming2WithNextHopProtocolSupported = function() {
		// check for NavTiming1 first
		if (!t.isNavigationTimingSupported()) {
			return false;
		}

		return window.performance &&
		    typeof window.performance.getEntriesByType === "function" &&
		    window.performance.getEntriesByType("navigation").length > 0 &&
		    window.performance.getEntriesByType("navigation")[0].nextHopProtocol;
	};

	t.isChromeLoadTimesSupported = function() {
		var pt;
		if (window.chrome && window.chrome.loadTimes) {
			pt = window.chrome.loadTimes();
		}

		if (!pt) {
			// Not supported
			return false;
		}

		return true;
	};

	t.removeNavigationTimingSupport = function() {
		// fake a non-NavigationTiming browser even if it is one
		delete window.performance;

		if (window.chrome) {
			delete window.chrome.csi;
		}
	};

	t.isPaintTimingSupported = function() {
		return window.performance &&
		    typeof window.PerformancePaintTiming !== "undefined" &&
		    typeof window.performance.getEntriesByType === "function";
	};

	t.isLongTasksSupported = function() {
		return window.PerformanceObserver && window.PerformanceLongTaskTiming;
	};

	t.isUserTimingSupported = function() {
		// don't check for PerformanceMark or PerformanceMeasure, they aren't polyfilled in usertiming.js
		return (window.performance &&
		    typeof window.performance.getEntriesByType === "function" &&
		    typeof window.performance.mark === "function" &&
		    typeof window.performance.measure === "function");
	};

	t.isNetworkAPISupported = function() {
		return (navigator && typeof navigator === "object" &&
		    navigator.connection ||
		    navigator.mozConnection ||
		    navigator.webkitConnection ||
		    navigator.msConnection);
	};

	t.isErrorObjInOnErrorSupported = function() {
		var ua = navigator.userAgent.toLowerCase();
		return (ua.indexOf("phantomjs") === -1);  // this should be extended to include older IE and Safari
	};

	t.isLocalStorageSupported = function() {
		var result = false, name = "_boomr_ilss";
		try {
			window.localStorage.setItem(name, name);
			result = (window.localStorage.getItem(name) === name);
			window.localStorage.removeItem(name);
		}
		catch (ignore) {
			result = false;
		}
		return result;
	};

	t.isJSONSupported = function() {
		return (typeof window.JSON === "object" &&
		    typeof window.JSON.stringify === "function" &&
		    typeof window.JSON.parse === "function");
	};

	t.isFetchApiSupported = function() {
		return (typeof window.fetch === "function" &&
		    typeof window.Request === "function" &&
		    typeof window.Response === "function");
	};

	t.validateBeaconWasImg = function(done) {
		if (!t.isResourceTimingSupported()) {
			// need RT to validate
			return done();
		}

		// the presence of h.t on the URL means it was a GET beacon, so not an IMG
		var res = this.findResourceTimingBeacon();
		assert.isTrue(res.name.indexOf("h.t") !== -1);

		done();
	};

	t.isMutationObserverSupported = function() {
		var w = window;
		// Use the same logic as BOOM.utils.isMutationObserverSupported.
		// Boomerang will not use MO in IE 11 due to browser bugs
		var ie11 = (w && w.navigator && w.navigator.userAgent && w.navigator.userAgent.match(/Trident.*rv[ :]*11\./));
		return (!ie11 && w && w.MutationObserver && typeof w.MutationObserver === "function");
	};

	t.validateBeaconWasXhr = function(done) {
		if (!t.isResourceTimingSupported()) {
			// need RT to validate
			return done();
		}

		// the presence of h.t on the URL means it was a GET beacon, so not an XHR
		var res = this.findResourceTimingBeacon();
		assert.isTrue(res.name.indexOf("h.t") === -1);

		done();
	};

	t.validateBeaconWasSent = function(done) {
		var tf = BOOMR.plugins.TestFramework;

		assert.isTrue(tf.fired_onbeacon, "ensure we fired a beacon ('beacon')");

		assert.isObject(tf.lastBeacon(), "ensure the data was sent to 'beacon'");

		assert.equal(tf.lastBeacon().v, BOOMR.version, "ensure the beacon has the boomerang version");

		done();
	};

	t.canSetCookies = function() {
		var testCookieName = "test_cookie";

		// set a cookie
		document.cookie = [testCookieName + "=true", "path=/", "domain=" + location.hostname].join("; ");

		// determine if it was set OK
		return (" " + document.cookie + ";").indexOf(" " + testCookieName + "=") !== -1;
	};

	t.clearCookies = function(domain) {
		var date = new Date();
		date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
		var cookies = document.cookie.split(";");
		for (var i = 0; i < cookies.length; i++) {
			var name = cookies[i].split("=")[0].replace(/^\s+|\s+$/g, "");  // trim spaces
			document.cookie = [name + "=", "expires=" + date.toGMTString(), "path=/", "domain=" + (domain || location.hostname)].join("; ");
		}
	};

	t.setCookie = function(data) {
		var cookieValue = "";

		// add all components
		for (var name in data) {
			if (data.hasOwnProperty(name)) {
				if (cookieValue !== "") {
					cookieValue += "&";
				}

				cookieValue += name + "=" + encodeURIComponent(data[name]);
			}
		}

		// format for setting the cookie
		var nameval = "RT" + "=\"" + cookieValue + "\"";

		// cookie components
		var c = [nameval, "path=/", "domain=" + document.domain];

		// set the cookie
		document.cookie = c.join("; ");
	};

	t.clearLocalStorage = function() {
		// Clear localStorage
		if (typeof window.localStorage === "object" && typeof window.localStorage.clear === "function") {
			window.localStorage.clear();
		}
	};

	t.clearSessionStorage = function() {
		// Clear sessionStorage
		if (typeof window.sessionStorage === "object" && typeof window.sessionStorage.clear === "function") {
			window.sessionStorage.clear();
		}
	};

	t.parseTimers = function(timers) {
		var timerValues = {};

		if (timers) {
			var timersSplit = timers.split(",");
			for (var i = 0; i < timersSplit.length; i++) {
				var timerSplit = timersSplit[i].split("|");
				timerValues[timerSplit[0]] = parseInt(timerSplit[1], 10);
			}
		}

		return timerValues;
	};

	/**
	* Finds the first load of the specified resource.
	* @param {string} url Partial URL match
	* @return {PerformanceResourceTiming} Last resource to load for that URL
	*/
	t.findFirstResource = function(url) {
		if ("performance" in window &&
			window.performance &&
			window.performance.getEntriesByType) {
			var entries = window.performance.getEntriesByType("resource");

			for (var i = 0; i < entries.length; i++) {
				if (entries[i].name.indexOf(url) !== -1) {
					return entries[i];
				}
			}
		}

		return null;
	};

	/**
	 * Finds the first beacon with the specified parameter
	 *
	 * @param {string} prop Property name
	 * @param {string} val Property value
	 *
	 * @returns {object} Matching beacon
	 */
	t.findMatchingBeacon = function(prop, val) {
		var tf = BOOMR.plugins.TestFramework;

		for (var i = 0; i < tf.beacons.length; i++) {
			if (tf.beacons[i][prop] === val) {
				return tf.beacons[i];
			}
		}
	};

	/**
	 * Finds the first XHR beacon
	 *
	 * @returns {object} XHR beacon
	 */
	t.findXhrBeacon = function() {
		return t.findMatchingBeacon("http.initiator", "xhr");
	};

	/**
	 * Finds the first navigation beacon
	 *
	 * @returns {object} navigation beacon
	 */
	t.findNavBeacon = function() {
		return t.isNavigationTimingSupported() ?
		    t.findMatchingBeacon("rt.start", "navigation") :
		    t.findMatchingBeacon("rt.start", "none");
	};

	/**
	* Finds the last load of the specified resource.
	* @param {string} url Partial URL match
	* @return {PerformanceResourceTiming} Last resource to load for that URL
	*/
	t.findLastResource = function(url) {
		if ("performance" in window &&
			window.performance &&
			window.performance.getEntriesByType) {
			var entries = window.performance.getEntriesByType("resource");

			var res = null;
			for (var i = 0; i < entries.length; i++) {
				if (entries[i].name.indexOf(url) !== -1) {
					if (res === null || entries[i].responseEnd > res.responseEnd) {
						res = entries[i];
					}
				}
			}

			return res;
		}
		else {
			return null;
		}
	};

	/**
	* Finds the nth load of the specified resource.
	* @param {string} url Partial URL match
	* @param {number} n Nth resource
	* @return {PerformanceResourceTiming} Last resource to load for that URL
	*/
	t.findNthResource = function(url, n) {
		if ("performance" in window &&
			window.performance &&
			window.performance.getEntriesByType) {
			var entries = window.performance.getEntriesByType("resource");
			var res = null;
			var matches = 0;

			for (var i = 0; i < entries.length; i++) {
				if (entries[i].name.indexOf(url) !== -1) {
					if (res === null || entries[i].responseEnd > res.responseEnd) {
						if (matches === n) {
							res = entries[i];
							break;
						}

						matches++;
					}
				}
			}

			return res;
		}
		else {
			return null;
		}
	};

	/**
	 * Validates the beacon was sent with a load time equal to when the specified resource
	 * loaded.
	 *
	 * @param {number} beaconIndex Which beacon
	 * @param {string} urlMatch URL to match
	 * @param {number} closeTo Range that the load time can be off by
	 * @param {number} fallbackMin If RT is not supported, the minimum time
	 * @param {number} fallbackMax If RT is not supported, the maximum time
	 * @param {boolean|number} useLastMatch Use the last match of the resource instead of the first, or, if a number, that resource
	 * @param {number} n Check the nth resource
	 */
	t.validateBeaconWasSentAfter = function(beaconIndex, urlMatch, closeTo, fallbackMin, fallbackMax, useLastMatch) {
		var tf = BOOMR.plugins.TestFramework;

		var res;
		if (typeof useLastMatch === "number") {
			res = t.findNthResource(urlMatch, useLastMatch);
		}
		else {
			res = useLastMatch ? t.findLastResource(urlMatch) : t.findFirstResource(urlMatch);
		}

		if (res !== null) {
			assert.closeTo(tf.beacons[beaconIndex].t_done, res.responseEnd, closeTo);
		}
		else {
			// we don't have ResourceTiming, use the fallback times
			assert.operator(tf.beacons[beaconIndex].t_done, ">=", fallbackMin);
			assert.operator(tf.beacons[beaconIndex].t_done, "<=", fallbackMax);
		}
	};

	/**
	 * Ensures the number of beacons specified were sent.
	 *
	 * Also waits a second after the beacon count was hit to ensure no additional
	 * beacons were sent.
	 *
	 * @param {function} done Callback
	 * @param {number} beaconCount Expected beacon count
	 */
	t.ensureBeaconCount = function(done, beaconCount) {
		function compareBeaconCount() {
			return BOOMR.plugins.TestFramework.beaconCount() === beaconCount;
		}
		function testBeaconCount() {
			if (compareBeaconCount()) {
				setTimeout(
					function() {
						done(compareBeaconCount() ? undefined : new Error("beaconCount: " + BOOMR.plugins.TestFramework.beaconCount() + " !== " + beaconCount));
					}, 1000);
			}
			else {
				if (BOOMR.plugins.TestFramework.beaconCount() > beaconCount) {
					done(new Error("Too many beacons!  Expected " + beaconCount + " but got " + BOOMR.plugins.TestFramework.beaconCount()));
				}
				else {
					setTimeout(testBeaconCount, 100);
				}
			}
		}

		testBeaconCount();
	};

	/**
	 * Runs the specified callback if AutoXHR is enabled
	 *
	 * @param {function} done Test done callback
	 * @param {function} testXhr Test to run if AutoXHR is enabled
	 * @param {function} testDegenerate Test if AutoXHR is not enabled
	 */
	t.ifAutoXHR = function(done, testXhr, testDegenerate) {
		if (BOOMR.plugins.AutoXHR) {
			return (testXhr || done || function(){})();
		}
		(testDegenerate || done || function(){})();
	};


	/**
	 * Determines how many elements on the page match the attribute
	 *
	 * @param {string} tagName Tag name
	 * @param {string} attr Attribute name
	 * @param {RegExp} regex Regular expression matching the attribute
	 * @returns {number} Number of elements matching
	 */
	t.elementsWithAttribute = function(tagName, attr, regex) {
		var nodes = document.getElementsByTagName("script");

		var matching = 0;

		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (node[attr] && node[attr].match(regex)) {
				matching++;
			}
		}

		return matching;
	};

	/**
	 * Runs a function repeatedly the specified number of times with the
	 * specified delay.
	 *
	 * @param {function} run Function to run
	 * @param {number} times How many times to run it
	 * @param {number} delay How often to delay between runs
	 * @param {function} done What to run when done
	 */
	t.runRepeatedly = function(run, times, delay, done) {
		var runTimes = 0;

		function repeat() {
			if (++runTimes === times) {
				return done();
			}

			run();

			setTimeout(repeat, delay);
		}

		repeat();
	};

	/**
	 * Shows a countdown clock on the page
	 *
	 * @param {Object} test Mocha test case
	 * @param {number} maxTime Maximum timeout
	 * @param {number} expectedTime How many expected seconds
	 *
	 * @returns {string} Timer ID you can use to clearTimeout later
	 */
	t.timeout = function(test, maxTime, expectedTime) {
		test.timeout(maxTime);

		var stats = document.getElementById("mocha-stats");

		var el = document.createElement("li");

		stats.appendChild(el);

		var startTime = +(new Date());
		var endTimeExpected = startTime + expectedTime;
		var endTimeMax = startTime + maxTime;

		var timerID = setInterval(function(){
			var now = +(new Date());
			if (now > endTimeMax) {
				clearInterval(timerID);

				el.parentNode.removeChild(el);

				return;
			}
			else if (now > endTimeExpected) {
				el.style["font-color"] = "red";
			}

			var timeLeft = endTimeMax - now;

			el.innerHTML = "timeout: <em>" + (Math.floor(timeLeft / 100) / 10).toFixed(1) + "</em>s";
		}, 100);

		el.id = "mocha-timer" + timerID;

		return timerID;
	};

	/**
	 * Clears a previously set timer ID
	 *
	 * @param {string} timerID TimerID
	 */
	t.clearTimeout = function(timerID) {
		clearInterval(timerID);

		var el = document.getElementById("mocha-timer" + timerID);
		if (el) {
			el.parentNode.removeChild(el);
		}
	};

	/**
	 * Filters list of strings for number of strings containing a string
	 *
	 * @param {string} string - String to search for
	 * @param {string[]} list - array of strings to test for string
	 *
	 * @returns {string[]} list of strings matching
	 */
	t.checkStringInArray = function(string, list) {
		return list.filter(function(content) {
			return content.indexOf(string) > -1;
		});
	};

	/**
	 * Creates a copy of window.performance that can be modified by the caller.
	 */
	t.getPerformanceCopy = function() {
		if (!("performance" in window)) {
			return;
		}

		var copy = {};

		// copy over all values
		var objs = ["timing", "navigation"];
		for (var i = 0; i < objs.length; i++) {
			var objName = objs[i];
			var subObj = window.performance[objName];

			if (subObj) {
				if (typeof subObj === "function") {
					copy[objName] = window.performance[objName];
					continue;
				}
				copy[objName] = {};
				for (var subObjAttr in subObj) {
					copy[objName][subObjAttr] = subObj[subObjAttr];
				}
			}
		}

		return copy;
	};

	/**
	 * Gets the latest of First Paint or First Contentful Paint
	 *
	 * @returns {number} FP or FCP
	 */
	t.getFirstOrContentfulPaint = function() {
		var fp = 0;
		var p = window.performance;

		// use First Paint (if available)
		if (BOOMR.plugins.PaintTiming &&
			BOOMR.plugins.PaintTiming.is_supported() &&
			p &&
			p.timeOrigin) {
			fp = BOOMR.plugins.PaintTiming.getTimingFor("first-contentful-paint");
			if (!fp) {
				// or get First Paint directly from PaintTiming
				fp = BOOMR.plugins.PaintTiming.getTimingFor("first-paint");
			}

			if (fp) {
				// convert to epoch
				fp = Math.round(fp + p.timeOrigin);
			}
		}
		else if (p && p.timing && p.timing.msFirstPaint) {
			fp = p.timing.msFirstPaint;
		}
		else if (window.chrome &&
			typeof window.chrome.loadTimes === "function") {
			var loadTimes = window.chrome.loadTimes();
			if (loadTimes && loadTimes.firstPaintTime) {
				fp = loadTimes.firstPaintTime * 1000;
			}
		}

		return fp;
	};

	/**
	 * Do busy work for the specified number of ms
	 */
	t.busy = function(ms) {
		var startTime = (new Date()).getTime();
		var now = startTime;
		var endTime = startTime + ms;
		var math = 1;

		while (now < endTime) {
			now = (new Date()).getTime();
			math *= 2;
			math *= 0.5;
		}
	};

	/**
	 * Determines the user agent is Internet Explorer or not
	 *
	 * @returns {boolean} True if the user agent is Internet Explorer
	 */
	t.isIE = function() {
		return window.navigator &&
			(window.navigator.userAgent.indexOf("MSIE") !== -1 ||
			window.navigator.appVersion.indexOf("Trident/") > 0);
	};

	/**
	 * Validates an early beacon against the load beacon
	 */
	t.validateEarlyBeacon = function(early, normal) {
		var i, field, timer, timers, early_timers = {}, normal_timers = {};

		// Don't test h.pg, we'll do some magic in the tests to make sure page params runs twice

		// Not yet tested:
		// "vis.st",
		// "dom.res",
		// "dom.doms",
		// "mem.total",
		// "mem.limit",
		// "mem.used",
		// "scr.xyv",
		// "scr.bpp",
		// "scr.orn",
		// "scr.dpx",
		// "cpu.cnc",
		// "bat.lvl",
		// "dom.ln",
		// "dom.sz",
		// "dom.img",
		// "dom.script",
		// "dom.script.ext",
		// "dom.iframe",
		// "dom.iframe.ext",
		// "dom.link",

		// fields that should be the same on both beacons
		var fieldsEqual = [
			"h.key",
			"rt.start",
			"rt.bmr",
			"rt.tstart",
			"rt.nstart",
			"rt.bstart",
			"rt.blstart",
			"rt.si",
			"rt.ss",
			"rt.sstr_dur",
			"rt.sstr_to",
			"v",
			"pid",
			"ua.plt",
			"ua.vnd",
			"u",
			"nt_red_cnt",
			"nt_nav_type",
			"nt_nav_st",
			"nt_red_st",
			"nt_red_end",
			"nt_fet_st",
			"nt_dns_st",
			"nt_dns_end",
			"nt_con_st",
			"nt_con_end",
			"nt_req_st",
			"nt_res_st",
			"nt_res_end",
			"nt_domloading",
			"nt_domint",
			"nt_domcontloaded_st",
			"nt_domcontloaded_end",
			"nt_unload_st",
			"nt_unload_end",
			"nt_domcomp",
			"nt_load_st",
			"nt_load_end",  // load could have ended in the case of SPA hard
			"nt_first_paint",
			"nt_spdy",
			"nt_cinf",
			"if",
			"vis.pre",
			"t_configls",
			"t_domloaded",
			"t_load",
			"t_prerender",
			"t_postrender"
		];

		// fields that should not be on early beacon
		var fieldsUndefined = [
			// no page load timing available yet
			"t_resp",
			"t_page",
			"t_done",
			"restiming"  // no restiming on early beacons
		];

		// fields that should be the same on both beacons if available
		var fieldsEqualIfExists = [
			"rt.cnf",  // may not be there if config loaded from localStorage
			"t_configfb",
			"t_configjs"
		];

		// fields that must be on the early beacon
		var fieldsMustExist = [
			/* SOASTA PRIVATE START */
			"h.t",
			"h.cr",  // crumb data may be different if config loaded from localStorage
			/* SOASTA PRIVATE END */
			"rt.end",
			"rt.tt",
			"early"
		];

		for (i = 0; i < fieldsEqual.length; i++) {
			field = fieldsEqual[i];
			if (field.indexOf("nt_") === 0 && (!(field in early) || early[field] === 0)) {
				// nav timing fields may be 0 or missing on the early beacon
				continue;
			}
			if (typeof normal[field] === "undefined") {
				assert.isUndefined(early[field], field + " must not be on early beacon if not on the load beacon");
			}
			else {
				assert.equal(normal[field], early[field], field + " " + normal[field] + " === " +  early[field]);
			}
		}

		for (i = 0; i < fieldsUndefined.length; i++) {
			field = fieldsUndefined[i];
			assert.isUndefined(early[field], field + " must not be on early beacon");
		}

		for (i = 0; i < fieldsEqualIfExists.length; i++) {
			field = fieldsEqualIfExists[i];
			if (typeof early[field] !== "undefined") {
				assert.equal(normal[field], early[field], field + " " + normal[field] + " === " +  early[field]);
			}
		}

		for (i = 0; i < fieldsMustExist.length; i++) {
			field = fieldsMustExist[i];
			assert.isDefined(early[field], field + " must exist");
		}

		// rt.sl should be 1 less on the early beacon
		assert.equal(parseInt(normal["rt.sl"], 10), parseInt(early["rt.sl"], 10) + 1,
		    "session length " + normal["rt.sl"] + " === " +  early["rt.sl"] + " + 1");

		// rt.obo should be equal or 1 more on the normal beacon (if navtiming not supported)
		if (early["rt.obo"] !== normal["rt.obo"] && (parseInt(early["rt.obo"], 10) + 1) !== parseInt(normal["rt.obo"], 10)) {
			assert.fail("rt.obo must be equal or 1 more on normal beacon");
		}

		// t_other, if a timer is on the early beacon then it must be on the normal beacon
		if (early.t_other) {
			if (normal.t_other) {
				normal_timers = this.parseTimers(normal.t_other);
				early_timers = this.parseTimers(early.t_other);

				for (timer in early_timers) {
					if (early_timers.hasOwnProperty(timer)) {
						if (timer.indexOf("custom") === 0) {
							//custom timers may get longer (eg. ResourceGroups matching several resources)
							assert.operator(normal_timers[timer], ">=", early_timers[timer],
						    "t_other  " + timer + " " + normal_timers[timer] + " >= " +  early_timers[timer]);
						}
						else {
							assert.equal(normal_timers[timer], early_timers[timer],
							    "t_other  " + timer + " " + normal_timers[timer] + " === " +  early_timers[timer]);
						}
					}
				}
			}
			else {
				assert.fail("t_other on early beacon but missing on the normal beacon");
			}
		}
	};

	/**
	 * Determines the user agent is Edge or not
	 *
	 * @returns {boolean} True if the user agent is Edge
	 */
	t.isEdge = function() {
		return window.navigator &&
			(window.navigator.userAgent.indexOf("Edge") !== -1);
	};

	/**
	 * Determines the user agent is Firefox or not
	 *
	 * @returns {boolean} True if the user agent is Firefox
	 */
	t.isFirefox = function() {
		return window.navigator &&
			(window.navigator.userAgent.indexOf("Firefox") !== -1);
	};

	/**
	 * Determines the user agent is Chrome or not
	 *
	 * @returns {boolean} True if the user agent is Chrome
	 */
	t.isChrome = function() {
		return window.navigator &&
			(window.navigator.userAgent.indexOf("Chrome") !== -1);
	};

	window.BOOMR_test = t;

	// force LOGN plugin not to run. Individual tests will override this if needed.
	// This only works if the test framework is loaded before boomerang
	window.BOOMR_LOGN_always = false;

	/*eslint-disable no-extend-native*/
	// Polyfill via https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5
				// internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs   = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP    = function() {},
			fBound  = function() {
				return fToBind.apply(this instanceof fNOP ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};

			if (this.prototype) {
				// Function.prototype doesn't have a prototype property
				fNOP.prototype = this.prototype;
			}
			fBound.prototype = new fNOP();

			return fBound;
		};
	}
	/*eslint-enable no-extend-native*/

}(window));

/**
 * Adds support for [MD5](https://en.wikipedia.org/wiki/MD5) to Boomerang Test Framework.
 *
 * ## License
 *
 * JavaScript MD5 1.0.1
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
window.BOOMR_test.MD5 = (function() {
	/*jslint bitwise: true */
	/*global unescape*/

	"use strict";
	/*
	* Add integers, wrapping at 2^32. This uses 16-bit operations internally
	* to work around bugs in some JS interpreters.
	*/
	function safe_add(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF),
		    msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	* Bitwise rotate a 32-bit number to the left.
	*/
	function bit_rol(num, cnt) {
		return (num << cnt) | (num >>> (32 - cnt));
	}

	/*
	* These functions implement the four basic operations the algorithm uses.
	*/
	function md5_cmn(q, a, b, x, s, t) {
		return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
	}
	function md5_ff(a, b, c, d, x, s, t) {
		return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t) {
		return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t) {
		return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t) {
		return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	/*
	* Calculate the MD5 of an array of little-endian words, and a bit length.
	*/
	function binl_md5(x, len) {
		/* append padding */
		x[len >> 5] |= 0x80 << (len % 32);
		x[(((len + 64) >>> 9) << 4) + 14] = len;

		var i, olda, oldb, oldc, oldd,
		    a =  1732584193,
		    b = -271733879,
		    c = -1732584194,
		    d =  271733878;

		for (i = 0; i < x.length; i += 16) {
			olda = a;
			oldb = b;
			oldc = c;
			oldd = d;

			a = md5_ff(a, b, c, d, x[i],       7, -680876936);
			d = md5_ff(d, a, b, c, x[i +  1], 12, -389564586);
			c = md5_ff(c, d, a, b, x[i +  2], 17,  606105819);
			b = md5_ff(b, c, d, a, x[i +  3], 22, -1044525330);
			a = md5_ff(a, b, c, d, x[i +  4],  7, -176418897);
			d = md5_ff(d, a, b, c, x[i +  5], 12,  1200080426);
			c = md5_ff(c, d, a, b, x[i +  6], 17, -1473231341);
			b = md5_ff(b, c, d, a, x[i +  7], 22, -45705983);
			a = md5_ff(a, b, c, d, x[i +  8],  7,  1770035416);
			d = md5_ff(d, a, b, c, x[i +  9], 12, -1958414417);
			c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
			b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
			a = md5_ff(a, b, c, d, x[i + 12],  7,  1804603682);
			d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
			c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
			b = md5_ff(b, c, d, a, x[i + 15], 22,  1236535329);

			a = md5_gg(a, b, c, d, x[i +  1],  5, -165796510);
			d = md5_gg(d, a, b, c, x[i +  6],  9, -1069501632);
			c = md5_gg(c, d, a, b, x[i + 11], 14,  643717713);
			b = md5_gg(b, c, d, a, x[i],      20, -373897302);
			a = md5_gg(a, b, c, d, x[i +  5],  5, -701558691);
			d = md5_gg(d, a, b, c, x[i + 10],  9,  38016083);
			c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
			b = md5_gg(b, c, d, a, x[i +  4], 20, -405537848);
			a = md5_gg(a, b, c, d, x[i +  9],  5,  568446438);
			d = md5_gg(d, a, b, c, x[i + 14],  9, -1019803690);
			c = md5_gg(c, d, a, b, x[i +  3], 14, -187363961);
			b = md5_gg(b, c, d, a, x[i +  8], 20,  1163531501);
			a = md5_gg(a, b, c, d, x[i + 13],  5, -1444681467);
			d = md5_gg(d, a, b, c, x[i +  2],  9, -51403784);
			c = md5_gg(c, d, a, b, x[i +  7], 14,  1735328473);
			b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

			a = md5_hh(a, b, c, d, x[i +  5],  4, -378558);
			d = md5_hh(d, a, b, c, x[i +  8], 11, -2022574463);
			c = md5_hh(c, d, a, b, x[i + 11], 16,  1839030562);
			b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
			a = md5_hh(a, b, c, d, x[i +  1],  4, -1530992060);
			d = md5_hh(d, a, b, c, x[i +  4], 11,  1272893353);
			c = md5_hh(c, d, a, b, x[i +  7], 16, -155497632);
			b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
			a = md5_hh(a, b, c, d, x[i + 13],  4,  681279174);
			d = md5_hh(d, a, b, c, x[i],      11, -358537222);
			c = md5_hh(c, d, a, b, x[i +  3], 16, -722521979);
			b = md5_hh(b, c, d, a, x[i +  6], 23,  76029189);
			a = md5_hh(a, b, c, d, x[i +  9],  4, -640364487);
			d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
			c = md5_hh(c, d, a, b, x[i + 15], 16,  530742520);
			b = md5_hh(b, c, d, a, x[i +  2], 23, -995338651);

			a = md5_ii(a, b, c, d, x[i],       6, -198630844);
			d = md5_ii(d, a, b, c, x[i +  7], 10,  1126891415);
			c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
			b = md5_ii(b, c, d, a, x[i +  5], 21, -57434055);
			a = md5_ii(a, b, c, d, x[i + 12],  6,  1700485571);
			d = md5_ii(d, a, b, c, x[i +  3], 10, -1894986606);
			c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
			b = md5_ii(b, c, d, a, x[i +  1], 21, -2054922799);
			a = md5_ii(a, b, c, d, x[i +  8],  6,  1873313359);
			d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
			c = md5_ii(c, d, a, b, x[i +  6], 15, -1560198380);
			b = md5_ii(b, c, d, a, x[i + 13], 21,  1309151649);
			a = md5_ii(a, b, c, d, x[i +  4],  6, -145523070);
			d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
			c = md5_ii(c, d, a, b, x[i +  2], 15,  718787259);
			b = md5_ii(b, c, d, a, x[i +  9], 21, -343485551);

			a = safe_add(a, olda);
			b = safe_add(b, oldb);
			c = safe_add(c, oldc);
			d = safe_add(d, oldd);
		}
		return [a, b, c, d];
	}

	/*
	* Convert an array of little-endian words to a string
	*/
	function binl2rstr(input) {
		var i,
		    output = "";
		for (i = 0; i < input.length * 32; i += 8) {
			output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
		}
		return output;
	}

	/*
	* Convert a raw string to an array of little-endian words
	* Characters >255 have their high-byte silently ignored.
	*/
	function rstr2binl(input) {
		var i,
		    output = [];
		output[(input.length >> 2) - 1] = undefined;
		for (i = 0; i < output.length; i += 1) {
			output[i] = 0;
		}
		for (i = 0; i < input.length * 8; i += 8) {
			output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
		}
		return output;
	}

	/*
	* Calculate the MD5 of a raw string
	*/
	function rstr_md5(s) {
		return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
	}

	/*
	* Calculate the HMAC-MD5, of a key and some data (raw strings)
	*/
	function rstr_hmac_md5(key, data) {
		var i,
		    bkey = rstr2binl(key),
		    ipad = [],
		    opad = [],
		    hash;
		ipad[15] = opad[15] = undefined;
		if (bkey.length > 16) {
			bkey = binl_md5(bkey, key.length * 8);
		}
		for (i = 0; i < 16; i += 1) {
			ipad[i] = bkey[i] ^ 0x36363636;
			opad[i] = bkey[i] ^ 0x5C5C5C5C;
		}
		hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
		return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
	}

	/*
	* Convert a raw string to a hex string
	*/
	function rstr2hex(input) {
		var hex_tab = "0123456789abcdef",
		    output = "",
		    x,
		    i;
		for (i = 0; i < input.length; i += 1) {
			x = input.charCodeAt(i);
			output += hex_tab.charAt((x >>> 4) & 0x0F) +
				hex_tab.charAt(x & 0x0F);
		}
		return output;
	}

	/*
	* Encode a string as utf-8
	*/
	function str2rstr_utf8(input) {
		return unescape(encodeURIComponent(input));
	}

	/*
	* Take string arguments and return either raw or hex encoded strings
	*/
	function raw_md5(s) {
		return rstr_md5(str2rstr_utf8(s));
	}
	function hex_md5(s) {
		return rstr2hex(raw_md5(s));
	}
	function raw_hmac_md5(k, d) {
		return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
	}
	function hex_hmac_md5(k, d) {
		return rstr2hex(raw_hmac_md5(k, d));
	}

	/**
	 * Calculates the MD5 of the specified string and optional key.
	 *
	 * @param {string} string Input string
	 * @param {string} [key] Key
	 * @param {boolean} [raw] Whether or not to return data raw MD5 (versus hex-encoded)
	 *
	 * @returns {string} Raw or hex-encoded MD5 of the input string and key
	 *
	 * @memberof BOOMR.utils.MD5
	 */
	function md5(string, key, raw) {
		if (!key) {
			if (!raw) {
				return hex_md5(string);
			}
			return raw_md5(string);
		}
		if (!raw) {
			return hex_hmac_md5(key, string);
		}
		return raw_hmac_md5(key, string);
	}

	return md5;
}());
