/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

/**
\file boomerang.js
boomerang measures various performance characteristics of your user's browsing
experience and beacons it back to your server.

\details
To use this you'll need a web site, lots of users and the ability to do
something with the data you collect.  How you collect the data is up to
you, but we have a few ideas.
*/

// Measure the time the script started
// This has to be global so that we don't wait for the entire
// BOOMR function to download and execute before measuring the
// time.  We also declare it without `var` so that we can later
// `delete` it.  This is the only way that works on Internet Explorer
BOOMR_start = new Date().getTime();

// beaconing section
// the parameter is the window
(function(w) {

// This is the only block where we use document without the w. qualifier
if(w.parent != w
		&& document.getElementById('boomr-if-as')
		&& document.getElementById('boomr-if-as').nodeName.toLowerCase() == 'script') {
	w = w.parent;
}

var impl, boomr, k, d=w.document;

// Short namespace because I don't want to keep typing BOOMERANG
if(typeof w.BOOMR === "undefined") {
	w.BOOMR = {};
}
BOOMR = w.BOOMR;
// don't allow this code to be included twice
if(BOOMR.version) {
	return;
}

BOOMR.version = "0.9";
BOOMR.window = w;


// impl is a private object not reachable from outside the BOOMR object
// users can set properties by passing in to the init() method
impl = {
	// properties
	beacon_url: location.protocol + "//204st.us/",
	// strip out everything except last two parts of hostname.
	// This doesn't work well for domains that end with a country tld,
	// but we allow the developer to override site_domain for that.
	site_domain: w.location.hostname.
				replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').
				toLowerCase(),
	//! User's ip address determined on the server.  Used for the BA cookie
	user_ip: '',

	onloadfired: false,

	events: {
		"page_ready": [],
		"page_unload": [],
		"dom_loaded": [],
		"visibility_changed": [],
		"before_beacon": [],
		"xhr_load": [],
		"click": []
	},

	vars: {},

	disabled_plugins: {},

	onclick_handler: function(ev) {
		var target;
		if (!ev) ev = w.event;
		if (ev.target) target = ev.target;
		else if (ev.srcElement) target = ev.srcElement;
		if (target.nodeType == 3) // defeat Safari bug
			target = target.parentNode;

		impl.fireEvent("click", target);
	},

	fireEvent: function(e_name, data) {
		var i, h, e;
		if(!this.events.hasOwnProperty(e_name)) {
			return false;
		}

		e = this.events[e_name];

		for(i=0; i<e.length; i++) {
			h = e[i];
			h[0].call(h[2], data, h[1]);
		}

		return true;
	},

	addListener: function(el, sType, fn) {
		if(el.addEventListener) {
			el.addEventListener(sType, fn, false);
		}
		else if(el.attachEvent) {
			el.attachEvent("on" + sType, fn);
		}
	}
};


// We create a boomr object and then copy all its properties to BOOMR so that
// we don't overwrite anything additional that was added to BOOMR before this
// was called... for example, a plugin.
boomr = {
	t_lstart: null,
	t_start: BOOMR_start,
	t_end: null,

	// Utility functions
	utils: {
		getCookie: function(name) {
			if(!name) {
				return null;
			}

			name = ' ' + name + '=';

			var i, cookies;
			cookies = ' ' + d.cookie + ';';
			if ( (i=cookies.indexOf(name)) >= 0 ) {
				i += name.length;
				cookies = cookies.substring(i, cookies.indexOf(';', i));
				return cookies;
			}

			return null;
		},

		setCookie: function(name, subcookies, max_age) {
			var value=[], k, nameval, c, exp;

			if(!name) {
				return false;
			}

			for(k in subcookies) {
				if(subcookies.hasOwnProperty(k)) {
					value.push(encodeURIComponent(k) + '=' + encodeURIComponent(subcookies[k]));
				}
			}

			value = value.join('&');

			nameval = name + '=' + value;

			c = [nameval, "path=/", "domain=" + impl.site_domain];
			if(max_age) {
				exp = new Date();
				exp.setTime(exp.getTime() + max_age*1000);
				exp = exp.toGMTString();
				c.push("expires=" + exp);
			}

			if ( nameval.length < 4000 ) {
				d.cookie = c.join('; ');
				// confirm cookie was set (could be blocked by user's settings, etc.)
				return ( value === this.getCookie(name) );
			}

			return false;
		},

		getSubCookies: function(cookie) {
			var cookies_a,
			    i, l, kv,
			    cookies={};

			if(!cookie) {
				return null;
			}

			cookies_a = cookie.split('&');

			if(cookies_a.length === 0) {
				return null;
			}

			for(i=0, l=cookies_a.length; i<l; i++) {
				kv = cookies_a[i].split('=');
				kv.push("");	// just in case there's no value
				cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
			}

			return cookies;
		},

		removeCookie: function(name) {
			return this.setCookie(name, {}, 0);
		},

		pluginConfig: function(o, config, plugin_name, properties) {
			var i, props=0;

			if(!config || !config[plugin_name]) {
				return false;
			}

			for(i=0; i<properties.length; i++) {
				if(typeof config[plugin_name][properties[i]] !== "undefined") {
					o[properties[i]] = config[plugin_name][properties[i]];
					props++;
				}
			}

			return (props>0);
		}
	},

	init: function(config) {
		var i, k,
		    properties = ["beacon_url", "site_domain", "user_ip"];

		if(!config) {
			config = {};
		}

		for(i=0; i<properties.length; i++) {
			if(typeof config[properties[i]] !== "undefined") {
				impl[properties[i]] = config[properties[i]];
			}
		}

		if(typeof config.log  !== "undefined") {
			this.log = config.log;
		}
		if(!this.log) {
			this.log = function(m,l,s) { };
		}

		for(k in this.plugins) {
			// config[pugin].enabled has been set to false
			if( config[k]
				&& ("enabled" in config[k])
				&& config[k].enabled === false
			) {
				impl.disabled_plugins[k] = 1;
				continue;
			}
			else if(impl.disabled_plugins[k]) {
				delete impl.disabled_plugins[k];
			}

			// plugin exists and has an init method
			if(this.plugins.hasOwnProperty(k)
				&& typeof this.plugins[k].init === "function"
			) {
				this.plugins[k].init(config);
			}
		}

		// The developer can override onload by setting autorun to false
		if(!impl.onloadfired && (!("autorun" in config) || config.autorun !== false)) {
			if("onpagehide" in w) {
				impl.addListener(w, "pageshow", BOOMR.page_ready);
			}
			else {
				impl.addListener(w, "load", BOOMR.page_ready);
			}
		}

		impl.addListener(w, "DOMContentLoaded", function() { impl.fireEvent("dom_loaded"); });

		// visibilitychange is useful to detect if the page loaded through prerender
		// or if the page never became visible
		// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
		// http://www.nczonline.net/blog/2011/08/09/introduction-to-the-page-visibility-api/
		var fire_visible = function() { impl.fireEvent("visibility_changed"); }
		if(d.webkitVisibilityState)
			impl.addListener(d, "webkitvisibilitychange", fire_visible);
		else if(d.msVisibilityState)
			impl.addListener(d, "msvisibilitychange", fire_visible);
		else if(d.visibilityState)
			impl.addListener(d, "visibilitychange", fire_visible);

		impl.addListener(d, "mouseup", impl.onclick_handler);

		if(!("onpagehide" in w)) {
			// This must be the last one to fire
			// We only clear w on browsers that don't support onpagehide because
			// those that do are new enough to not have memory leak problems of
			// some older browsers
			impl.addListener(w, "unload", function() { w=null; });
		}

		return this;
	},

	// The page dev calls this method when they determine the page is usable.
	// Only call this if autorun is explicitly set to false
	page_ready: function() {
		if(impl.onloadfired) {
			return this;
		}
		impl.fireEvent("page_ready");
		impl.onloadfired = true;
		return this;
	},

	subscribe: function(e_name, fn, cb_data, cb_scope) {
		var i, h, e;

		if(!impl.events.hasOwnProperty(e_name)) {
			return this;
		}

		e = impl.events[e_name];

		// don't allow a handler to be attached more than once to the same event
		for(i=0; i<e.length; i++) {
			h = e[i];
			if(h[0] === fn && h[1] === cb_data && h[2] === cb_scope) {
				return this;
			}
		}
		e.push([ fn, cb_data || {}, cb_scope || null ]);

		// attaching to page_ready after onload fires, so call soon
		if(e_name == 'page_ready' && impl.onloadfired) {
			setTimeout(function() {
					fn.call(cb_scope || null, null, cb_data || {});
				}, 50);
		}

		// Attach unload handlers directly to the window.onunload and
		// window.onbeforeunload events. The first of the two to fire will clear
		// fn so that the second doesn't fire. We do this because technically
		// onbeforeunload is the right event to fire, but all browsers don't
		// support it.  This allows us to fall back to onunload when onbeforeunload
		// isn't implemented
		if(e_name === 'page_unload') {
			var unload_handler = function() {
							if(fn) {
								fn.call(cb_scope, null, cb_data);
							}
							fn=cb_scope=cb_data=null;
						};
			// pagehide is for iOS devices
			// see http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
			if("onpagehide" in w) {
				impl.addListener(w, "pagehide", unload_handler);
			}
			else {
				impl.addListener(w, "unload", unload_handler);
				impl.addListener(w, "beforeunload", unload_handler);
			}
		}

		return this;
	},

	addVar: function(name, value) {
		if(typeof name === "string") {
			impl.vars[name] = value;
		}
		else if(typeof name === "object") {
			var o = name, k;
			for(k in o) {
				if(o.hasOwnProperty(k)) {
					impl.vars[k] = o[k];
				}
			}
		}
		return this;
	},

	removeVar: function() {
		var i, params;
		if(!arguments.length) {
			return this;
		}

		if(arguments.length === 1
				&& Object.prototype.toString.apply(arguments[0]) === "[object Array]") {
			params = arguments[0];
		}
		else {
			params = arguments;
		}

		for(i=0; i<params.length; i++) {
			if(impl.vars.hasOwnProperty(params[i])) {
				delete impl.vars[params[i]];
			}
		}

		return this;
	},

	requestStart: function(name) {
		var t_start = new Date().getTime();
		BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);

		return {
			loaded: function() {
				BOOMR.responseEnd(name, t_start);
			}
		};
	},

	responseEnd: function(name, t_start) {
		if(impl.vars['h.cr']) {
			BOOMR.addVar('xhr.pg', name);
			BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);
			impl.fireEvent("xhr_load", { "name": "xhr_" + name });
		}
		else {
			var timer = name + "|" + (new Date().getTime()-t_start);
			if(impl.vars.qt) {
				impl.vars.qt += "," + timer;
			}
			else {
				impl.vars.qt = timer;
			}
		}
	},

	sendBeacon: function() {
		var k, url, img, nparams=0;

		// At this point someone is ready to send the beacon.  We send
		// the beacon only if all plugins have finished doing what they
		// wanted to do
		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				if(impl.disabled_plugins[k]) {
					continue;
				}
				if(!this.plugins[k].is_complete()) {
					return this;
				}
			}
		}

		impl.vars.v = BOOMR.version;
		impl.vars.u = d.URL.replace(/#.*/, '');
		// use d.URL instead of location.href because of a safari bug

		// If we reach here, all plugins have completed
		impl.fireEvent("before_beacon", impl.vars);

		// Don't send a beacon if no beacon_url has been set
		// you would do this if you want to do some fancy beacon handling
		// in the `before_beacon` event instead of a simple GET request
		if(!impl.beacon_url) {
			return this;
		}

		// if there are already url parameters in the beacon url,
		// change the first parameter prefix for the boomerang url parameters to &

		url = impl.beacon_url + ((impl.beacon_url.indexOf('?') > -1)?'&':'?');

		for(k in impl.vars) {
			if(impl.vars.hasOwnProperty(k)) {
				nparams++;
				url += "&" + encodeURIComponent(k)
					+ "="
					+ (
						impl.vars[k]===undefined || impl.vars[k]===null
						? ''
						: encodeURIComponent(impl.vars[k])
					);
			}
		}
		BOOMR.removeVar("qt");

		// only send beacon if we actually have something to beacon back
		if(nparams) {
			img = new Image();
			img.src=url;
		}

		return this;
	}

};

delete BOOMR_start;
if(typeof BOOMR_lstart == 'number') {
	boomr.t_lstart = BOOMR_lstart;
	delete BOOMR_lstart;
}

var make_logger = function(l) {
	return function(m, s) {
		this.log(m, l, "boomerang" + (s?"."+s:"")); return this;
	};
};

boomr.debug = make_logger("debug");
boomr.info = make_logger("info");
boomr.warn = make_logger("warn");
boomr.error = make_logger("error");

if(typeof console !== "undefined" && typeof console.log !== "undefined") {
	boomr.log = function(m,l,s) { console.log(s + ": [" + l + "] " + m); };
}


for(k in boomr) {
	if(boomr.hasOwnProperty(k)) {
		BOOMR[k] = boomr[k];
	}
}

BOOMR.plugins = BOOMR.plugins || {};

}(window));

// end of boomerang beaconing section
// Now we start built in plugins.



/*jslint white: false, devel: true, onevar: true, browser: true, undef: true, nomen: true, regexp: false, continue: true, plusplus: false, bitwise: false, newcap: true, maxerr: 50, indent: 4 */
