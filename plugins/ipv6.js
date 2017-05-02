/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

/**
\file ipv6.js
Plugin to measure various ipv6 related metrics.
This plugin tries to do a few things:
- Check if the client can connect to an ipv6 address
- Check if the client can resolve DNS that points to an ipv6 address
- Check latency of connecting to an ipv6 address
- Check avg latency of doing dns lookup to an ipv6 address (not worstcase)

You'll need a server that has an ipv6 address, and a DNS name to point to it.
Additionally, this server needs to be configured to serve content requested
from the IPv6 address and should not require a virtual host name.  This means
that you probably cannot use shared hosting that puts multiple hosts on the
same IP address.

All beacon parameters are prefixed with ipv6_

Beacon parameters:
- ipv6_latency: Latency in milliseconds of getting data from an ipv6 host when
		connecting to the IP.  Set to NA if the client cannot connect
		to the ipv6 host.
- ipv6_lookup:  Latency of getting data from a hostname that resolves to an
		ipv6 address.  Set to NA if the client cannot resolve or connect
		to the ipv6 host.
*/

(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.IPv6) {
		return;
	}

	/*
	Algorithm:

	1. Try to load a sizeless image from an IPv6 host
	   - onerror, flag no IPv6 connect support and end
	   - onload, measure load time
	2. Try to load a sizeless image from a hostname that resolves to an IPv6 address
	   - onerror, flag no IPv6 DNS resolver and end
	   - onload, measure load time
	*/
	var impl = {
		complete: false,
		ipv6_url: "",
		host_url: "",
		timeout: 1200,

		timers: {
			ipv6: { start: null, end: null },
			host: { start: null, end: null }
		},

		start: function() {
			this.load_img("ipv6", "host");
		},

		load_img: function() {
			var img,
			    rnd = "?t=" + BOOMR.utils.generateId(10),
			    timer = 0, error = null,
			    that = this,
			    which = Array.prototype.shift.call(arguments),
			    a = arguments;

			// Terminate if we've reached end of test list
			if (!which || !this.timers.hasOwnProperty(which)) {
				this.done();
				return false;
			}

			// Skip if URL wasn't set for this test
			if (!this[which + "_url"]) {
				return this.load_img.apply(this, a);
			}

			img = new Image();

			img.onload = function() {
				that.timers[which].end = new Date().getTime();
				clearTimeout(timer);
				img.onload = img.onerror = null;
				img = null;

				that.load_img.apply(that, a);
				that = a = null;
			};

			error = function() {
				that.timers[which].supported = false;
				clearTimeout(timer);
				img.onload = img.onerror = null;
				img = null;

				that.done();
				that = a = null;
			};

			img.onerror = error;
			timer = setTimeout(error, this.timeout);
			this.timers[which].start = new Date().getTime();
			img.src = this[which + "_url"] + rnd;

			return true;
		},

		done: function() {
			if (this.complete) {
				return;
			}

			BOOMR.removeVar("ipv6_latency", "ipv6_lookup");
			if (this.timers.ipv6.end !== null) {
				BOOMR.addVar("ipv6_latency", this.timers.ipv6.end - this.timers.ipv6.start);
			}
			else {
				BOOMR.addVar("ipv6_latency", "NA");
			}

			if (this.timers.host.end !== null) {
				BOOMR.addVar("ipv6_lookup", this.timers.host.end - this.timers.host.start);
			}
			else {
				BOOMR.addVar("ipv6_lookup", "NA");
			}

			this.complete = true;
			BOOMR.sendBeacon();
		},

		skip: function() {
			// it's possible that we didn't start, so sendBeacon never
			// gets called.  Let's set our complete state and call sendBeacon.
			// This happens if onunload fires before onload

			if (!this.complete) {
				this.complete = true;
				BOOMR.sendBeacon();
			}

			return this;
		}
	};

	BOOMR.plugins.IPv6 = {
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "IPv6", ["ipv6_url", "host_url", "timeout"]);

			if (config && config.wait) {
				return this;
			}

			if (!impl.ipv6_url) {
				BOOMR.warn("IPv6.ipv6_url is not set.  Cannot run IPv6 test.", "ipv6");
				impl.complete = true;	// set to true so that is_complete doesn't
							// block other plugins
				return this;
			}

			if (!impl.host_url) {
				BOOMR.warn("IPv6.host_url is not set.  Will skip hostname test.", "ipv6");
			}

			// make sure that test images use the same protocol as the host page
			if (BOOMR.window.location.protocol === "https:") {
				impl.complete = true;
				return this;
			}

			impl.ipv6_url = impl.ipv6_url.replace(/^https:/, "http:");
			impl.host_url = impl.host_url.replace(/^https:/, "http:");

			BOOMR.subscribe("page_ready", impl.start, null, impl);
			BOOMR.subscribe("before_unload", impl.skip, null, impl);

			return this;
		},

		is_complete: function() {
			return impl.complete;
		}
	};

}());
