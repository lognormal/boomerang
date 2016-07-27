/**
\file restiming.js
Plugin to collect metrics from the W3C Resource Timing API.
For more information about Resource Timing,
see: http://www.w3.org/TR/resource-timing/
*/

(function() {

	var impl;

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.ResourceTiming) {
		return;
	}

	//
	// Constants
	//
	var INITIATOR_TYPES = {
		"other": 0,
		"img": 1,
		"link": 2,
		"script": 3,
		"css": 4,
		"xmlhttprequest": 5,
		"html": 6
	};

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
	 * @param [object] entries Performance entries
	 * @return A trie
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
	 * @param [object] cur Current Trie branch
	 * @param [boolean] top Whether or not this is the root node
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
	 * @param [number] time Time
	 * @param [number] startTime Start time
	 * @return [number] Number of ms from start time
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
	 * Attempts to get the navigationStart time for a frame.
	 * @returns navigationStart time, or 0 if not accessible
	 */
	function getNavStartTime(frame) {
		var navStart = 0, frameLoc;

		try {
			// Try to access location.href first to trigger any Cross-Origin
			// warnings.  There's also a bug in Chrome ~48 that might cause
			// the browser to crash if accessing X-O frame.performance.
			// https://code.google.com/p/chromium/issues/detail?id=585871
			// This variable is not otherwise used.
			frameLoc = frame.location && frame.location.href;

			if (("performance" in frame) &&
			frame.performance &&
			frame.performance.timing &&
			frame.performance.timing.navigationStart) {
				navStart = frame.performance.timing.navigationStart;
			}
		}
		catch (e) {
			// empty
		}

		return navStart;
	}

	/**
	 * Gets all of the performance entries for a frame and its subframes
	 *
	 * @param [Frame] frame Frame
	 * @param [boolean] top This is the top window
	 * @param [string] offset Offset in timing from root IFRAME
	 * @param [number] depth Recursion depth
	 * @return [PerformanceEntry[]] Performance entries
	 */
	function findPerformanceEntriesForFrame(frame, isTopWindow, offset, depth) {
		var entries = [], i, navEntries, navStart, frameNavStart, frameOffset,
		    navEntry, t, frameLoc, rtEntry;

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
			navStart = getNavStartTime(frame);

			// get sub-frames' entries first
			if (frame.frames) {
				for (i = 0; i < frame.frames.length; i++) {
					frameNavStart = getNavStartTime(frame.frames[i]);
					frameOffset = 0;
					if (frameNavStart > navStart) {
						frameOffset = offset + (frameNavStart - navStart);
					}

					entries = entries.concat(findPerformanceEntriesForFrame(frame.frames[i], false, frameOffset, depth + 1));
				}
			}

			try {
				// Try to access location.href first to trigger any Cross-Origin
				// warnings.  There's also a bug in Chrome ~48 that might cause
				// the browser to crash if accessing X-O frame.performance.
				// https://code.google.com/p/chromium/issues/detail?id=585871
				// This variable is not otherwise used.
				frameLoc = frame.location && frame.location.href;

				if (!("performance" in frame) ||
				   !frame.performance ||
				   typeof frame.performance.getEntriesByType !== "function") {
					return entries;
				}
			}
			catch (e) {
				// NOP
				return entries;
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
						responseEnd: navEntry.responseEnd
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

			for (i = 0; frameEntries && i < frameEntries.length; i++) {
				t = frameEntries[i];
				rtEntry = {
					name: t.name,
					initiatorType: t.initiatorType,
					startTime: t.startTime + offset,
					redirectStart: t.redirectStart ? (t.redirectStart + offset) : 0,
					redirectEnd: t.redirectEnd ? (t.redirectEnd + offset) : 0,
					fetchStart: t.fetchStart ? (t.fetchStart + offset) : 0,
					domainLookupStart: t.domainLookupStart ? (t.domainLookupStart + offset) : 0,
					domainLookupEnd: t.domainLookupEnd ? (t.domainLookupEnd + offset) : 0,
					connectStart: t.connectStart ? (t.connectStart + offset) : 0,
					secureConnectionStart: t.secureConnectionStart ? (t.secureConnectionStart + offset) : 0,
					connectEnd: t.connectEnd ? (t.connectEnd + offset) : 0,
					requestStart: t.requestStart ? (t.requestStart + offset) : 0,
					responseStart: t.responseStart ? (t.responseStart + offset) : 0,
					responseEnd: t.responseEnd ? (t.responseEnd + offset) : 0
				};
				if (t.encodedBodySize || t.decodedBodySize || t.transferSize) {
					rtEntry.encodedBodySize = t.encodedBodySize;
					rtEntry.decodedBodySize = t.decodedBodySize;
					rtEntry.transferSize = t.transferSize;
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
	 * Converts a number to base-36.
	 *
	 * If not a number or a string, or === 0, return "". This is to facilitate
	 * compression in the timing array, where "blanks" or 0s show as a series
	 * of trailing ",,,," that can be trimmed.
	 *
	 * If a string, return a string.
	 *
	 * @param [number] n Number
	 * @return Base-36 number, empty string, or string
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
	 * @param [Window] win Window to search
	 * @return [Object] Object with URLs of visible assets as keys, and Array[height, width, top, left] as value
	 */
	function getVisibleEntries(win) {
		var els = ["IMG", "IFRAME"], entries = {}, x, y, doc = win.document;

		// https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
		x = (win.pageXOffset !== undefined) ? win.pageXOffset : (doc.documentElement || doc.body.parentNode || doc.body).scrollLeft;
		y = (win.pageYOffset !== undefined) ? win.pageYOffset : (doc.documentElement || doc.body.parentNode || doc.body).scrollTop;

		// look at each IMG and IFRAME
		els.forEach(function(elname) {
			var elements = doc.getElementsByTagName(elname), el, i, rect;

			for (i = 0; i < elements.length; i++) {
				el = elements[i];

				// look at this element if it has a src attribute, and we haven't already looked at it
				if (el && el.src && !entries[el.src]) {
					rect = el.getBoundingClientRect();

					// Require both height & width to be non-zero
					// IE <= 8 does not report rect.height/rect.width so we need offsetHeight & width
					if ((rect.height || el.offsetHeight) && (rect.width || el.offsetWidth)) {
						entries[el.src] = [el.offsetHeight, el.offsetWidth, Math.round(rect.top + y), Math.round(rect.left + x)];
					}
				}
			}
		});

		return entries;
	}

	/**
	 * Gathers a filtered list of performance entries.
	 * @param [number] from Only get timings from
	 * @param [number] to Only get timings up to
	 * @param [string[]] initiatorTypes Array of initiator types
	 * @return [ResourceTiming[]] Matching ResourceTiming entries
	 */
	function getFilteredResourceTiming(from, to, initiatorTypes) {
		var entries = findPerformanceEntriesForFrame(BOOMR.window, true, 0, 0),
		    i, e, results = {}, initiatorType, url, data,
		    navStart = getNavStartTime(BOOMR.window);

		if (!entries || !entries.length) {
			return [];
		}

		var filteredEntries = [];
		for (i = 0; i < entries.length; i++) {
			e = entries[i];

			// skip non-resource URLs
			if (e.name.indexOf("about:") === 0 ||
			    e.name.indexOf("javascript:") === 0) {
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

			filteredEntries.push(e);
		}

		return filteredEntries;
	}

	/**
	 * Gets compressed content and transfer size information, if available
	 *
	 * @param [ResourceTiming] resource ResourceTiming bject
	 *
	 * @returns [string] Compressed data (or empty string, if not available)
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
			// encodedBodySize: the size after applying encoding (e.g. gzipped size).  It is 0 if X-O.
			//
			// decodedBodySize: the size after removing encoding (e.g. the original content size).  It is 0 if X-O.
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
	 * @param [string] compressed Compressed string
	 * @param [ResourceTiming] resource ResourceTiming bject
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
	/* END_DEBUG */

	/**
	 * Trims the URL according to the specified URL trim patterns,
	 * then applies a length limit.
	 *
	 * @param {string} url URL to trim
	 * @param {string} urlsToTrim List of URLs (strings or regexs) to trim
	 * @return {string} Trimmed URL
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
	 * Gathers performance entries and compresses the result.
	 * @param [number] from Only get timings from
	 * @param [number] to Only get timings up to
	 * @return Optimized performance entries trie
	 */
	function getCompressedResourceTiming(from, to) {
		/*eslint no-script-url:0*/
		var entries = getFilteredResourceTiming(from, to),
		    i, e, results = {}, initiatorType, url, data,
		    visibleEntries = {};

		if (!entries || !entries.length) {
			return {};
		}

		// gather visible entries on the page
		visibleEntries = getVisibleEntries(BOOMR.window);

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
			].map(toBase36).join(",").replace(/,+$/, "");

			// add content and transfer size info
			var compSize = compressSize(e);
			if (compSize !== "") {
				data += SPECIAL_DATA_PREFIX + SPECIAL_DATA_SIZE_TYPE + compSize;
			}

			url = trimUrl(e.name, impl.trimUrls);

			// if this entry already exists, add a pipe as a separator
			if (results[url] !== undefined) {
				results[url] += "|" + data;
			}
			else {
				// for the first time we see this URL, add resource dimensions if we have them
				if (visibleEntries[url] !== undefined) {
					// We use * as an additional separator to indicate it is not a new resource entry
					// The following characters will not be URL encoded:
					// *!-.()~_ but - and . are special to number representation so we don't use them
					// After the *, the type of special data (ResourceTiming = 0) is added
					results[url] =
						SPECIAL_DATA_PREFIX +
						SPECIAL_DATA_DIMENSION_TYPE +
						visibleEntries[url].map(toBase36).join(",").replace(/,+$/, "")
						+ "|"
						+ data;
				}
				else {
					results[url] = data;
				}
			}
		}

		return optimizeTrie(convertToTrie(results), true);
	}

	/**
	 * Compresses an array of ResourceTiming-like objects (those with a fetchStart
	 * and a responseStart/responseEnd) by reducing multiple objects with the same
	 * fetchStart down to a single object with the longest duration.
	 *
	 * Array must be pre-sorted by fetchStart, then by responseStart||responseEnd
	 *
	 * @param [ResourceTiming[]] resources ResourceTiming-like resources, with just
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
	 * @param [ResourceTiming[]] resources Resources
	 *
	 * @returns Duration, in milliseconds
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

	impl = {
		complete: false,
		sentNavBeacon: false,
		initialized: false,
		supported: false,
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
		clearOnBeacon: false,
		trimUrls: [],
		done: function() {
			var r;

			// Stop if we've already sent a nav beacon (both xhr and spa* beacons
			// add restiming manually).
			if (this.sentNavBeacon) {
				return;
			}

			// Can't send if we don't support JSON
			if (typeof JSON === "undefined") {
				return;
			}

			BOOMR.removeVar("restiming");
			r = getCompressedResourceTiming();
			if (r) {
				BOOMR.info("Client supports Resource Timing API", "restiming");
				BOOMR.addVar({
					restiming: JSON.stringify(r)
				});
			}

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
		init: function(config) {
			var p = BOOMR.getPerformance();

			BOOMR.utils.pluginConfig(impl, config, "ResourceTiming",
				["xssBreakWords", "clearOnBeacon", "urlLimit", "trimUrls"]);

			if (impl.initialized) {
				return this;
			}

			if (p && typeof p.getEntriesByType === "function") {
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
				BOOMR.subscribe("xhr_load", impl.xhr_load, null, impl);
				BOOMR.subscribe("onbeacon", impl.onBeacon, null, impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);
				impl.supported = true;
			}
			else {
				impl.complete = true;
			}

			impl.initialized = true;

			return this;
		},
		is_complete: function() {
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		},
		//
		// Public Exports
		//
		getCompressedResourceTiming: getCompressedResourceTiming,
		getFilteredResourceTiming: getFilteredResourceTiming,
		calculateResourceTimingUnion: calculateResourceTimingUnion

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
		trimUrl: trimUrl
		/* END_DEBUG */
	};

}());
