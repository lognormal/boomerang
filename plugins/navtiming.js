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
		sendBeacon: function() {
			this.complete = true;
			BOOMR.sendBeacon();
		},
		xhr_done: function(edata) {
			var p;

			if (edata && edata.initiator === "spa_hard") {
				// Single Page App - Hard refresh: Send page's NavigationTiming data, if
				// available.
				impl.done(edata);
				return;
			}
			else if (edata && edata.initiator === "spa") {
				// Single Page App - Soft refresh: The original hard navigation is no longer
				// relevant for this soft refresh, nor is the "URL" for this page, so don't
				// add NavigationTiming or ResourceTiming metrics.
				impl.sendBeacon();
				return;
			}

			var w = BOOMR.window, res, data = {}, k;

			if (!edata) {
				return;
			}

			if (edata.data) {
				edata = edata.data;
			}

			p = BOOMR.getPerformance();
			if (edata.url && p) {
				res = BOOMR.getResourceTiming(edata.url, function(a, b) { return a.responseEnd - b.responseEnd; });
				if (res) {
					data = {
						nt_red_st: res.redirectStart,
						nt_red_end: res.redirectEnd,
						nt_fet_st: res.fetchStart,
						nt_dns_st: res.domainLookupStart,
						nt_dns_end: res.domainLookupEnd,
						nt_con_st: res.connectStart,
						nt_con_end: res.connectEnd,
						nt_req_st: res.requestStart,
						nt_res_st: res.responseStart,
						nt_res_end: res.responseEnd
					};
					if (res.secureConnectionStart) {
						// secureConnectionStart is OPTIONAL in the spec
						data.nt_ssl_st = res.secureConnectionStart;
					}

					for (k in data) {
						if (data.hasOwnProperty(k) && data[k]) {
							data[k] += p.timing.navigationStart;

							// don't need to send microseconds
							data[k] = Math.round(data[k]);
						}
					}

				}
			}

			if (edata.timing) {
				res = edata.timing;
				if (!data.nt_req_st) {
					// requestStart will be 0 if Timing-Allow-Origin header isn't set on the xhr response
					data.nt_req_st = res.requestStart;
				}
				if (!data.nt_res_st) {
					// responseStart will be 0 if Timing-Allow-Origin header isn't set on the xhr response
					data.nt_res_st = res.responseStart;
				}
				if (!data.nt_res_end) {
					data.nt_res_end = res.responseEnd;
				}
				data.nt_domint = res.domInteractive;
				data.nt_domcomp = res.domComplete;
				data.nt_load_st = res.loadEventEnd;
				data.nt_load_end = res.loadEventEnd;
			}

			for (k in data) {
				if (data.hasOwnProperty(k) && !data[k]) {
					delete data[k];
				}
			}

			BOOMR.addVar(data);

			try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
			catch (ignore) { /* empty */ }

			impl.sendBeacon();
		},

		done: function() {
			var w = BOOMR.window, p, pn, pt, data;
			if (this.complete) {
				return this;
			}

			impl.addedVars = [];

			p = BOOMR.getPerformance();
			if (p && p.timing && p.navigation) {
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

				try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
				catch (ignore) { /* empty */ }
			}

			// XXX Inconsistency warning.  msFirstPaint above is in milliseconds while
			//     firstPaintTime below is in seconds.microseconds.  The server needs to deal with this.

			// This is Chrome only, so will not overwrite nt_first_paint above
			if (w.chrome && w.chrome.loadTimes) {
				pt = w.chrome.loadTimes();
				if (pt) {
					data = {
						nt_spdy: (pt.wasFetchedViaSpdy ? 1 : 0),
						nt_cinf: pt.connectionInfo,
						nt_first_paint: pt.firstPaintTime
					};

					BOOMR.addVar(data);

					try { impl.addedVars.push.apply(impl.addedVars, Object.keys(data)); }
					catch (ignore) { /* empty */ }
				}
			}

			impl.sendBeacon();
		},

		clear: function() {
			if (impl.addedVars && impl.addedVars.length > 0) {
				BOOMR.removeVar(impl.addedVars);
				impl.addedVars = [];
			}
			this.complete = false;
		},

		prerenderToVisible: function() {
			// ensure we add our data to the beacon even if we had added it
			// during prerender (in case another beacon went out in between)
			this.complete = false;

			// add our data to the beacon
			this.done();
		}
	};

	BOOMR.plugins.NavigationTiming = {
		init: function() {
			if (!impl.initialized) {
				// we'll fire on whichever happens first
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.prerenderToVisible, null, impl);
				BOOMR.subscribe("xhr_load", impl.xhr_done, null, impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);
				BOOMR.subscribe("onbeacon", impl.clear, null, impl);

				impl.initialized = true;
			}
			return this;
		},

		is_complete: function() {
			return true;
		}
	};

}());
