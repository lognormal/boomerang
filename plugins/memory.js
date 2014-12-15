/*
 * Copyright (c), Log-Normal, Inc.
 */

/**
\file memory.js
Plugin to collect memory metrics when available.
see: http://code.google.com/p/chromium/issues/detail?id=43281
*/

(function() {
var w, p={}, d, m, impl;
// First make sure BOOMR is actually defined.  It's possible that your plugin is loaded before boomerang, in which case
// you'll need this.
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if (BOOMR.plugins.Memory) {
	return;
}

function nodeList(type) {
	return d.getElementsByTagName(type);
}

// A private object to encapsulate all your implementation details
impl = {
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

		try {
			BOOMR.addVar({
				"dom.ln": nodeList("*").length,
				"dom.sz": nodeList("html")[0].innerHTML.length,
				"dom.img": nodeList("img").length,
				"dom.script": nodeList("script").length
			});
		}
		catch(err) {
			BOOMR.addError(err, "Memory.done.dom");
		}

		if(w.screen) {
			try {
				BOOMR.addVar({
					"scr.xy": w.screen.width + "x" + w.screen.height,
					"scr.bpp": w.screen.colorDepth + "/" + w.screen.pixelDepth
				});
				if(w.screen.orientation) {
					BOOMR.addVar("scr.orn", w.screen.orientation.angle + "/" + w.screen.orientation.type);
				}
			}
			catch(err) {
				BOOMR.addError(err, "Memory.done.screen");
			}
		}

		// no need of sendBeacon because we're called when the beacon is being sent
	}
};

BOOMR.plugins.Memory = {
	init: function() {
		var c;

		try {
			w  = BOOMR.window;
			d  = w.document;
			p  = w.performance;
			c  = w.console;
		}
		catch(err) {
			BOOMR.addError(err, "Memory.init");
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

