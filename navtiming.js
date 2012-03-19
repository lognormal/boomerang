/**
\file navtiming.js
Plugin to collect metrics from the W3C Navigation Timing API. For more information about Navigation Timing,
see: http://www.w3.org/TR/navigation-timing/
*/

// w is the window object
(function(w) {

// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

// A private object to encapsulate all your implementation details
var impl = {
	complete: false,
	done: function() {
		var p, pn, pt, data;
		if(this.complete) {
			return this;
		}

		p = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;
		if(p && p.timing && p.navigation) {
			BOOMR.info("This user agent supports NavigationTiming.", "nt");
			pn = w.performance.navigation;
			pt = w.performance.timing;
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
				nt_domcontloaded: pt.domContentLoaded,
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
			BOOMR.addVar(data);
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

	// Any other public methods would be defined here

	is_complete: function() {
		return impl.complete;
	}
};

}(window));

