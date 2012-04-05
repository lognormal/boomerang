/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

/**
\file dns.js
Plugin to measure DNS latency.
This code is based on Carlos Bueno's guide to DNS on the YDN blog:
http://developer.yahoo.net/blog/archives/2009/11/guide_to_dns.html
*/

// w is the window object
(function(w) {

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	complete: false,
	base_url: "",
	t_start: null,
	t_dns: null,
	t_http: null,
	img: null,

	gen_url: "",

	start: function() {
		var random = Math.floor(Math.random()*(2147483647)).toString(36),
		    cache_bust = "" + (new Date().getTime()) + (Math.random());

		this.gen_url = this.base_url.replace(/\*/, random);

		impl.img = new Image();
		impl.img.onload = impl.A_loaded;

		impl.t_start = new Date().getTime();
		impl.img.src = this.gen_url + "image-l.gif?t=" + cache_bust;
	},

	A_loaded: function() {
		var cache_bust;
		impl.t_dns = new Date().getTime() - impl.t_start;

		cache_bust = "" + (new Date().getTime()) + (Math.random());

		impl.img = new Image();
		impl.img.onload = impl.B_loaded;

		impl.t_start = new Date().getTime();
		impl.img.src = impl.gen_url + "image-l.gif?t=" + cache_bust;
	},

	B_loaded: function() {
		impl.t_http = new Date().getTime() - impl.t_start;

		impl.img = null;
		impl.done();
	},

	done: function() {
		// DNS time is the time to load the image with uncached DNS
		// minus the time to load the image with cached DNS

		var dns = impl.t_dns - impl.t_http;

		BOOMR.addVar("dns", dns);
		this.complete = true;
		BOOMR.sendBeacon();
	},

	read_timing_api: function(t) {
		if(typeof t.domainLookupStart === "undefined"
				|| typeof t.domainLookupEnd === "undefined") {
			return false;
		}

		// This will be 0 if we read DNS from cache, but that's what
		// we want because it's what the user experiences
		BOOMR.addVar("dns", t.domainLookupEnd - t.domainLookupStart);

		impl.complete = true;

		return true;
	}
};

BOOMR.plugins.DNS = {
	init: function(config) {
		BOOMR.utils.pluginConfig(impl, config, "DNS", ["base_url"]);

		// If this browser supports the WebTiming API, then we just
		// use that and don't bother doing the test
		if(w.performance && w.performance.timing) {
			if(impl.read_timing_api(w.performance.timing)) {
				return this;
			}
		}

		if(!impl.base_url) {
			BOOMR.warn("DNS.base_url is not set.  Cannot run DNS test.", "dns");
			impl.complete = true;	// set to true so that is_complete doesn't
						// block other plugins
			return this;
		}

		// make sure that dns test images use the same protocol as the host page
		if(w.location.protocol === 'https:') {
			impl.base_url = impl.base_url.replace(/^http:/, 'https:');
		}
		else {
			impl.base_url = impl.base_url.replace(/^https:/, 'http:');
		}

		BOOMR.subscribe("page_ready", impl.start, null, this);

		return this;
	},

	is_complete: function() {
		return impl.complete;
	}
};

}(window));

