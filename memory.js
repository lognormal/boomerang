/*
 * Copyright (c), Log-Normal, Inc.
 */

/**
\file memory.js
Plugin to collect memory metrics when available.
see: http://code.google.com/p/chromium/issues/detail?id=43281
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
		var p = w.performance,
		    c = w.console,
		    d = w.document,
		    f = (({}).toString.call(window.opera) == '[object Opera]' ? d.querySelectorAll : d.getElementsByTagName),
		    m;

		m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

		if(m) {
			BOOMR.addVar({
				'mem.total': m.totalJSHeapSize,
				'mem.used' : m.usedJSHeapSize
			});
		}

		BOOMR.addVar({
			'dom.ln': f.call(d, '*').length,
			'dom.sz': f.call(d, 'html')[0].innerHTML.length
		}); 

		this.complete = true;
		BOOMR.sendBeacon();
	}
};

BOOMR.plugins.Memory = {
	init: function() {
		// we do this on onload so that we take a memory snapshot after most things have run
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}(window));

