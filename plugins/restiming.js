/**
\file restiming.js
Plugin to collect metrics from the W3C Resource Timing API.
For more information about Resource Timing,
see: http://www.w3.org/TR/resource-timing/
*/

(function() {

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var restricted = {
	redirectStart: "rt_red_st",
	redirectEnd: "rt_red_end",
	domainLookupStart: "rt_dns_st",
	domainLookupEnd: "rt_dns_end",
	connectStart: "rt_con_st",
	connectEnd: "rt_con_end",
	secureConnectionStart: "rt_scon_st",
	requestStart: "rt_req_st",
	responseStart: "rt_res_st"
},

impl = {
	complete: false,
	done: function() {
		var p = BOOMR.window.performance, r, data, i, k;
		if(impl.complete) {
			return;
		}
		BOOMR.removeVar("restiming");
		if(p && typeof p.getEntriesByType === "function") {
			r = p.getEntriesByType("resource");
			if(r) {
				BOOMR.info("Client supports Resource Timing API", "restiming");
				data = {
					restiming: new Array(r.length)
				};
				for(i = 0; i < r.length; ++i) {
					data.restiming[i] = {
						rt_name: r[i].name,
						rt_in_type: r[i].initiatorType,
						rt_st: r[i].startTime,
						rt_dur: r[i].duration,
						rt_fet_st: r[i].fetchStart,
						rt_res_end: r[i].responseEnd
					};
					for(k in restricted) {
						if(restricted.hasOwnProperty(k) && r[i][k] > 0) {
							data.restiming[i][restricted[k]] = r[i][k];
						}
					}
				}
				BOOMR.addVar(data);
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
	}
};

}());

