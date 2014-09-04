/**
\file restiming.js
Plugin to collect metrics from the W3C Resource Timing API.
For more information about Resource Timing,
see: http://www.w3.org/TR/resource-timing/
*/

(function() {

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if (BOOMR.plugins.ResourceTiming) {
	return;
}

var initiatorTypes = {
	"other": 0,
	"img": 1,
	"link": 2,
	"script": 3,
	"css": 4,
	"xmlhttprequest": 5
};

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
	var trie = {};

	for(var url in entries) {
		if(!entries.hasOwnProperty(url)) {
			continue;
		}

		var value = entries[url],
			letters = url.split(""),
			cur = trie;

		for(var i = 0; i < letters.length; i++) {
			var letter = letters[i], node = cur[letter];

			if(typeof node === "undefined") {
				// nothing exists yet, create either a leaf if this is the end of the word,
				// or a branch if there are letters to go
				cur = cur[letter] = (i === (letters.length - 1) ? value : {});
			} else if(typeof node === "string") {
				// this is a leaf, but we need to go further, so convert it into a branch
				cur = cur[letter] = { "|": node };
			} else {
				if(i == (letters.length - 1)) {
					// this is the end of our key, and we've hit an existing node.  Add our timings.
					cur[letter]["|"] = value;
				} else {
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
	var num = 0;

	for(var node in cur) {
		if(typeof cur[node] === "object") {
			// optimize children
			var ret = optimizeTrie(cur[node], false);
			if(ret) {
				// swap the current leaf with compressed one
				delete cur[node];
				node = node + ret.name;
				cur[node] = ret.value;
			}
		}
		num++;
	}

	if(num === 1) {
		// compress single leafs
		if(top) {
			// top node gets special treatment so we're not left with a {node:,value:} at top
			var topNode = {};
			topNode[node] = cur[node];
			return topNode;
		} else {
			// other nodes we return name and value separately
			return { name: node, value: cur[node] };
		}
	} else if(top) {
		// top node with more than 1 child, return it as-is
		return cur;
	} else {
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
	// strip from microseconds to milliseconds only
	var timeMs = Math.floor(time ? time : 0);
	var startTimeMs = Math.floor(startTime ? startTime : 0);

	return timeMs === 0 ? 0 : (timeMs - startTimeMs);
}

/**
 * Gets all of the performance entries for a frame and its' subframes
 *
 * @param [Frame] frame Frame
 * @return [PerformanceEntry[]] Performance entries
 */
function findPerformanceEntriesForFrame(frame) {
	var entries = [];

	// TODO: Run this onBeacon instead of onLoad?
	// TODO: Remove page-params ResourceTiming part

	// get sub-frames' entries first
	if(frame.frames) {
		for(var i = 0; i < frame.frames.length; i++) {
			var subFrameEntries = findPerformanceEntriesForFrame(frame.frames[i]);
			if(subFrameEntries.length) {
				// TODO validate this is working
				console.log(subFrameEntries.lenth + "subframe entries");
			}
			entries = entries.concat(findPerformanceEntriesForFrame(frame.frames[i]));
		}
	}

	try {
		if(!("performance" in frame) ||
			!frame.performance ||
			!frame.performance.getEntries) {
			return entries;
		}

		var navEntries = frame.performance.getEntriesByType("navigation");
		if(navEntries && navEntries.length == 1) {
			var navEntry = navEntries[0];

			// replace document with the actual URL
			entries.push({
				name: document.URL,
				startTime: 0,
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
			});
		} else if(frame.performance.timing){
			// add a fake entry from the timing object
			var t = frame.performance.timing;
			entries.push({
				name: document.URL,
				startTime: 0,
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
				responseEnd: t.responseEnd ? (t.responseEnd - t.navigationStart) : 0,
			});
		}

		entries = entries.concat(frame.performance.getEntriesByType("resource"));
	}
	catch(e) {
		return entries;
	}

	return entries;
}

/**
 * Gathers performance entries and optimizes the result.
 * @return Optimized performance entries trie
 */
function getResourceTiming() {
	var entries = findPerformanceEntriesForFrame(window);

	if(!entries || !entries.length) {
		return [];
	}

	var results = {};

	for(var i = 0; i < entries.length; i++) {
		var e = entries[i];

		var startTime = trimTiming(e.startTime, 0);
		var redirectStart = trimTiming(e.redirectStart, e.startTime);
		var redirectEnd = trimTiming(e.redirectEnd, e.startTime);
		var fetchStart = trimTiming(e.fetchStart, e.startTime);
		var domainLookupStart = trimTiming(e.domainLookupStart, e.startTime);
		var domainLookupEnd = trimTiming(e.domainLookupEnd, e.startTime);
		var connectStart = trimTiming(e.connectStart, e.startTime);
		var secureConnectionStart = trimTiming(e.secureConnectionStart, e.startTime);
		var connectEnd = trimTiming(e.connectEnd, e.startTime);
		var requestStart = trimTiming(e.requestStart, e.startTime);
		var responseStart = trimTiming(e.responseStart, e.startTime);
		var responseEnd = trimTiming(e.responseEnd, e.startTime);

		var data;

		if(redirectStart || redirectEnd) {
			// redirects
			data = [
				startTime,
				redirectStart,
				redirectEnd,
				fetchStart,
				domainLookupStart,
				domainLookupEnd,
				connectStart,
				secureConnectionStart,
				connectEnd,
				requestStart,
				responseStart,
				responseEnd
			];
		} else {
			// no redirects
			if(secureConnectionStart ||
				(fetchStart && (domainLookupStart || domainLookupEnd || connectStart || connectEnd))) {
				// secure connection or [fetch start and DNS/TCP]
				data = [
					startTime,
					fetchStart,
					domainLookupStart,
					domainLookupEnd,
					connectStart,
					secureConnectionStart,
					connectEnd,
					requestStart,
					responseStart,
					responseEnd
				];
			} else {
				if(domainLookupStart || domainLookupEnd || connectStart || connectEnd) {
					// DNS or TCP
					data = [
						startTime,
						domainLookupStart,
						domainLookupEnd,
						connectStart,
						connectEnd,
						requestStart,
						responseStart,
						responseEnd
					];
				} else {
					// no DNS or TCP
					if(requestStart) {
						// request start
						data = [
							startTime,
							fetchStart,
							requestStart,
							responseStart,
							responseEnd
						];
					} else {
						// no request start
						if(responseStart) {
							// response start
							data = [
								startTime,
								fetchStart,
								responseStart,
								responseEnd
							];
						} else {
							// no response
							if(fetchStart) {
								// includes fetch
								data = [
									startTime,
									fetchStart,
									responseEnd
								];
							} else {
								// no fetch diff
								if(responseEnd) {
									data = [
										startTime,
										responseEnd
									];
								} else {
									data = [startTime];
								}
							}
						}
					}
				}
			}
		}

		// convert all to base 36
		for(var j = 0; j < data.length; j++) {
			data[j] = data[j].toString(36);
		}

		// join via commas into a string
		data = data.join(",");

		// prefix initiatorType to the string
		var initiatorType = initiatorTypes[e.initiatorType];
		if(typeof initiatorType === "undefined") {
			initiatorType = 0;
		}
		initiatorType = initiatorType.toString(36);

		data = initiatorType + data;

		var url = BOOMR.utils.cleanupURL(e.name.replace(/#.*/, ""));

		// if this entry already exists, add a pipe as a separator
		if(typeof results[url] !== "undefined") {
			results[url] += "|" + data;
		} else {
			results[url] = data;
		}
	}

	return optimizeTrie(convertToTrie(results), true);
}

var impl = {
	complete: false,
	done: function() {
		var p = BOOMR.window.performance, r;
		if(impl.complete) {
			return;
		}
		BOOMR.removeVar("restiming");
		if(p && typeof p.getEntriesByType === "function") {
			r = getResourceTiming();
			if(r) {
				BOOMR.info("Client supports Resource Timing API", "restiming");
				BOOMR.addVar({
					restiming: r
				});
			}
		}
		this.complete = true;
		BOOMR.sendBeacon();
	}
};

BOOMR.plugins.ResourceTiming = {
	init: function() {
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		return this;
	},
	is_complete: function() {
		return impl.complete;
	},
	// exports for test
	trimTiming: trimTiming,
	convertToTrie: convertToTrie,
	optimizeTrie: optimizeTrie,
	findPerformanceEntriesForFrame: findPerformanceEntriesForFrame,
	getResourceTiming: getResourceTiming
};

}());
