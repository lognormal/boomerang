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

// A private object to encapsulate all your implementation details
var impl = {
	complete: false,
	done: function() {
		if(this.complete) {
			return this;
		}

		var w  = BOOMR.window,
		    p  = w.performance,
		    c  = w.console,
		    d  = w.document,
		    fn = (({}).toString.call(w.opera) === '[object Opera]' ? d.querySelectorAll : d.getElementsByTagName),
		    m, f;

		// handle IE6/7 weirdness regarding host objects
		// See: http://stackoverflow.com/questions/7125288/what-is-document-getelementbyid
		f  = (fn.call === undefined ? function(tag) { return fn(tag); } : fn);

		m = (p && p.memory ? p.memory : (c && c.memory ? c.memory : null));

		if(m) {
			BOOMR.addVar({
				'mem.total': m.totalJSHeapSize,
				'mem.used' : m.usedJSHeapSize
			});
		}

		BOOMR.addVar({
			'dom.ln': f.call(d, '*').length,
			'dom.sz': f.call(d, 'html')[0].innerHTML.length,
			'dom.img': f.call(d, 'img').length,
			'dom.script': f.call(d, 'script').length
		});

		this.complete = true;
		BOOMR.sendBeacon();
	}
};

BOOMR.plugins.Memory = {
	init: function() {
		// we do this on onload so that we take a memory and dom snapshot after most things have run
		BOOMR.subscribe("page_ready", impl.done, null, impl);
		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}());

