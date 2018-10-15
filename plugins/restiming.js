/**
 * Plugin to collect metrics from the W3C [ResourceTiming]{@link http://www.w3.org/TR/resource-timing/}
 * API.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon for Page Loads:
 *
 * * `restiming`: Compressed ResourceTiming data
 *
 * The ResourceTiming plugin adds an object named `restiming` to the beacon data.
 *
 *  `restiming` is an optimized [Trie]{@link http://en.wikipedia.org/wiki/Trie} structure,
 * where the keys are the ResourceTiming URLs, and the values correspond to those URLs'
 * [PerformanceResourceTiming]{@link http://www.w3.org/TR/resource-timing/#performanceresourcetiming}
 * timestamps:
 *
 *     { "[url]": "[data]"}
 *
 * The Trie structure is used to minimize the data transmitted from the ResourceTimings.
 *
 * Keys in the Trie are the ResourceTiming URLs. For example, with a root page and three resources:
 *
 * * http://abc.com/
 * * http://abc.com/js/foo.js
 * * http://abc.com/css/foo.css
 * * http://abc.com/css/foo.png (downloaded twice)
 *
 * Then the Trie might look like this:
 *
 *     // Example 1
 *     {
 *       "http://abc.com/":
 *       {
 *         "|": "0,2",
 *         "js/foo.js": "3a,1",
 *         "css/": {
 *           "foo.css": "2b,2",
 *           "foo.png": "1c,3|1d,a"
 *         }
 *       }
 *     }
 *
 * If a resource's URL is a prefix of another resource, then it terminates with a
 * pipe symbol (`|`). In Example 1, `http://abc.com` (the root page) is a
 * prefix of `http://abc.com/js/foo.js`, so it is listed as `http://abc.com|` in
 * the Trie.
 *
 * If there is more than one ResourceTiming entry for a URL, each entry is
 * separated by a pipe symbol (`|`) in the `data`. In Example 1 above, `foo.png`
 * has been downloaded twice, so it is listed with two separate page loads, `1c,3` and `1d,a`.
 *
 * The value of each key is a string, which contains the following components:
 *
 *     data = "[initiatorType][timings]"
 *
 * `initiatorType` is a simple map from the PerformanceResourceTiming
 * `initiatorType` (which is a string) to an integer, according to the
 * {@link BOOMR.plugins.ResourceTiming.INITAITOR_TYPES} enum.
 *
 * `timings` is a string of [Base-36]{@link http://en.wikipedia.org/wiki/Base_36}
 * encoded timestamps from the PerformanceResourceTiming interface. The values in
 * the string are separated by commas:
 *
 *     timings = "[startTime],[responseEnd],[responseStart],[requestStart],[connectEnd],[secureConnectionStart],[connectStart],[domainLookupEnd],[domainLookupStart],[redirectEnd],[redirectStart]"
 *
 * `startTime` is a [DOMHighResTimeStamp]{@link http://www.w3.org/TR/hr-time/#domhighrestimestamp}
 * from when the resource started (Base 36).
 *
 * All other timestamps are offsets (rounded to milliseconds) from `startTime`
 * (Base 36). For example, `responseEnd` is calculated as:
 *
 *     responseEnd: base36(round(responseEnd - startTime))
 *
 * If the resulting timestamp is `0`, it is replaced with an empty string (`""`).
 *
 * All trailing commas are removed from the final string. This compresses the timing
 * string from timestamps that are often `0`. For example, here is what a fully-redirected
 * resource might look like:
 *
 *     { "http://abc.com/this-resource-was-redirected": "01,1,1,1,1,1,1,1,1,1,1" }
 *
 * While a resource that was loaded from the cache (and thus only has `startTime`
 * and `responseEnd` timestamps) might look like this:
 *
 *     { "http://abc.com/this-resource-was-redirected": "01,1" }
 *
 * Note that some of the metrics are restricted and will not be provided cross-origin
 * unless the Timing-Allow-Origin header permits.
 *
 * Putting this all together, let's look at `http://abc.com/css/foo.png` in Example 1.
 * We find it was downloaded twice `"1c,3|1d,a"`:
 *
 * * 1c,3:
 *     * `1`: `initiatorType` = `1` (IMG)
 *     * `c`: `startTime` = `c` (12ms)
 *     * `3`: `responseEnd` = `3` (3ms from startTime, or at 15ms)
 * * 1d,a:
 *     * `1`: `initiatorType` = `1` (IMG)
 *     * `d`: `startTime` = `d` (13ms)
 *     * `2`: `responseEnd` = `a` (10ms from startTime, or at 23ms)
 *
 * @see {@link http://www.w3.org/TR/resource-timing/}
 * @class BOOMR.plugins.ResourceTiming
 */
