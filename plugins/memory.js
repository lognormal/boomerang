/*
 * Copyright (c), Log-Normal, Inc.
 */

/**
\file memory.js
Plugin to collect memory metrics when available.
see: http://code.google.com/p/chromium/issues/detail?id=43281
*/

(function() {

// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if (BOOMR.plugins.Memory) {
	return;
}

// A private object to encapsulate all your implementation details
var impl = {
	complete: false,
	done: function() {
		var w, d, fn, p, c, m, f;

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

		m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

		// If we have resource timing, get number of resources
		if(p && p.getEntries && p.getEntries().length) {
			BOOMR.addVar("dom.res", p.getEntries().length);
		}

		if(m) {
			BOOMR.addVar({
				"mem.total": m.totalJSHeapSize,
				"mem.used" : m.usedJSHeapSize
			});
		}

		// handle IE6/7 weirdness regarding host objects
		// See: http://stackoverflow.com/questions/7125288/what-is-document-getelementbyid
		if (fn) {
			f  = (fn.call === undefined ? function(tag) { return fn(tag); } : fn);

			BOOMR.addVar({
				"dom.ln": f.call(d, "*").length,
				"dom.sz": f.call(d, "html")[0].innerHTML.length,
				"dom.img": f.call(d, "img").length,
				"dom.script": f.call(d, "script").length
			});
		}

		this.complete = true;
		BOOMR.sendBeacon();
	}
};

BOOMR.plugins.Memory = {
	init: function() {
		// we do this on onload so that we take a memory and dom snapshot after most things have run
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		BOOMR.subscribe("xhr_load", impl.done, null, impl);
		BOOMR.subscribe("page_unload", impl.done, null, impl);
		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}());

