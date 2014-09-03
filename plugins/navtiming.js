/*
 * Copyright (c), Buddy Brewer.
 */

/**
\file navtiming.js
Plugin to collect metrics from the W3C Navigation Timing API. For more information about Navigation Timing,
see: http://www.w3.org/TR/navigation-timing/
*/

(function() {

// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if (BOOMR.plugins.NavigationTiming) {
	return;
}

// A private object to encapsulate all your implementation details
var impl = {
	complete: false,
	done: function() {
		var w = BOOMR.window, p, pn, pt, data;
		if(this.complete) {
			return this;
		}

		p = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;
		if(p && p.timing && p.navigation) {
			BOOMR.info("This user agent supports NavigationTiming.", "nt");
			pn = p.navigation;
			pt = p.timing;
			data = {
				nt_red_cnt: pn.redirectCount,
				nt_nav_type: pn.type,
				nt_nav_st: pt.navigationStart,
				nt_red_st: pt.redirectStart,
				nt_red_end: pt.redirectEnd,
				nt_fet_st: pt.fetchStart,
				nt_dns_st: pt.domainLookupStart,
				nt_dns_end: pt.domainLookupEnd,
				nt_con_st: pt.connectStart,
				nt_con_end: pt.connectEnd,
				nt_req_st: pt.requestStart,
				nt_res_st: pt.responseStart,
				nt_res_end: pt.responseEnd,
				nt_domloading: pt.domLoading,
				nt_domint: pt.domInteractive,
				nt_domcontloaded_st: pt.domContentLoadedEventStart,
				nt_domcontloaded_end: pt.domContentLoadedEventEnd,
				nt_domcomp: pt.domComplete,
				nt_load_st: pt.loadEventStart,
				nt_load_end: pt.loadEventEnd,
				nt_unload_st: pt.unloadEventStart,
				nt_unload_end: pt.unloadEventEnd
			};
			if (pt.secureConnectionStart) {
				// secureConnectionStart is OPTIONAL in the spec
				data.nt_ssl_st = pt.secureConnectionStart;
			}
			if (pt.msFirstPaint) {
				// msFirstPaint is IE9+ http://msdn.microsoft.com/en-us/library/ff974719
				data.nt_first_paint = pt.msFirstPaint;
			}

			BOOMR.addVar(data);
		}

		// XXX Inconsistency warning.  msFirstPaint above is in milliseconds while
		//     firstPaintTime below is in seconds.microseconds.  The server needs to deal with this.

		// This is Chrome only, so will not overwrite nt_first_paint above
		if(w.chrome && w.chrome.loadTimes) {
			pt = w.chrome.loadTimes();
			if(pt) {
				data = {
					nt_spdy: (pt.wasFetchedViaSpdy?1:0),
					nt_first_paint: pt.firstPaintTime
				};

				BOOMR.addVar(data);
			}
		}

		this.complete = true;
		BOOMR.sendBeacon();
	}
};

BOOMR.plugins.NavigationTiming = {
	init: function() {
		// we'll fire on whichever happens first
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		BOOMR.subscribe("page_unload", impl.done, null, impl);
		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}());

