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

(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.DNS) {
		return;
	}

	var impl = {
		complete: false,
		base_url: "",
		t_start: null,
		t_dns: null,
		t_http: null,
		img: null,

		gen_url: "",

		start: function() {
			if (impl.gen_url) {	// already running
				return;
			}

			var random = BOOMR.utils.generateId(10);

			impl.gen_url = impl.base_url.replace(/\*/, random);

			impl.img = new Image();
			impl.img.onload = impl.A_loaded;

			impl.t_start = new Date().getTime();
			impl.img.src = impl.gen_url + "image-l.gif?t=" + random;
		},

		A_loaded: function() {
			var random = BOOMR.utils.generateId(10);

			impl.t_dns = new Date().getTime() - impl.t_start;

			impl.img = new Image();
			impl.img.onload = impl.B_loaded;

			impl.t_start = new Date().getTime();
			impl.img.src = impl.gen_url + "image-l.gif?t=" + random;
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

			BOOMR.addVar("dns.t", dns);
			impl.complete = true;
			impl.gen_url = "";
			BOOMR.sendBeacon();
		}
	};

	BOOMR.plugins.DNS = {
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "DNS", ["base_url"]);

			if (config && config.wait) {
				return this;
			}

			if (!impl.base_url) {
				BOOMR.warn("DNS.base_url is not set.  Cannot run DNS test.", "dns");
				impl.complete = true;	// set to true so that is_complete doesn't
							// block other plugins
				return this;
			}

			// do not run test over https
			if (BOOMR.window.location.protocol === "https:") {
				impl.complete = true;
				return this;
			}

			BOOMR.subscribe("page_ready", impl.start, null, impl);

			return this;
		},

		is_complete: function() {
			return impl.complete;
		}
	};

}());
