/*
 * Copyright (c), Log-Normal, Inc.
 */

/**
\file memory.js
Plugin to collect memory metrics when available.
see: http://code.google.com/p/chromium/issues/detail?id=43281
*/

(function() {
var w, p={}, d, f, m;
// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if (BOOMR.plugins.Memory) {
	return;
}

// A private object to encapsulate all your implementation details
var impl = {
	done: function() {
		var res, doms={}, a;
		// If we have resource timing, get number of resources
		if(p && p.getEntriesByType && p.getEntriesByType("resource").length) {
			res = p.getEntriesByType("resource");
			BOOMR.addVar("dom.res", res.length);

			a = document.createElement("a");

			res.forEach(function(r) {
				a.href=r.name;
				doms[a.hostname] = true;
			});

			BOOMR.addVar("dom.doms", Object.keys(doms).length);
		}
		else {
			BOOMR.removeVar("dom.res");
		}

		if(m) {
			BOOMR.addVar({
				"mem.total": m.totalJSHeapSize,
				"mem.used" : m.usedJSHeapSize
			});
		}

		// handle IE6/7 weirdness regarding host objects
		// See: http://stackoverflow.com/questions/7125288/what-is-document-getelementbyid
		if (f) {
			BOOMR.addVar({
				"dom.ln": f.call(d, "*").length,
				"dom.sz": f.call(d, "html")[0].innerHTML.length,
				"dom.img": f.call(d, "img").length,
				"dom.script": f.call(d, "script").length
			});
		}

		// no need of sendBeacon because we're called when the beacon is being sent
	}
};

BOOMR.plugins.Memory = {
	init: function() {
		var fn, c;

		try {
			w  = BOOMR.window;
			d  = w.document;
			fn = d.getElementsByTagName;
			p  = w.performance;
			c  = w.console;
		}
		catch(err) {
			BOOMR.addError(err, "Memory.done");
		}

		// handle IE6/7 weirdness regarding host objects
		// See: http://stackoverflow.com/questions/7125288/what-is-document-getelementbyid
		if (fn) {
			f  = (fn.call === undefined ? function(tag) { return fn(tag); } : fn);
		}

		m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

		// we do this before sending a beacon to get the snapshot when the beacon is sent
		BOOMR.subscribe("before_beacon", impl.done, null, impl);
		return this;
	},

	is_complete: function() {
		// Always true since we run on before_beacon, which happens after the check
		return true;
	}
};

}());