(function() {
	var impl;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.ResourceTiming) {
		return;
	}

	//
	// Constants
	//

	/**
	 * @enum {number}
	 * @memberof BOOMR.plugins.ResourceTiming
	 */
	var INITIATOR_TYPES = {
		/** Unknown type */
		"other": 0,
		/** IMG element (or IMAGE element inside a SVG for IE, Edge and Firefox) */
		"img": 1,
		/** LINK element (i.e. CSS) */
		"link": 2,
		/** SCRIPT element */
		"script": 3,
		/** Resource referenced in CSS */
		"css": 4,
		/** XMLHttpRequest */
		"xmlhttprequest": 5,
		/** The root HTML page itself */
		"html": 6,
		/** IMAGE element inside a SVG */
		"image": 7,
		/** [sendBeacon]{@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon} */
		"beacon": 8,
		/** [Fetch API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} */
		"fetch": 9,
		/** An IFRAME */
		"iframe": "a",
		/** IE11 and Edge (some versions) send "subdocument" instead of "iframe" */
		"subdocument": "a"
	};

	/**
	 * These are the only `rel` types that might be reference-able from
	 * ResourceTiming.
	 *
	 * https://html.spec.whatwg.org/multipage/links.html#linkTypes
	 *
	 * @enum {number}
	 * @memberof BOOMR.plugins.ResourceTiming
	 */
	var REL_TYPES = {
		"prefetch": 1,
		"preload": 2,
		"prerender": 3,
		"stylesheet": 4
	};

	var RT_FIELDS_TIMESTAMPS = [
		"startTime",
		"redirectStart",
		"redirectEnd",
		"fetchStart",
		"domainLookupStart",
		"domainLookupEnd",
		"connectStart",
		"secureConnectionStart",
		"connectEnd",
		"requestStart",
		"responseStart",
		"responseEnd",
		"workerStart"
	];

	// Words that will be broken (by ensuring the optimized trie doesn't contain
	// the whole string) in URLs, to ensure NoScript doesn't think this is an XSS attack
	var DEFAULT_XSS_BREAK_WORDS = [
		/(h)(ref)/gi,
		/(s)(rc)/gi,
		/(a)(ction)/gi
	];

	// Delimiter to use to break a XSS word
	var XSS_BREAK_DELIM = "\n";

	// Maximum number of characters in a URL
	var DEFAULT_URL_LIMIT = 500;

	// Any ResourceTiming data time that starts with this character is not a time,
	// but something else (like dimension data)
	var SPECIAL_DATA_PREFIX = "*";

	// Dimension data special type
	var SPECIAL_DATA_DIMENSION_TYPE = "0";

	// Dimension data special type
	var SPECIAL_DATA_SIZE_TYPE = "1";

	// Script attributes
	var SPECIAL_DATA_SCRIPT_ATTR_TYPE = "2";
	// The following make up a bitmask
	var ASYNC_ATTR = 0x1;
	var DEFER_ATTR = 0x2;
	var LOCAT_ATTR = 0x4;	// 0 => HEAD, 1 => BODY

	// Dimension data special type
	var SPECIAL_DATA_SERVERTIMING_TYPE = "3";

	// Link attributes
	var SPECIAL_DATA_LINK_ATTR_TYPE = "4";

	// Namespaced data
	var SPECIAL_DATA_NAMESPACED_TYPE = "5";

	/**
	 * Converts entries to a Trie:
	 * http://en.wikipedia.org/wiki/Trie
	 *
	 * Assumptions:
	 * 1) All entries have unique keys
	 * 2) Keys cannot have "|" in their name.
	 * 3) All key's values are strings
	 *
	 * Leaf nodes in the tree are the key's values.
	 *
	 * If key A is a prefix to key B, key A will be suffixed with "|"
	 *
	 * @param {object} entries Performance entries
	 * @returns {object} A trie
	 */
	function convertToTrie(entries) {
		var trie = {}, url, urlFixed, i, value, letters, letter, cur, node;

		for (url in entries) {
			urlFixed = url;

			// find any strings to break
			for (i = 0; i < impl.xssBreakWords.length; i++) {
				// Add a XSS_BREAK_DELIM character after the first letter.  optimizeTrie will
				// ensure this sequence doesn't get combined.
				urlFixed = urlFixed.replace(impl.xssBreakWords[i], "$1" + XSS_BREAK_DELIM + "$2");
			}

			if (!entries.hasOwnProperty(url)) {
				continue;
			}

			value = entries[url];
			letters = urlFixed.split("");
			cur = trie;

			for (i = 0; i < letters.length; i++) {
				letter = letters[i];
				node = cur[letter];

				if (typeof node === "undefined") {
					// nothing exists yet, create either a leaf if this is the end of the word,
					// or a branch if there are letters to go
					cur = cur[letter] = (i === (letters.length - 1) ? value : {});
				}
				else if (typeof node === "string") {
					// this is a leaf, but we need to go further, so convert it into a branch
					cur = cur[letter] = { "|": node };
				}
				else {
					if (i === (letters.length - 1)) {
						// this is the end of our key, and we've hit an existing node.  Add our timings.
						cur[letter]["|"] = value;
					}
					else {
						// continue onwards
						cur = cur[letter];
					}
				}
			}
		}

		return trie;
	}

	/**
	 * Optimize the Trie by combining branches with no leaf
	 *
	 * @param {object} cur Current Trie branch
	 * @param {boolean} top Whether or not this is the root node
	 *
	 * @returns {object} Optimized Trie
	 */
	function optimizeTrie(cur, top) {
		var num = 0, node, ret, topNode;

		// capture trie keys first as we'll be modifying it
		var keys = [];

		for (node in cur) {
			if (cur.hasOwnProperty(node)) {
				keys.push(node);
			}
		}

		for (var i = 0; i < keys.length; i++) {
			node = keys[i];
			if (typeof cur[node] === "object") {
				// optimize children
				ret = optimizeTrie(cur[node], false);
				if (ret) {
					// swap the current leaf with compressed one
					delete cur[node];

					if (node === XSS_BREAK_DELIM) {
						// If this node is a newline, which can't be in a regular URL,
						// it's due to the XSS patch.  Remove the placeholder character,
						// and make sure this node isn't compressed by incrementing
						// num to be greater than one.
						node = ret.name;
						num++;
					}
					else {
						node = node + ret.name;
					}
					cur[node] = ret.value;
				}
			}
			num++;
		}

		if (num === 1) {
			// compress single leafs
			if (top) {
				// top node gets special treatment so we're not left with a {node:,value:} at top
				topNode = {};
				topNode[node] = cur[node];
				return topNode;
			}
			else {
				// other nodes we return name and value separately
				return { name: node, value: cur[node] };
			}
		}
		else if (top) {
			// top node with more than 1 child, return it as-is
			return cur;
		}
		else {
			// more than two nodes and not the top, we can't compress any more
			return false;
		}
	}

	/**
	 * Trims the timing, returning an offset from the startTime in ms
	 *
	 * @param {number} time Time
	 * @param {number} startTime Start time
	 * @returns {number} Number of ms from start time
	 */
	function trimTiming(time, startTime) {
		if (typeof time !== "number") {
			time = 0;
		}

		if (typeof startTime !== "number") {
			startTime = 0;
		}

		// strip from microseconds to milliseconds only
		var timeMs = Math.round(time ? time : 0),
		    startTimeMs = Math.round(startTime ? startTime : 0);

		return timeMs === 0 ? 0 : (timeMs - startTimeMs);
	}

	/**
	 * Checks if the current execution context can access the specified frame.
	 *
	 * Note: In Safari, this will still produce a console error message, even
	 * though the exception is caught.

	 * @param {Window} frame The frame to check if access can haz
	 * @returns {boolean} true if true, false otherwise
	 */
	function isFrameAccessible(frame) {
		var dummy;

		try {
			// Try to access location.href first to trigger any Cross-Origin
			// warnings.  There's also a bug in Chrome ~48 that might cause
			// the browser to crash if accessing X-O frame.performance.
			// https://code.google.com/p/chromium/issues/detail?id=585871
			// This variable is not otherwise used.
			dummy = frame.location && frame.location.href;

			// Try to access frame.document to trigger X-O exceptions with that
			dummy = frame.document;

			if (("performance" in frame) && frame.performance) {
				return true;
			}
		}
		catch (e) {
			// empty
		}

		return false;
	}

	/**
	 * Attempts to get the navigationStart time for a frame.
	 * @returns navigationStart time, or 0 if not accessible
	 */
	function getNavStartTime(frame) {
		var navStart = 0;

		if (isFrameAccessible(frame) && frame.performance.timing && frame.performance.timing.navigationStart) {
			navStart = frame.performance.timing.navigationStart;
		}

		return navStart;
	}

	/**
	 * Gets all of the performance entries for a frame and its subframes
	 *
	 * @param {Frame} frame Frame
	 * @param {boolean} top This is the top window
	 * @param {string} offset Offset in timing from root IFRAME
	 * @param {number} depth Recursion depth
	 * @param {number[]} [frameDims] position and size of the frame if it is visible as returned by getVisibleEntries
	 * @returns {PerformanceEntry[]} Performance entries
	 */
	function findPerformanceEntriesForFrame(frame, isTopWindow, offset, depth, frameDims) {
		var entries = [], i, navEntries, navStart, frameNavStart, frameOffset, subFrames, subFrameDims,
		    navEntry, t, rtEntry, visibleEntries, scripts = {}, links = {}, a;

		if (typeof isTopWindow === "undefined") {
			isTopWindow = true;
		}

		if (typeof offset === "undefined") {
			offset = 0;
		}

		if (typeof depth === "undefined") {
			depth = 0;
		}

		if (depth > 10) {
			return entries;
		}

		try {
			if (!isFrameAccessible(frame)) {
				return entries;
			}

			navStart = getNavStartTime(frame);

			// gather visible entries on the page
			visibleEntries = getVisibleEntries(frame, frameDims);

			a = frame.document.createElement("a");

			// get all scripts as an object keyed on script.src
			collectResources(a, scripts, "script");
			collectResources(a, links, "link");

			subFrames = frame.document.getElementsByTagName("iframe");

			// get sub-frames' entries first
			if (subFrames && subFrames.length) {
				for (i = 0; i < subFrames.length; i++) {
					frameNavStart = getNavStartTime(subFrames[i].contentWindow);
					frameOffset = 0;
					if (frameNavStart > navStart) {
						frameOffset = offset + (frameNavStart - navStart);
					}

					a.href = subFrames[i].src;	// Get canonical URL

					entries = entries.concat(findPerformanceEntriesForFrame(subFrames[i].contentWindow, false, frameOffset, depth + 1, visibleEntries[a.href]));
				}
			}

			if (typeof frame.performance.getEntriesByType !== "function") {
				return entries;
			}

			function readServerTiming(entry) {
				return (impl.serverTiming && entry.serverTiming) || [];
			}

			// add an entry for the top page
			if (isTopWindow) {
				navEntries = frame.performance.getEntriesByType("navigation");
				if (navEntries && navEntries.length === 1) {
					navEntry = navEntries[0];

					// replace document with the actual URL
					entries.push({
						name: frame.location.href,
						startTime: 0,
						initiatorType: "html",
						redirectStart: navEntry.redirectStart,
						redirectEnd: navEntry.redirectEnd,
						fetchStart: navEntry.fetchStart,
						domainLookupStart: navEntry.domainLookupStart,
						domainLookupEnd: navEntry.domainLookupEnd,
						connectStart: navEntry.connectStart,
						secureConnectionStart: navEntry.secureConnectionStart,
						connectEnd: navEntry.connectEnd,
						requestStart: navEntry.requestStart,
						responseStart: navEntry.responseStart,
						responseEnd: navEntry.responseEnd,
						workerStart: navEntry.workerStart,
						encodedBodySize: navEntry.encodedBodySize,
						decodedBodySize: navEntry.decodedBodySize,
						transferSize: navEntry.transferSize,
						serverTiming: readServerTiming(navEntry)
					});
				}
				else if (frame.performance.timing) {
					// add a fake entry from the timing object
					t = frame.performance.timing;

					//
					// Avoid browser bugs:
					// 1. navigationStart being 0 in some cases
					// 2. responseEnd being ~2x what navigationStart is
					//    (ensure the end is within 60 minutes of start)
					//
					if (t.navigationStart !== 0 &&
						t.responseEnd <= (t.navigationStart + (60 * 60 * 1000))) {
						entries.push({
							name: frame.location.href,
							startTime: 0,
							initiatorType: "html",
							redirectStart: t.redirectStart ? (t.redirectStart - t.navigationStart) : 0,
							redirectEnd: t.redirectEnd ? (t.redirectEnd - t.navigationStart) : 0,
							fetchStart: t.fetchStart ? (t.fetchStart - t.navigationStart) : 0,
							domainLookupStart: t.domainLookupStart ? (t.domainLookupStart - t.navigationStart) : 0,
							domainLookupEnd: t.domainLookupEnd ? (t.domainLookupEnd - t.navigationStart) : 0,
							connectStart: t.connectStart ? (t.connectStart - t.navigationStart) : 0,
							secureConnectionStart: t.secureConnectionStart ? (t.secureConnectionStart - t.navigationStart) : 0,
							connectEnd: t.connectEnd ? (t.connectEnd - t.navigationStart) : 0,
							requestStart: t.requestStart ? (t.requestStart - t.navigationStart) : 0,
							responseStart: t.responseStart ? (t.responseStart - t.navigationStart) : 0,
							responseEnd: t.responseEnd ? (t.responseEnd - t.navigationStart) : 0
						});
					}
				}
			}

			// offset all of the entries by the specified offset for this frame
			var frameEntries = frame.performance.getEntriesByType("resource"),
			    frameFixedEntries = [];
			if (frame === BOOMR.window && impl.collectedEntries) {
				Array.prototype.push.apply(frameEntries, impl.collectedEntries);
				impl.collectedEntries = [];
			}

			for (i = 0; frameEntries && i < frameEntries.length; i++) {
				t = frameEntries[i];
				rtEntry = {
					name: t.name,
					initiatorType: t.initiatorType,
					encodedBodySize: t.encodedBodySize,
					decodedBodySize: t.decodedBodySize,
					transferSize: t.transferSize,
					serverTiming: readServerTiming(t),
					visibleDimensions: visibleEntries[t.name],
					latestTime: getResourceLatestTime(t)
				};
				for (var field = 0; field < RT_FIELDS_TIMESTAMPS.length; field++) {
					var key = RT_FIELDS_TIMESTAMPS[field];
					rtEntry[key] = ((key === "startTime") || t[key]) ? (t[key] + offset) : 0;
				}

				if (t.hasOwnProperty("_data")) {
					rtEntry._data = t._data;
				}

				// If this is a script, set its flags
				if ((t.initiatorType === "script" || t.initiatorType === "link") && scripts[t.name]) {
					var s = scripts[t.name];

					// Add async & defer based on attribute values
					rtEntry.scriptAttrs = (s.async ? ASYNC_ATTR : 0) | (s.defer ? DEFER_ATTR : 0);

					while (s.nodeType === 1 && s.nodeName !== "BODY") {
						s = s.parentNode;
					}

					// Add location by traversing up the tree until we either hit BODY or document
					rtEntry.scriptAttrs |= (s.nodeName === "BODY" ? LOCAT_ATTR : 0);
				}

				// If this is a link, set its flags
				if (t.initiatorType === "link" && links[t.name]) {
					// split on ASCII whitespace
					BOOMR.utils.arrayFind(links[t.name].rel.split(/[\u0009\u000A\u000C\u000D\u0020]+/), function(rel) { //eslint-disable-line no-loop-func
						// `rel`s are case insensitive
						rel = rel.toLowerCase();

						// only report the `rel` if it's from the known list
						if (REL_TYPES[rel]) {
							rtEntry.linkAttrs = REL_TYPES[rel];
							return true;
						}
					});
				}

				frameFixedEntries.push(rtEntry);
			}

			entries = entries.concat(frameFixedEntries);
		}
		catch (e) {
			return entries;
		}

		return entries;
	}

	/**
	 * Collect external resources by tagName
	 *
	 * @param {Element} a an anchor element
	 * @param {Object} obj object of resources where the key is the url
	 * @param {string} tagName tag name to collect
	 */
	function collectResources(a, obj, tagName) {
		Array.prototype
			.forEach
			.call(a.ownerDocument.getElementsByTagName(tagName), function(r) {
				// Get canonical URL
				a.href = r.currentSrc ||
					r.src ||
					(typeof r.getAttribute === "function" && r.getAttribute("xlink:href")) ||
					r.href;

				// only get external resource
				if (a.href.match(/^https?:\/\//)) {
					obj[a.href] = r;
				}
			});
	}

	/**
	 * Converts a number to base-36.
	 *
	 * If not a number or a string, or === 0, return "". This is to facilitate
	 * compression in the timing array, where "blanks" or 0s show as a series
	 * of trailing ",,,," that can be trimmed.
	 *
	 * If a string, return a string.
	 *
	 * @param {number} n Number
	 * @returns {string} Base-36 number, empty string, or string
	 */
	function toBase36(n) {
		return (typeof n === "number" && n !== 0) ?
			n.toString(36) :
			(typeof n === "string" ? n : "");
	}

	/**
	 * Finds all remote resources in the selected window that are visible, and returns an object
	 * keyed by the url with an array of height,width,top,left as the value
	 *
	 * @param {Window} win Window to search
	 * @param {number[]} [winDims] position and size of the window if it is an embedded iframe in the format returned by this function
	 * @returns {Object} Object with URLs of visible assets as keys, and Array[height, width, top, left, naturalHeight, naturalWidth] as value
	 */
	function getVisibleEntries(win, winDims) {
		// lower-case tag names should be used: https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
		var els = ["img", "iframe", "image"], entries = {}, x, y, doc = win.document, a = doc.createElement("A");

		winDims = winDims || [0, 0, 0, 0];

		// https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
		x = winDims[3] + (win.pageXOffset !== undefined) ? win.pageXOffset : (doc.documentElement || doc.body.parentNode || doc.body).scrollLeft;
		y = winDims[2] + (win.pageYOffset !== undefined) ? win.pageYOffset : (doc.documentElement || doc.body.parentNode || doc.body).scrollTop;

		// look at each IMG and IFRAME
		els.forEach(function(elname) {
			var elements = doc.getElementsByTagName(elname), el, i, rect, src;

			for (i = 0; i < elements.length; i++) {
				el = elements[i];

				if (!el) {
					continue;
				}

				// look at this element if it has a src attribute or xlink:href, and we haven't already looked at it
				// currentSrc = IMG inside a PICTURE element or IMG srcset
				// src = IMG, IFRAME
				// xlink:href = svg:IMAGE
				src = el.currentSrc ||
					el.src ||
					(typeof el.getAttribute === "function" &&
						(el.getAttribute("src")) || el.getAttribute("xlink:href"));

				// make src absolute
				a.href = src;
				src = a.href;

				if (!src || entries[src]) {
					continue;
				}

				rect = el.getBoundingClientRect();

				// Require both height & width to be non-zero
				// IE <= 8 does not report rect.height/rect.width so we need offsetHeight & width
				if ((rect.height || el.offsetHeight) && (rect.width || el.offsetWidth)) {
					entries[src] = [
						rect.height || el.offsetHeight,
						rect.width || el.offsetWidth,
						Math.round(rect.top + y),
						Math.round(rect.left + x)
					];

					// If this is an image, it has a naturalHeight & naturalWidth
					// if these are different from its display height and width, we should report that
					// because it indicates scaling in HTML
					if (!el.naturalHeight && !el.naturalWidth) {
						continue;
					}

					// If the image came from a srcset, then the naturalHeight/Width will be density corrected.
					// We get the actual physical dimensions by assigning the image to an uncorrected Image object.
					// This should load from in-memory cache, so there should be no extra load.
					var realImg, nH, nW;

					if (el.currentSrc && (el.srcset || (el.parentNode && el.parentNode.nodeName && el.parentNode.nodeName.toUpperCase() === "PICTURE"))) {
						// We need to create this Image in the window that contains the element, and not
						// the boomerang window.
						realImg = el.isConnected ? el.ownerDocument.createElement("IMG") : new BOOMR.window.Image();
						realImg.src = src;
					}
					else {
						realImg = el;
					}

					nH = realImg.naturalHeight || el.naturalHeight;
					nW = realImg.naturalWidth  || el.naturalWidth;

					if ((nH || nW) && (entries[src][0] !== nH || entries[src][1] !== nW)) {
						entries[src].push(nH, nW);
					}
				}
			}
		});

		return entries;
	}

	/**
	 * Gathers a filtered list of performance entries.
	 *
	 * @param {number} from Only get timings from
	 * @param {number} to Only get timings up to
	 * @param {string[]} initiatorTypes Array of initiator types
	 *
	 * @returns {ResourceTiming[]} Matching ResourceTiming entries
	 * @memberof BOOMR.plugins.ResourceTiming
	 */
	function getFilteredResourceTiming(from, to, initiatorTypes) {
		var entries = findPerformanceEntriesForFrame(BOOMR.window, true, 0, 0),
		    i, e,
		    navStart = getNavStartTime(BOOMR.window), countCollector = {};

		if (!entries || !entries.length) {
			return {
				entries: []
			};
		}

		// sort entries by start time
		entries.sort(function(a, b) {
			return a.startTime - b.startTime;
		});

		var filteredEntries = [];
		for (i = 0; i < entries.length; i++) {
			e = entries[i];

			// skip non-resource URLs
			if (e.name.indexOf("about:") === 0 ||
			    e.name.indexOf("javascript:") === 0 ||
			    e.name.indexOf("res:") === 0) {
				continue;
			}

			// skip boomerang.js and config URLs
			if (e.name.indexOf(BOOMR.url) > -1 ||
			    e.name.indexOf(BOOMR.config_url) > -1 ||
			    (typeof BOOMR.getBeaconURL === "function" && BOOMR.getBeaconURL() && e.name.indexOf(BOOMR.getBeaconURL()) > -1)) {
				continue;
			}

			// if the user specified a "from" time, skip resources that started before then
			if (from && (navStart + e.startTime) < from) {
				continue;
			}

			// if we were given a final timestamp, don't add any resources that started after it
			if (to && (navStart + e.startTime) > to) {
				// We can also break at this point since the array is time sorted
				break;
			}

			// if given an array of initiatorTypes to include, skip anything else
			if (typeof initiatorTypes !== "undefined" && initiatorTypes !== "*" && initiatorTypes.length) {
				if (!e.initiatorType || !BOOMR.utils.inArray(e.initiatorType, initiatorTypes)) {
					continue;
				}
			}

			accumulateServerTimingEntries(countCollector, e.serverTiming);
			filteredEntries.push(e);
		}

		var lookup = compressServerTiming(countCollector);
		return {
			entries: filteredEntries,
			serverTiming: {
				lookup: lookup,
				indexed: indexServerTiming(lookup)
			}
		};
	}

	/**
	 * Gets compressed content and transfer size information, if available
	 *
	 * @param {ResourceTiming} resource ResourceTiming object
	 *
	 * @returns {string} Compressed data (or empty string, if not available)
	 */
	function compressSize(resource) {
		var sTrans, sEnc, sDec, sizes;

		// check to see if we can add content sizes
		if (resource.encodedBodySize ||
			resource.decodedBodySize ||
			resource.transferSize) {
			//
			// transferSize: how many bytes were over the wire. It can be 0 in the case of X-O,
			// or if it was fetched from a cache.
			//
			// encodedBodySize: the size after applying encoding (e.g. gzipped size).  It is 0 if X-O or no content (eg: beacon).
			//
			// decodedBodySize: the size after removing encoding (e.g. the original content size).  It is 0 if X-O or no content (eg: beacon).
			//
			// Here are the possible combinations of values: [encodedBodySize, transferSize, decodedBodySize]
			//
			// Cross-Origin resources w/out Timing-Allow-Origin set: [0, 0, 0] -> [0, 0, 0] -> [empty]
			// 204: [0, t, 0] -> [0, t, 0] -> [e, t-e] -> [, t]
			// 304: [e, t: t <=> e, d: d>=e] -> [e, t-e, d-e]
			// 200 non-gzipped: [e, t: t>=e, d: d=e] -> [e, t-e]
			// 200 gzipped: [e, t: t>=e, d: d>=e] -> [e, t-e, d-e]
			// retrieved from cache non-gzipped: [e, 0, d: d=e] -> [e]
			// retrieved from cache gzipped: [e, 0, d: d>=e] -> [e, _, d-e]
			//
			sTrans = resource.transferSize;
			sEnc = resource.encodedBodySize;
			sDec = resource.decodedBodySize;

			// convert to an array
			sizes = [sEnc, sTrans ? sTrans - sEnc : "_", sDec ? sDec - sEnc : 0];

			// change everything to base36 and remove any trailing ,s
			return sizes.map(toBase36).join(",").replace(/,+$/, "");
		}
		else {
			return "";
		}
	}

	/* BEGIN_DEBUG */
	/**
	 * Decompresses size information back into the specified resource
	 *
	 * @param {string} compressed Compressed string
	 * @param {ResourceTiming} resource ResourceTiming object
	 */
	function decompressSize(compressed, resource) {
		var split, i;

		if (typeof resource === "undefined") {
			resource = {};
		}

		split = compressed.split(",");

		for (i = 0; i < split.length; i++) {
			if (split[i] === "_") {
				// special non-delta value
				split[i] = 0;
			}
			else {
				// fill in missing numbers
				if (split[i] === "") {
					split[i] = 0;
				}

				// convert back from Base36
				split[i] = parseInt(split[i], 36);

				if (i > 0) {
					// delta against first number
					split[i] += split[0];
				}
			}
		}

		// fill in missing
		if (split.length === 1) {
			// transferSize is a delta from encodedSize
			split.push(split[0]);
		}

		if (split.length === 2) {
			// decodedSize is a delta from encodedSize
			split.push(split[0]);
		}

		// re-add attributes to the resource
		resource.encodedBodySize = split[0];
		resource.transferSize = split[1];
		resource.decodedBodySize = split[2];

		return resource;
	}

	/**
	 * Decompress compressed timepoints into a timepoint object with painted and finalized pixel counts
	 * @param {string} comp The compressed timePoint object returned by getOptimizedTimepoints
	 * @returns {object} An object in the form { <timePoint>: [ <pixel count>, <finalized pixel count>], ... }
	 */
	function decompressTimePoints(comp) {
		var result = {}, timePoints, i, split, prevs = [0, 0, 0];

		timePoints = comp.split("!");

		for (i = 0; i < timePoints.length; i++) {
			split = timePoints[i]
				.replace(/^~/, "Infinity~")
				.replace("-", "~0~")
				.split("~")
				.map(function(v, j) {
					v = (v === "Infinity" ? Infinity : parseInt(v, 36));

					if (j === 2) {
						v = prevs[1] - v;
					}
					else {
						v = v + prevs[j];
					}

					prevs[j] = v;

					return v;
				});

			result[split[0]] = [ split[1], split[2] || split[1] ];
		}

		return result;
	}
	/* END_DEBUG */

	/**
	 * Trims the URL according to the specified URL trim patterns,
	 * then applies a length limit.
	 *
	 * @param {string} url URL to trim
	 * @param {string} urlsToTrim List of URLs (strings or regexs) to trim
	 * @returns {string} Trimmed URL
	 */
	function trimUrl(url, urlsToTrim) {
		var i, urlIdx, trim;

		if (url && urlsToTrim) {
			// trim the payload from any of the specified URLs
			for (i = 0; i < urlsToTrim.length; i++) {
				trim = urlsToTrim[i];

				if (typeof trim === "string") {
					urlIdx = url.indexOf(trim);
					if (urlIdx !== -1) {
						url = url.substr(0, urlIdx + trim.length) + "...";
						break;
					}
				}
				else if (trim instanceof RegExp) {
					if (trim.test(url)) {
						// replace the URL with the first capture group
						url = url.replace(trim, "$1") + "...";
					}
				}
			}
		}

		// apply limits
		return BOOMR.utils.cleanupURL(url, impl.urlLimit);
	}

	/**
	 * Get the latest timepoint for this resource from ResourceTiming. If the resource hasn't started downloading yet, return Infinity
	 * @param {PerformanceResourceEntry} res The resource entry to get the latest time for
	 * @returns {number} latest timepoint for the resource or now if the resource is still in progress
	 */
	function getResourceLatestTime(res) {
		// If responseEnd is non zero, return it
		if (res.responseEnd) {
			return res.responseEnd;
		}

		// If responseStart is non zero, assume it accounts for 80% of the load time, and bump it by 20%
		if (res.responseStart && res.startTime) {
			return res.responseStart + (res.responseStart - res.startTime) * 0.2;
		}

		// If the resource hasn't even started loading, assume it will come at some point in the distant future (after the beacon)
		// we'll let the server determine what to do
		return Infinity;
	}

	/**
	 * Given a 2D array representing the screen and a list of rectangular dimension tuples, turn on the screen pixels that match the dimensions.
	 * Previously set pixels that are also set with the current call will be overwritten with the new value of pixelValue
	 * @param {number[][]} currentPixels A 2D sparse array of numbers representing set pixels or undefined if no pixels are currently set.
	 * @param {number[][]} dimList A list of rectangular dimension tuples in the form [height, width, top, left] for resources to be painted on the virtual screen
	 * @param {number} pixelValue The numeric value to set all new pixels to
	 * @returns {number[][]} An updated version of currentPixels.
	 */
	function mergePixels(currentPixels, dimList, pixelValue) {
		var s = BOOMR.window.screen,
		    h = s.height, w = s.width;

		return dimList.reduce(
			function(acc, val) {
				var x_min, x_max,
				    y_min, y_max,
				    x, y;

				x_min = Math.max(0, val[3]);
				y_min = Math.max(0, val[2]);
				x_max = Math.min(val[3] + val[1], w);
				y_max = Math.min(val[2] + val[0], h);

				// Object is off-screen
				if (x_min >= x_max || y_min >= y_max) {
					return acc;
				}

				// We fill all pixels of this resource with a true
				// this is needed to correctly account for overlapping resources
				for (y = y_min; y < y_max; y++) {
					if (!acc[y]) {
						acc[y] = [];
					}

					for (x = x_min; x < x_max; x++) {
						acc[y][x] = pixelValue;
					}
				}

				return acc;
			},
			currentPixels || []
		);
	}

	/**
	 * Counts the number of pixels that are set in the given 2D array representing the screen
	 * @param {number[][]} pixels A 2D boolean array representing the screen with painted pixels set to true
	 * @param {number} [rangeMin] If included, will only count pixels >= this value
	 * @param {number} [rangeMax] If included, will only count pixels <= this value
	 * @returns {number} The number of pixels set in the passed in array
	 */
	function countPixels(pixels, rangeMin, rangeMax) {
		rangeMin = rangeMin || 0;
		rangeMax = rangeMax || Infinity;

		return pixels
			.reduce(function(acc, val) {
				return acc +
					val.filter(function(v) {
						return rangeMin <= v && v <= rangeMax;
					}).length;
			},
			0
		);
	}

	/**
	 * Returns a compressed string representation of a hash of timepoints to painted pixel count and finalized pixel count.
	 * - Timepoints are reduced to milliseconds relative to the previous timepoint while pixel count is reduced to pixels relative to the previous timepoint. Finalized pixels are reduced to be relative (negated) to full pixels for that timepoint
	 * - The relative timepoint and relative pixels are then each Base36 encoded and combined with a ~
	 * - Finally, the list of timepoints is merged, separated by ! and returned
	 * @param {object} timePoints An object in the form { "<timePoint>" : [ <object dimensions>, <object dimensions>, ...], <timePoint>: [...], ...}, where <object dimensions> is [height, width, top, left]
	 * @returns {string} The serialized compressed timepoint object with ! separating individual triads and ~ separating timepoint and pixels within the triad. The elements of the triad are the timePoint, number of pixels painted at that point, and the number of pixels finalized at that point (ie, no further paints). If the third part of the triad is 0, it is omitted, if the second part of the triad is 0, it is omitted and the repeated ~~ is replaced with a -
	 */
	function getOptimizedTimepoints(timePoints) {
		var i, roundedTimePoints = {}, timeSequence, tPixels,
		    t_prev, t, p_prev, p, f_prev, f,
		    comp, result = [];

		// Round timepoints to the nearest integral ms
		timeSequence = Object.keys(timePoints);

		for (i = 0; i < timeSequence.length; i++) {
			t = Math.round(Number(timeSequence[i]));
			if (typeof roundedTimePoints[t] === "undefined") {
				roundedTimePoints[t] = [];
			}

			// Merge
			Array.prototype.push.apply(roundedTimePoints[t], timePoints[timeSequence[i]]);
		}

		// Get all unique timepoints nearest ms sorted in ascending order
		timeSequence = Object.keys(roundedTimePoints).map(Number).sort(function(a, b) { return a - b; });

		if (timeSequence.length === 0) {
			return {};
		}

		// First loop identifies pixel first paints
		for (i = 0; i < timeSequence.length; i++) {
			t = timeSequence[i];
			tPixels = mergePixels(tPixels, roundedTimePoints[t], t);

			p = countPixels(tPixels);
			timeSequence[i] = [t, p];
		}

		// We'll make all times and pixel counts relative to the previous ones
		t_prev = 0;
		p_prev = 0;
		f_prev = 0;

		// Second loop identifies pixel final paints
		for (i = 0; i < timeSequence.length; i++) {
			t = timeSequence[i][0];
			p = timeSequence[i][1];
			f = countPixels(tPixels, 0, t);

			if (p > p_prev || f > f_prev) {
				comp = (t === Infinity ? "" : toBase36(Math.round(t - t_prev))) + "~" + toBase36(p - p_prev) + "~" + toBase36(p - f);

				comp = comp.replace(/~~/, "-").replace(/~$/, "");

				result.push(comp);

				t_prev = t;
				p_prev = p;
				f_prev = f;
			}
		}

		return result.join("!").replace(/!+$/, "");
	}

	/**
	 * Gathers performance entries and compresses the result.
	 *
	 * @param {number} from Only get timings from
	 * @param {number} to Only get timings up to
	 *
	 * @returns {object} An object containing the Optimized performance entries trie and
	 * the optimized server timing lookup
	 * @memberof BOOMR.plugins.ResourceTiming
	 */
	function getCompressedResourceTiming(from, to) {
		/*eslint no-script-url:0*/
		var i, e, results = {}, initiatorType, url, data, timePoints = {};
		var ret = getFilteredResourceTiming(from, to, impl.trackedResourceTypes);
		var entries = ret.entries, serverTiming = ret.serverTiming;

		if (!entries || !entries.length) {
			return {
				restiming: {},
				servertiming: []
			};
		}

		for (i = 0; i < entries.length; i++) {
			e = entries[i];

			//
			// Compress the RT data into a string:
			//
			// 1. Start with the initiator type, which is mapped to a number.
			// 2. Put the timestamps into an array in a set order (reverse chronological order),
			//    which pushes timestamps that are more likely to be zero (duration since
			//    startTime) towards the end of the array (eg redirect* and domainLookup*).
			// 3. Convert these timestamps to Base36, with empty or zero times being an empty string
			// 4. Join the array on commas
			// 5. Trim all trailing empty commas (eg ",,,")
			//

			// prefix initiatorType to the string
			initiatorType = INITIATOR_TYPES[e.initiatorType];
			if (typeof initiatorType === "undefined") {
				initiatorType = 0;
			}

			data = initiatorType + [
				trimTiming(e.startTime, 0),
				trimTiming(e.responseEnd, e.startTime),
				trimTiming(e.responseStart, e.startTime),
				trimTiming(e.requestStart, e.startTime),
				trimTiming(e.connectEnd, e.startTime),
				trimTiming(e.secureConnectionStart, e.startTime),
				trimTiming(e.connectStart, e.startTime),
				trimTiming(e.domainLookupEnd, e.startTime),
				trimTiming(e.domainLookupStart, e.startTime),
				trimTiming(e.redirectEnd, e.startTime),
				trimTiming(e.redirectStart, e.startTime)
			].map(toBase36).join(",").replace(/,+$/, ""); // this `replace()` removes any trailing commas

			// add content and transfer size info
			var compSize = compressSize(e);
			if (compSize !== "") {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_SIZE_TYPE + compSize;
			}

			if (e.hasOwnProperty("scriptAttrs")) {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_SCRIPT_ATTR_TYPE + e.scriptAttrs;
			}

			if (e.serverTiming && e.serverTiming.length) {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_SERVERTIMING_TYPE +
					e.serverTiming.reduce(function(stData, entry, entryIndex) {
						// The numeric of the entry is `value` for Chrome 61, `duration` after that
						var duration = String(typeof entry.duration !== "undefined" ? entry.duration : entry.value);
						if (duration.substring(0, 2) === "0.") {
							// lop off the leading 0
							duration = duration.substring(1);
						}
						// The name of the entry is `metric` for Chrome 61, `name` after that
						var name = entry.name || entry.metric;
						var lookupKey = identifyServerTimingEntry(serverTiming.indexed[name].index,
							serverTiming.indexed[name].descriptions[entry.description]);
						stData += (entryIndex > 0 ? "," : "") + duration + lookupKey;
						return stData;
					}, "");
			}

			if (e.hasOwnProperty("linkAttrs")) {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_LINK_ATTR_TYPE + e.linkAttrs;
			}

			url = trimUrl(e.name, impl.trimUrls);

			if (!e.hasOwnProperty("_data")) {
				// if this entry already exists, add a pipe as a separator
				if (results[url] !== undefined) {
					results[url] += "|" + data;
				}
				else if (e.visibleDimensions) {
					// We use * as an additional separator to indicate it is not a new resource entry
					// The following characters will not be URL encoded:
					// *!-.()~_ but - and . are special to number representation so we don't use them
					// After the *, the type of special data (ResourceTiming = 0) is added
					results[url] =
						SPECIAL_DATA_PREFIX +
						SPECIAL_DATA_DIMENSION_TYPE +
						e.visibleDimensions.map(Math.round).map(toBase36).join(",").replace(/,+$/, "") +
						"|" +
						data;
				}
				else {
					results[url] = data;
				}
			}
			else {
				var namespacedData = "";
				for (var key in e._data) {
					if (e._data.hasOwnProperty(key)) {
						namespacedData += SPECIAL_DATA_PREFIX + SPECIAL_DATA_NAMESPACED_TYPE + key + ":" + e._data[key];
					}
				}

				if (typeof results[url] === "undefined") {
					// we haven't seen this resource yet, treat this potential stub as the canonical version
					results[url] = data + namespacedData;
				}
				else {
					// we have seen this resource before
					// forget the timing data of `e`, just supplement the previous entry with the new `namespacedData`
					results[url] += namespacedData;
				}
			}

			if (e.visibleDimensions) {
				if (!timePoints[e.latestTime]) {
					timePoints[e.latestTime] = [];
				}
				timePoints[e.latestTime].push(e.visibleDimensions);
			}
		}

		return {
			restiming: optimizeTrie(convertToTrie(results), true),
			servertiming: serverTiming.lookup
		};
	}

	/**
	 * Compresses an array of ResourceTiming-like objects (those with a fetchStart
	 * and a responseStart/responseEnd) by reducing multiple objects with the same
	 * fetchStart down to a single object with the longest duration.
	 *
	 * Array must be pre-sorted by fetchStart, then by responseStart||responseEnd
	 *
	 * @param {ResourceTiming[]} resources ResourceTiming-like resources, with just
	 *  a fetchStart and responseEnd
	 *
	 * @returns Duration, in milliseconds
	 */
	function reduceFetchStarts(resources) {
		var times = [];

		if (!resources || !resources.length) {
			return times;
		}

		for (var i = 0; i < resources.length; i++) {
			var res = resources[i];

			// if there is a subsequent resource with the same fetchStart, use
			// its value instead (since pre-sort guarantee is that it's end
			// will be >= this one)
			if (i !== resources.length - 1 &&
				res.fetchStart === resources[i + 1].fetchStart) {
				continue;
			}

			// track just the minimum fetchStart and responseEnd
			times.push({
				fetchStart: res.fetchStart,
				responseEnd: res.responseStart || res.responseEnd
			});
		}

		return times;
	}

	/**
	 * Calculates the union of durations of the specified resources.  If
	 * any resources overlap, those timeslices are not double-counted.
	 *
	 * @param {ResourceTiming[]} resources Resources
	 *
	 * @returns Duration, in milliseconds
	 * @memberof BOOMR.plugins.ResourceTiming
	 */
	function calculateResourceTimingUnion(resources) {
		var i;

		if (!resources || !resources.length) {
			return 0;
		}

		// First, sort by start time, then end time
		resources.sort(function(a, b) {
			if (a.fetchStart !== b.fetchStart) {
				return a.fetchStart - b.fetchStart;
			}
			else {
				var ae = a.responseStart || a.responseEnd;
				var be = b.responseStart || b.responseEnd;

				return ae - be;
			}
		});

		// Next, find all resources with the same start time, and reduce
		// them to the largest end time.
		var times = reduceFetchStarts(resources);

		// Third, for every resource, if the start is less than the end of
		// any previous resource, change its start to the end.  If the new start
		// time is more than the end time, we can discard this one.
		var times2 = [];
		var furthestEnd = 0;

		for (i = 0; i < times.length; i++) {
			var res = times[i];

			if (res.fetchStart < furthestEnd) {
				res.fetchStart = furthestEnd;
			}

			// as long as this resource has > 0 duration, add it to our next list
			if (res.fetchStart < res.responseEnd) {
				times2.push(res);

				// keep track of the furthest end point
				furthestEnd = res.responseEnd;
			}
		}

		// Reduce down again to same start times again, and now we should
		// have no overlapping regions
		var times3 = reduceFetchStarts(times2);

		// Finally, calculate the overall time from our non-overlapping regions
		var totalTime = 0;
		for (i = 0; i < times3.length; i++) {
			totalTime += times3[i].responseEnd - times3[i].fetchStart;
		}

		return totalTime;
	}

	/**
	 * Adds 'restiming' and 'servertiming' to the beacon
	 *
	 * @param {number} from Only get timings from
	 * @param {number} to Only get timings up to
	 *
	 * @memberof BOOMR.plugins.ResourceTiming
	 */
	function addResourceTimingToBeacon(from, to) {
		var r;

		// Can't send if we don't support JSON
		if (typeof JSON === "undefined") {
			return;
		}

		BOOMR.removeVar("restiming");
		BOOMR.removeVar("servertiming");
		r = getCompressedResourceTiming(from, to);
		if (r) {
			BOOMR.info("Client supports Resource Timing API", "restiming");
			addToBeacon(r);
		}
	}

	/**
	 * Given an array of server timing entries (from the resource timing entry),
	 * [initialize and] increment our count collector of the following format: {
	 *   "metric-one": {
	 *     count: 3,
	 *     counts: {
	 *       "description-one": 2,
	 *       "description-two": 1,
	 *     }
	 *   }
	 * }
	 *
	 * @param {Object} countCollector Per-beacon collection of counts
	 * @param {Array} serverTimingEntries Server Timing Entries from a Resource Timing Entry
	 * @returns nothing
	 */
	function accumulateServerTimingEntries(countCollector, serverTimingEntries) {
		(serverTimingEntries || []).forEach(function(entry) {
			var name = entry.name || entry.metric;
			if (typeof countCollector[name] === "undefined") {
				countCollector[name] = {
					count: 0,
					counts: {}
				};
			}
			var metric = countCollector[name];
			metric.counts[entry.description] = metric.counts[entry.description] || 0;
			metric.counts[entry.description]++;
			metric.count++;
		});
	}

	/**
	 * Given our count collector of the format: {
	 *   "metric-two": {
	 *     count: 1,
	 *     counts: {
	 *       "description-three": 1,
	 *     }
	 *   },
	 *   "metric-one": {
	 *     count: 3,
	 *     counts: {
	 *       "description-one": 1,
	 *       "description-two": 2,
	 *     }
	 *   }
	 * }
	 *
	 * , return the lookup of the following format: [
	 *   ["metric-one", "description-two", "description-one"],
	 *   ["metric-two", "description-three"],
	 * ]
	 *
	 * Note: The order of these arrays of arrays matters: there are more server timing entries with
	 * name === "metric-one" than "metric-two", and more "metric-one"/"description-two" than
	 * "metric-one"/"description-one".
	 *
	 * @param {Object} countCollector Per-beacon collection of counts
	 * @returns {Array} compressed lookup array
	 */
	function compressServerTiming(countCollector) {
		return Object.keys(countCollector).sort(function(metric1, metric2) {
			return countCollector[metric2].count - countCollector[metric1].count;
		}).reduce(function(array, name) {
			var sorted = Object.keys(countCollector[name].counts).sort(function(description1, description2) {
				return countCollector[name].counts[description2] -
					countCollector[name].counts[description1];
			});

			array.push(sorted.length === 1 && sorted[0] === "" ?
				name : // special case: no non-empty descriptions
				[name].concat(sorted));
			return array;
		}, []);
	}

	/**
	 * Given our lookup of the format: [
	 *   ["metric-one", "description-one", "description-two"],
	 *   ["metric-two", "description-three"],
	 * ]
	 *
	 * , create a O(1) name/description to index values lookup dictionary of the format: {
	 *   metric-one: {
	 *     index: 0,
	 *     descriptions: {
	 *       "description-one": 0,
	 *       "description-two": 1,
	 *     }
	 *   }
	 *   metric-two: {
	 *     index: 1,
	 *     descriptions: {
	 *       "description-three": 0,
	 *     }
	 *   }
	 * }
	 *
	 * @param {Array} lookup compressed lookup array
	 * @returns {Object} indexed version of the compressed lookup array
	 */
	function indexServerTiming(lookup) {
		return lookup.reduce(function(serverTimingIndex, compressedEntry, entryIndex) {
			var name, descriptions;
			if (Array.isArray(compressedEntry)) {
				name = compressedEntry[0];
				descriptions = compressedEntry.slice(1).reduce(function(descriptionCollector, description, descriptionIndex) {
					descriptionCollector[description] = descriptionIndex;
					return descriptionCollector;
				}, {});
			}
			else {
				name = compressedEntry;
				descriptions = {
					"": 0
				};
			}

			serverTimingIndex[name] = {
				index: entryIndex,
				descriptions: descriptions
			};
			return serverTimingIndex;
		}, {});
	}

	/**
	 * Given entryIndex and descriptionIndex, create the shorthand key into the lookup
	 * response format is ":<entryIndex>.<descriptionIndex>"
	 * either/both entryIndex or/and descriptionIndex can be omitted if equal to 0
	 * the "." can be ommited if descriptionIndex is 0
	 * the ":" can be ommited if entryIndex and descriptionIndex are 0
	 *
	 * @param {Integer} entryIndex index of the entry
	 * @param {Integer} descriptionIndex index of the description
	 * @returns {String} key into the compressed lookup
	 */
	function identifyServerTimingEntry(entryIndex, descriptionIndex) {
		var s = "";
		if (entryIndex) {
			s += entryIndex;
		}
		if (descriptionIndex) {
			s += "." + descriptionIndex;
		}
		if (s.length) {
			s = ":" + s;
		}
		return s;
	}

	/**
	 * Adds optimized performance entries trie and (conditionally) the optimized server timing lookup to the beacon
	 *
	 * @param {Object} r An object containing the optimized performance entries trie and the optimized server timing
	 *  lookup
	 */
	function addToBeacon(r) {
		BOOMR.addVar("restiming", JSON.stringify(r.restiming));
		if (r.servertiming.length) {
			BOOMR.addVar("servertiming", BOOMR.utils.serializeForUrl(r.servertiming));
		}
	}

	/**
	 * Given our lookup of the format: [
	 *   ["metric-one", "description-one", "description-two"],
	 *   ["metric-two", "description-three"],
	 * ]
	 *
	 * , and a key of the format: duration:entryIndex.descriptionIndex,
	 * return the decompressed server timing entry (name, duration, description)
	 *
	 * Note: code only included as POC
	 *
	 * @param {Array} lookup compressed lookup array
	 * @param {Integer} key key into the compressed lookup
	 * @returns {Object} decompressed resource timing entry (name, duration, description)
	 */
	/* BEGIN_DEBUG */
	function decompressServerTiming(lookup, key) {
		var split = key.split(":");
		var duration = Number(split[0]);
		var entryIndex = 0, descriptionIndex = 0;

		if (split.length > 1) {
			var identity = split[1].split(".");
			if (identity[0] !== "") {
				entryIndex = Number(identity[0]);
			}
			if (identity.length > 1) {
				descriptionIndex = Number(identity[1]);
			}
		}

		var name, description = "";
		if (Array.isArray(lookup[entryIndex])) {
			name = lookup[entryIndex][0];
			description = lookup[entryIndex][1 + descriptionIndex] || "";
		}
		else {
			name = lookup[entryIndex];
		}

		return {
			name: name,
			duration: duration,
			description: description
		};
	}
	/* END_DEBUG */

	impl = {
		complete: false,
		sentNavBeacon: false,
		initialized: false,
		supported: null,
		xhr_load: function() {
			if (this.complete) {
				return;
			}

			// page load might not have happened, or will happen later, so
			// set us as complete so we don't hold the page load
			this.complete = true;
			BOOMR.sendBeacon();
		},
		xssBreakWords: DEFAULT_XSS_BREAK_WORDS,
		urlLimit: DEFAULT_URL_LIMIT,

		// overridable
		clearOnBeacon: false,
		trimUrls: [],
		serverTiming: true,
		monitorClearResourceTimings: false,
		// overridable

		/**
		 * Array of resource types to track, or "*" for all.
		 *  @type {string[]|string}
		 */
		trackedResourceTypes: "*",
		done: function() {
			// Stop if we've already sent a nav beacon (both xhr and spa* beacons
			// add restiming manually).
			if (this.sentNavBeacon) {
				return;
			}

			addResourceTimingToBeacon();

			this.complete = true;
			this.sentNavBeacon = true;

			BOOMR.sendBeacon();
		},

		onBeacon: function(vars) {
			var p = BOOMR.getPerformance();

			// clear metrics
			if (vars.hasOwnProperty("restiming")) {
				BOOMR.removeVar("restiming");
			}
			if (vars.hasOwnProperty("servertiming")) {
				BOOMR.removeVar("servertiming");
			}

			if (impl.clearOnBeacon && p) {
				var clearResourceTimings = p.clearResourceTimings || p.webkitClearResourceTimings;
				if (clearResourceTimings && typeof clearResourceTimings === "function") {
					clearResourceTimings.call(p);
				}
			}
		},

		prerenderToVisible: function() {
			// ensure we add our data to the beacon even if we had added it
			// during prerender (in case another beacon went out in between)
			this.sentNavBeacon = false;

			// add our data to the beacon
			this.done();
		}
	};

	BOOMR.plugins.ResourceTiming = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {string[]} [config.ResourceTiming.xssBreakWorks] Words that will be broken (by
		 * ensuring the optimized trie doesn't contain the whole string) in URLs,
		 * to ensure NoScript doesn't think this is an XSS attack.
		 *
		 * Defaults to `DEFAULT_XSS_BREAK_WORDS`.
		 * @param {boolean} [config.ResourceTiming.clearOnBeacon] Whether or not to clear ResourceTiming
		 * data on each beacon.
		 * @param {number} [config.ResourceTiming.urlLimit] URL length limit, after which `...` will be used
		 * @param {string[]|RegExp[]} [config.ResourceTiming.trimUrls] List of strings of RegExps
		 * to trim from URLs.
		 * @param {boolean} [config.ResourceTiming.monitorClearResourceTimings] Whether or not to instrument
		 * `performance.clearResourceTimings`
		 *
		 * @returns {@link BOOMR.plugins.ResourceTiming} The ResourceTiming plugin for chaining
		 * @memberof BOOMR.plugins.ResourceTiming
		 */
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "ResourceTiming",
				["xssBreakWords", "clearOnBeacon", "urlLimit", "trimUrls", "trackedResourceTypes", "serverTiming",
					"monitorClearResourceTimings"]);

			if (impl.initialized) {
				return this;
			}

			if (this.is_supported()) {
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
				BOOMR.subscribe("xhr_load", impl.xhr_load, null, impl);
				BOOMR.subscribe("beacon", impl.onBeacon, null, impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);

				if (impl.monitorClearResourceTimings) {
					var self = this;
					BOOMR.window.performance.clearResourceTimings = (function(_){
						return function() {
							self.addResources(BOOMR.window.performance.getEntriesByType("resource"));
							_.apply(BOOMR.window.performance, arguments);
						};
					})(BOOMR.window.performance.clearResourceTimings);
				}
			}
			else {
				impl.complete = true;
			}

			impl.initialized = true;

			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.ResourceTiming
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Whether or not this ResourceTiming is enabled and supported.
		 *
		 * @returns {boolean} `true` if ResourceTiming plugin is enabled.
		 * @memberof BOOMR.plugins.ResourceTiming
		 */
		is_enabled: function() {
			return impl.initialized && this.is_supported();
		},

		/**
		 * Whether or not ResourceTiming is supported in this browser.
		 *
		 * @returns {boolean} `true` if ResourceTiming is supported.
		 * @memberof BOOMR.plugins.ResourceTiming
		 */
		is_supported: function() {
			var p;

			if (impl.supported !== null) {
				return impl.supported;
			}

			// check for getEntriesByType and the entry type existing
			var p = BOOMR.getPerformance();
			impl.supported = p &&
			    typeof p.getEntriesByType === "function" &&
			    typeof window.PerformanceResourceTiming !== "undefined";

			return impl.supported;
		},

		/**
		 * Saves an array of `PerformanceResourceTiming`-shaped objects which we will later insert into the trie.
		 *
		 * @param {array<object>} resources Array of objects that are shaped like `PerformanceResourceTiming`s
		 * @param {high-resolution-timestamp} epoch Optional epoch for all of the timestamps of all of the resources
		 *
		 * @memberof BOOMR.plugins.ResourceTiming
		 */
		addResources: function(resources, epoch) {
			if (!this.is_supported() || !BOOMR.utils.isArray(resources)) {
				return;
			}

			impl.collectedEntries = impl.collectedEntries || [];
			if (typeof epoch === "number") {
				var topEpoch = BOOMR.window.performance.timeOrigin || BOOMR.window.performance.timing.navigationStart;
				var offset = epoch - topEpoch;
				resources = BOOMR.utils.arrayFilter(resources, function(entry) {
					for (var field = 0; field < RT_FIELDS_TIMESTAMPS.length; field++) {
						var key = RT_FIELDS_TIMESTAMPS[field];
						if (entry.hasOwnProperty(key)) {
							entry[key] += offset;
						}
					}
					return true;
				});
			}
			Array.prototype.push.apply(impl.collectedEntries, resources);
		},

		//
		// Public Exports
		//
		getCompressedResourceTiming: getCompressedResourceTiming,
		getFilteredResourceTiming: getFilteredResourceTiming,
		calculateResourceTimingUnion: calculateResourceTimingUnion,
		addResourceTimingToBeacon: addResourceTimingToBeacon,
		addToBeacon: addToBeacon

		//
		// Test Exports (only for debug)
		//
		/* BEGIN_DEBUG */,
		trimTiming: trimTiming,
		convertToTrie: convertToTrie,
		optimizeTrie: optimizeTrie,
		findPerformanceEntriesForFrame: findPerformanceEntriesForFrame,
		toBase36: toBase36,
		getVisibleEntries: getVisibleEntries,
		reduceFetchStarts: reduceFetchStarts,
		compressSize: compressSize,
		decompressSize: decompressSize,
		trimUrl: trimUrl,
		getResourceLatestTime: getResourceLatestTime,
		mergePixels: mergePixels,
		countPixels: countPixels,
		getOptimizedTimepoints: getOptimizedTimepoints,
		decompressTimePoints: decompressTimePoints,
		accumulateServerTimingEntries: accumulateServerTimingEntries,
		compressServerTiming: compressServerTiming,
		indexServerTiming: indexServerTiming,
		identifyServerTimingEntry: identifyServerTimingEntry,
		decompressServerTiming: decompressServerTiming,
		SPECIAL_DATA_PREFIX: SPECIAL_DATA_PREFIX,
		SPECIAL_DATA_DIMENSION_TYPE: SPECIAL_DATA_DIMENSION_TYPE,
		SPECIAL_DATA_SIZE_TYPE: SPECIAL_DATA_SIZE_TYPE,
		SPECIAL_DATA_SCRIPT_ATTR_TYPE: SPECIAL_DATA_SCRIPT_ATTR_TYPE,
		SPECIAL_DATA_LINK_ATTR_TYPE: SPECIAL_DATA_LINK_ATTR_TYPE,
		ASYNC_ATTR: ASYNC_ATTR,
		DEFER_ATTR: DEFER_ATTR,
		LOCAT_ATTR: LOCAT_ATTR,
		INITIATOR_TYPES: INITIATOR_TYPES,
		REL_TYPES: REL_TYPES
		/* END_DEBUG */
	};

}());
