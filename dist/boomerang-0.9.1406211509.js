/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyright (c) 2013, SOASTA, Inc. All rights reserved.
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
if(w.parent !== w
		&& document.getElementById('boomr-if-as')
		&& document.getElementById('boomr-if-as').nodeName.toLowerCase() === 'script') {
	w = w.parent;
}

var impl, boomr, k, d=w.document;

// Short namespace because I don't want to keep typing BOOMERANG
if(w.BOOMR === undefined) {
	w.BOOMR = {};
}
BOOMR = w.BOOMR;
// don't allow this code to be included twice
if(BOOMR.version) {
	return;
}

BOOMR.version = "0.9.1406211509";
BOOMR.window = w;


// impl is a private object not reachable from outside the BOOMR object
// users can set properties by passing in to the init() method
impl = {
	// properties
	beacon_url: "",
	// strip out everything except last two parts of hostname.
	// This doesn't work well for domains that end with a country tld,
	// but we allow the developer to override site_domain for that.
	// You can disable all cookies by setting site_domain to a falsy value
	site_domain: w.location.hostname.
				replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').
				toLowerCase(),
	//! User's ip address determined on the server.  Used for the BA cookie
	user_ip: '',

	onloadfired: false,

	handlers_attached: false,
	events: {
		"page_ready": [],
		"page_unload": [],
		"dom_loaded": [],
		"visibility_changed": [],
		"before_beacon": [],
		"click": []
	},

	vars: {},

	disabled_plugins: {},

	onclick_handler: function(ev) {
		var target;
		if (!ev) { ev = w.event; }
		if (ev.target) { target = ev.target; }
		else if (ev.srcElement) { target = ev.srcElement; }
		if (target.nodeType === 3) {// defeat Safari bug
			target = target.parentNode;
		}

		// don't capture clicks on flash objects
		// because of context slowdowns in PepperFlash
		if(target && target.nodeName.toUpperCase() === "OBJECT" && target.type === "application/x-shockwave-flash") {
			return;
		}
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
	}
};


// We create a boomr object and then copy all its properties to BOOMR so that
// we don't overwrite anything additional that was added to BOOMR before this
// was called... for example, a plugin.
boomr = {
	t_start: BOOMR_start,
	t_end: null,

	// Utility functions
	utils: {
		objectToString: function(o, separator) {
			var value = [], k;

			if(!o || typeof o !== "object") {
				return o;
			}
			if(separator === undefined) {
				separator="\n\t";
			}

			for(k in o) {
				if(Object.prototype.hasOwnProperty.call(o, k)) {
					value.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k]));
				}
			}

			return value.join(separator);
		},

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
			var value, nameval, c, exp;

			if(!name || !impl.site_domain) {
				return false;
			}

			value = this.objectToString(subcookies, "&");
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
				if(config[plugin_name][properties[i]] !== undefined) {
					o[properties[i]] = config[plugin_name][properties[i]];
					props++;
				}
			}

			return (props>0);
		},

		addListener: function(el, type, fn) {
			if (el.addEventListener) {
				el.addEventListener(type, fn, false);
			} else {
				el.attachEvent( 'on' + type, fn );
			}
		},

		removeListener: function (el, type, fn) {
			if (el.removeEventListener) {
				el.removeEventListener(type, fn, false);
			} else {
				el.detachEvent('on' + type, fn);
			}
		}
	},

	init: function(config) {
		var i, k,
		    properties = ["beacon_url", "site_domain", "user_ip"];

		if(!config) {
			config = {};
		}

		for(i=0; i<properties.length; i++) {
			if(config[properties[i]] !== undefined) {
				impl[properties[i]] = config[properties[i]];
			}
		}

		if(config.log  !== undefined) {
			this.log = config.log;
		}
		if(!this.log) {
			this.log = function(/* m,l,s */) { };
		}

		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				// config[pugin].enabled has been set to false
				if( config[k]
					&& config[k].hasOwnProperty("enabled")
					&& config[k].enabled === false
				) {
					impl.disabled_plugins[k] = 1;
					continue;
				}
				else if(impl.disabled_plugins[k]) {
					delete impl.disabled_plugins[k];
				}

				// plugin exists and has an init method
				if(typeof this.plugins[k].init === "function") {
					this.plugins[k].init(config);
				}
			}
		}

		if(impl.handlers_attached) {
			return this;
		}

		// The developer can override onload by setting autorun to false
		if(!impl.onloadfired && (config.autorun === undefined || config.autorun !== false)) {
			if(d.readyState && d.readyState === "complete") {
				this.setImmediate(BOOMR.page_ready, null, null, BOOMR);
			}
			else {
				if(w.onpagehide || w.onpagehide === null) {
					boomr.utils.addListener(w, "pageshow", BOOMR.page_ready);
				}
				else {
					boomr.utils.addListener(w, "load", BOOMR.page_ready);
				}
			}
		}

		boomr.utils.addListener(w, "DOMContentLoaded", function() { impl.fireEvent("dom_loaded"); });

		(function() {
			// visibilitychange is useful to detect if the page loaded through prerender
			// or if the page never became visible
			// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
			// http://www.nczonline.net/blog/2011/08/09/introduction-to-the-page-visibility-api/
			var fire_visible = function() { impl.fireEvent("visibility_changed"); };
			if(d.webkitVisibilityState) {
				boomr.utils.addListener(d, "webkitvisibilitychange", fire_visible);
			}
			else if(d.msVisibilityState) {
				boomr.utils.addListener(d, "msvisibilitychange", fire_visible);
			}
			else if(d.visibilityState) {
				boomr.utils.addListener(d, "visibilitychange", fire_visible);
			}

			boomr.utils.addListener(d, "mouseup", impl.onclick_handler);

			if(!w.onpagehide && w.onpagehide !== null) {
				// This must be the last one to fire
				// We only clear w on browsers that don't support onpagehide because
				// those that do are new enough to not have memory leak problems of
				// some older browsers
				boomr.utils.addListener(w, "unload", function() { BOOMR.window=w=null; });
			}
		}());

		impl.handlers_attached = true;
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

	setImmediate: function(fn, data, cb_data, cb_scope) {
		var cb = function() {
			fn.call(cb_scope || null, data, cb_data || {});
			cb=null;
		};

		if(w.setImmediate) {
			w.setImmediate(cb);
		}
		else if(w.msSetImmediate) {
			w.msSetImmediate(cb);
		}
		else if(w.webkitSetImmediate) {
			w.webkitSetImmediate(cb);
		}
		else if(w.mozSetImmediate) {
			w.mozSetImmediate(cb);
		}
		else {
			setTimeout(cb, 10);
		}
	},

	subscribe: function(e_name, fn, cb_data, cb_scope) {
		var i, h, e, unload_handler;

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
		if(e_name === 'page_ready' && impl.onloadfired) {
			this.setImmediate(fn, null, cb_data, cb_scope);
		}

		// Attach unload handlers directly to the window.onunload and
		// window.onbeforeunload events. The first of the two to fire will clear
		// fn so that the second doesn't fire. We do this because technically
		// onbeforeunload is the right event to fire, but all browsers don't
		// support it.  This allows us to fall back to onunload when onbeforeunload
		// isn't implemented
		if(e_name === 'page_unload') {
			unload_handler = function(ev) {
							if(fn) {
								fn.call(cb_scope, ev || w.event, cb_data);
							}
						};
			// pagehide is for iOS devices
			// see http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
			if(w.onpagehide || w.onpagehide === null) {
				boomr.utils.addListener(w, "pagehide", unload_handler);
			}
			else {
				boomr.utils.addListener(w, "unload", unload_handler);
			}
			boomr.utils.addListener(w, "beforeunload", unload_handler);
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

	removeVar: function(arg0) {
		var i, params;
		if(!arguments.length) {
			return this;
		}

		if(arguments.length === 1
				&& Object.prototype.toString.apply(arg0) === "[object Array]") {
			params = arg0;
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
		if(w !== window) {
			impl.vars["if"] = "";
		}

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

		url = [];

		for(k in impl.vars) {
			if(impl.vars.hasOwnProperty(k)) {
				nparams++;
				url.push(encodeURIComponent(k)
					+ "="
					+ (
						impl.vars[k]===undefined || impl.vars[k]===null
						? ''
						: encodeURIComponent(impl.vars[k])
					)
				);
			}
		}

		url = impl.beacon_url + ((impl.beacon_url.indexOf('?') > -1)?'&':'?') + url.join('&');

		BOOMR.debug("Sending url: " + url.replace(/&/g, "\n\t"));

		// only send beacon if we actually have something to beacon back
		if(nparams) {
			img = new Image();
			img.src=url;
		}

		return this;
	}

};

delete BOOMR_start;

(function() {
	var make_logger = function(l) {
		return function(m, s) {
			this.log(m, l, "boomerang" + (s?"."+s:""));
			return this;
		};
	};

	boomr.debug = make_logger("debug");
	boomr.info = make_logger("info");
	boomr.warn = make_logger("warn");
	boomr.error = make_logger("error");
}());

if(w.YAHOO && w.YAHOO.widget && w.YAHOO.widget.Logger) {
	boomr.log = w.YAHOO.log;
}
else if(w.Y && w.Y.log) {
	boomr.log = w.Y.log;
}
else if(typeof console === "object" && console.log !== undefined && w.debug) {
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



/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

// This is the Round Trip Time plugin.  Abbreviated to RT
// the parameter is the window
(function(w) {

var d=w.document, impl;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

// private object
impl = {
	initialized: false,	//! Set when init has completed to prevent double initialization
	complete: false,	//! Set when this plugin has completed

	timers: {},		//! Custom timers that the developer can use
				// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'RT',		//! Name of the cookie that stores the start time and referrer
	cookie_exp:600,		//! Cookie expiry in seconds
	strict_referrer: true,	//! By default, don't beacon if referrers don't match.
				// If set to false, beacon both referrer values and let
				// the back end decide

	navigationType: 0,
	navigationStart: undefined,
	responseStart: undefined,
	t_start: undefined,
	t_fb_approx: undefined,
	r: undefined,
	r2: undefined,

	setCookie: function(how, url) {
		var t_end, t_start, subcookies;

		// Disable use of RT cookie by setting its name to a falsy value
		if(!this.cookie) {
			return this;
		}

		subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(this.cookie)) || {};
		// We use document.URL instead of location.href because of a bug in safari 4
		// where location.href is URL decoded
		if(how === "ul") {
			subcookies.r = d.URL.replace(/#.*/, '');
		}

		if(how === "cl") {
			if(url) {
				subcookies.nu = url;
			}
			else if(subcookies.nu) {
				delete subcookies.nu;
			}
		}
		if(url === false) {
			delete subcookies.nu;
		}

		t_start = new Date().getTime();

		if(how) {
			subcookies[how] = t_start;
		}

		BOOMR.debug("Setting cookie " + BOOMR.utils.objectToString(subcookies), "rt");
		if(!BOOMR.utils.setCookie(this.cookie, subcookies, this.cookie_exp)) {
			BOOMR.error("cannot set start cookie", "rt");
			return this;
		}

		t_end = new Date().getTime();
		if(t_end - t_start > 50) {
			// It took > 50ms to set the cookie
			// The user Most likely has cookie prompting turned on so
			// t_start won't be the actual unload time
			// We bail at this point since we can't reliably tell t_done
			BOOMR.utils.removeCookie(this.cookie);

			// at some point we may want to log this info on the server side
			BOOMR.error("took more than 50ms to set cookie... aborting: "
					+ t_start + " -> " + t_end, "rt");
		}

		return this;
	},

	initFromCookie: function() {
		var subcookies;

		if(!this.cookie) {
			return;
		}

		subcookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(this.cookie));

		if(!subcookies) {
			return;
		}

		subcookies.s = Math.max(+subcookies.ul||0, +subcookies.cl||0);

		BOOMR.debug("Read from cookie " + BOOMR.utils.objectToString(subcookies), "rt");
		if(subcookies.s && subcookies.r) {
			this.r = subcookies.r;

			BOOMR.debug(this.r + " =?= " + this.r2, "rt");
			BOOMR.debug(subcookies.s + " <? " + (+subcookies.cl+15), "rt");
			BOOMR.debug(subcookies.nu + " =?= " + d.URL.replace(/#.*/, ''), "rt");

			if(!this.strict_referrer || this.r === this.r2 ||
					( subcookies.s < +subcookies.cl + 15 && subcookies.nu === d.URL.replace(/#.*/, '') )
			) {
				this.t_start = subcookies.s;
				if(+subcookies.hd > subcookies.s) {
					this.t_fb_approx = parseInt(subcookies.hd, 10);
				}
			}
			else {
				this.t_start = this.t_fb_approx = undefined;
			}
		}
	},

	checkPreRender: function() {
		if(
			!(d.webkitVisibilityState && d.webkitVisibilityState === "prerender")
			&&
			!(d.msVisibilityState && d.msVisibilityState === 3)
		) {
			return false;
		}

		// This means that onload fired through a pre-render.  We'll capture this
		// time, but wait for t_done until after the page has become either visible
		// or hidden (ie, it moved out of the pre-render state)
		// http://code.google.com/chrome/whitepapers/pagevisibility.html
		// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
		// http://code.google.com/chrome/whitepapers/prerender.html

		BOOMR.plugins.RT.startTimer("t_load", this.navigationStart);
		BOOMR.plugins.RT.endTimer("t_load");					// this will measure actual onload time for a prerendered page
		BOOMR.plugins.RT.startTimer("t_prerender", this.navigationStart);
		BOOMR.plugins.RT.startTimer("t_postrender");				// time from prerender to visible or hidden

		BOOMR.subscribe("visibility_changed", BOOMR.plugins.RT.done, null, BOOMR.plugins.RT);

		return true;
	},

	initNavTiming: function() {
		var ti, p, source;

		if(this.navigationStart) {
			return;
		}

		// Get start time from WebTiming API see:
		// https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html
		// http://blogs.msdn.com/b/ie/archive/2010/06/28/measuring-web-page-performance.aspx
		// http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
		p = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;

		if(p && p.navigation) {
			this.navigationType = p.navigation.type;
		}

		if(p && p.timing) {
			ti = p.timing;
		}
		else if(w.chrome && w.chrome.csi && w.chrome.csi().startE) {
			// Older versions of chrome also have a timing API that's sort of documented here:
			// http://ecmanaut.blogspot.com/2010/06/google-bom-feature-ms-since-pageload.html
			// source here:
			// http://src.chromium.org/viewvc/chrome/trunk/src/chrome/renderer/loadtimes_extension_bindings.cc?view=markup
			ti = {
				navigationStart: w.chrome.csi().startE
			};
			source = "csi";
		}
		else if(w.gtbExternal && w.gtbExternal.startE()) {
			// The Google Toolbar exposes navigation start time similar to old versions of chrome
			// This would work for any browser that has the google toolbar installed
			ti = {
				navigationStart: w.gtbExternal.startE()
			};
			source = 'gtb';
		}

		if(ti) {
			// Always use navigationStart since it falls back to fetchStart (not with redirects)
			// If not set, we leave t_start alone so that timers that depend
			// on it don't get sent back.  Never use requestStart since if
			// the first request fails and the browser retries, it will contain
			// the value for the new request.
			BOOMR.addVar("rt.start", source || "navigation");
			this.navigationStart = ti.navigationStart || ti.fetchStart || undefined;
			this.responseStart = ti.responseStart || undefined;

			// bug in Firefox 7 & 8 https://bugzilla.mozilla.org/show_bug.cgi?id=691547
			if(navigator.userAgent.match(/Firefox\/[78]\./)) {
				this.navigationStart = ti.unloadEventStart || ti.fetchStart || undefined;
			}
		}
		else {
			BOOMR.warn("This browser doesn't support the WebTiming API", "rt");
		}

		return;
	},

	page_unload: function(edata) {
		BOOMR.debug("Unload called with " + BOOMR.utils.objectToString(edata), "rt");
		// set cookie for next page
		this.setCookie(edata.type === 'beforeunload'?'ul':'hd');
	},

	onclick: function(etarget) {
		if(!etarget) {
			return;
		}
		BOOMR.debug("Click called with " + etarget.nodeName, "rt");
		while(etarget && etarget.nodeName.toUpperCase() !== "A") {
			etarget = etarget.parentNode;
		}
		if(etarget && etarget.nodeName.toUpperCase() === "A") {
			BOOMR.debug("passing through", "rt");
			// user clicked a link, they may be going to another page
			// if this page is being opened in a different tab, then
			// our unload handler won't fire, so we need to set our
			// cookie on click
			this.setCookie('cl', etarget.href);
		}
	},

	domloaded: function() {
		BOOMR.plugins.RT.endTimer("t_domloaded");
	}
};

BOOMR.plugins.RT = {
	// Methods

	init: function(config) {
		BOOMR.debug("init RT", "rt");
		if(w !== BOOMR.window) {
			w = BOOMR.window;
			d = w.document;
		}

		BOOMR.utils.pluginConfig(impl, config, "RT",
					["cookie", "cookie_exp", "strict_referrer"]);

		impl.initFromCookie();

		// only initialize once.  we still collect config and read from cookie
		// every time init is called, but we set event handlers only once
		if(impl.initialized) {
			return this;
		}

		impl.complete = false;
		impl.timers = {};

		BOOMR.subscribe("page_ready", this.done, null, this);
		BOOMR.subscribe("dom_loaded", impl.domloaded, null, impl);
		BOOMR.subscribe("page_unload", impl.page_unload, null, impl);
		BOOMR.subscribe("click", impl.onclick, null, impl);

		if(BOOMR.t_start) {
			// How long does it take Boomerang to load up and execute (fb to lb)
			this.startTimer('boomerang', BOOMR.t_start);
			this.endTimer('boomerang', BOOMR.t_end);	// t_end === null defaults to current time

			// How long did it take from page request to boomerang fb
			this.endTimer('boomr_fb', BOOMR.t_start);
		}

		// A beacon may be fired automatically on page load or if the page dev fires
		// it manually with their own timers.  It may not always contain a referrer
		// (eg: XHR calls).  We set default values for these cases
		impl.r = impl.r2 = d.referrer.replace(/#.*/, '');

		impl.initialized = true;
		return this;
	},

	startTimer: function(timer_name, time_value) {
		if(timer_name) {
			if (timer_name === 't_page') {
				this.endTimer('t_resp', time_value);
			}
			impl.timers[timer_name] = {start: (typeof time_value === "number" ? time_value : new Date().getTime())};
			impl.complete = false;
		}

		return this;
	},

	endTimer: function(timer_name, time_value) {
		if(timer_name) {
			impl.timers[timer_name] = impl.timers[timer_name] || {};
			if(impl.timers[timer_name].end === undefined) {
				impl.timers[timer_name].end =
						(typeof time_value === "number" ? time_value : new Date().getTime());
			}
		}

		return this;
	},

	setTimer: function(timer_name, time_delta) {
		if(timer_name) {
			impl.timers[timer_name] = { delta: time_delta };
		}

		return this;
	},

	// Called when the page has reached a "usable" state.  This may be when the
	// onload event fires, or it could be at some other moment during/after page
	// load when the page is usable by the user
	done: function() {
		BOOMR.debug("Called done", "rt");
		var t_start, t_done=new Date().getTime(),
		    basic_timers = { t_done: 1, t_resp: 1, t_page: 1},
		    ntimers = 0, t_name, timer, t_other=[];

		impl.complete = false;

		impl.initFromCookie();
		impl.initNavTiming();

		if(impl.checkPreRender()) {
			return this;
		}

		if(impl.responseStart) {
			// Use NavTiming API to figure out resp latency and page time
			// t_resp will use the cookie if available or fallback to NavTiming
			this.endTimer("t_resp", impl.responseStart);
			if(impl.timers.t_load) {
				this.setTimer("t_page", impl.timers.t_load.end - impl.responseStart);
			}
			else {
				this.setTimer("t_page", t_done - impl.responseStart);
			}
		}
		else if(impl.timers.hasOwnProperty('t_page')) {
			// If the dev has already started t_page timer, we can end it now as well
			this.endTimer("t_page");
		}
		else if(impl.t_fb_approx) {
			this.endTimer('t_resp', impl.t_fb_approx);
			this.setTimer("t_page", t_done - impl.t_fb_approx);
		}

		// If a prerender timer was started, we can end it now as well
		if(impl.timers.hasOwnProperty('t_postrender')) {
			this.endTimer("t_postrender");
			this.endTimer("t_prerender");
		}

		if(impl.navigationStart) {
			t_start = impl.navigationStart;
		}
		else if(impl.t_start && impl.navigationType !== 2) {
			t_start = impl.t_start;			// 2 is TYPE_BACK_FORWARD but the constant may not be defined across browsers
			BOOMR.addVar("rt.start", "cookie");	// if the user hit the back button, referrer will match, and cookie will match
		}						// but will have time of previous page start, so t_done will be wrong
		else {
			BOOMR.addVar("rt.start", "none");
			t_start = undefined;			// force all timers to NaN state
		}

		// If the dev has already called endTimer, then this call will do nothing
		// else, it will stop the page load timer
		this.endTimer("t_done", t_done);

		// make sure old variables don't stick around
		BOOMR.removeVar('t_done', 't_page', 't_resp', 'r', 'r2', 'rt.tstart', 'rt.bstart', 'rt.end', 't_postrender', 't_prerender', 't_load');

		BOOMR.addVar('rt.tstart', t_start);
		BOOMR.addVar('rt.bstart', BOOMR.t_start);
		BOOMR.addVar('rt.end', impl.timers.t_done.end);	// don't just use t_done because dev may have called endTimer before we did

		for(t_name in impl.timers) {
			if(impl.timers.hasOwnProperty(t_name)) {
				timer = impl.timers[t_name];

				// if delta is a number, then it was set using setTimer
				// if not, then we have to calculate it using start & end
				if(typeof timer.delta !== "number") {
					if(typeof timer.start !== "number") {
						timer.start = t_start;
					}
					timer.delta = timer.end - timer.start;
				}

				// If the caller did not set a start time, and if there was no start cookie
				// Or if there was no end time for this timer,
				// then timer.delta will be NaN, in which case we discard it.
				if(isNaN(timer.delta)) {
					continue;
				}

				if(basic_timers.hasOwnProperty(t_name)) {
					BOOMR.addVar(t_name, timer.delta);
				}
				else {
					t_other.push(t_name + '|' + timer.delta);
				}
				ntimers++;
			}
		}

		if(ntimers) {
			BOOMR.addVar("r", impl.r);

			if(impl.r2 !== impl.r) {
				BOOMR.addVar("r2", impl.r2);
			}

			if(t_other.length) {
				BOOMR.addVar("t_other", t_other.join(','));
			}
		}

		impl.timers = {};
		impl.complete = true;

		BOOMR.sendBeacon();	// we call sendBeacon() anyway because some other plugin
					// may have blocked waiting for RT to complete
		return this;
	},

	is_complete: function() { return impl.complete; }

};

}(window));

// End of RT plugin


/**
\file domstats.js
Count specific dom nodes for Fasterize like how many images are really loaded?
*/

(function(d) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  function done() {
    complete = true;
  }

  function iscomplete() {
    return complete;
  }

  function count() {
    var tags = [];
    tags.push(('scripts|' + d.getElementsByTagName('script').length));
    tags.push('scriptssrc|' + d.querySelectorAll('script[src]').length);
    tags.push('stylesheets|' + d.querySelectorAll('link[rel=stylesheet]').length);

    // when images are lazyloaded using https://github.com/vvo/lazyload,
    // they have a data-src attribute, which is removed when img has loaded
    var imgsNumber = d.getElementsByTagName('img').length;
    tags.push('imgs|' + imgsNumber);
    tags.push('loadedimgs|' + (imgsNumber - d.querySelectorAll('img[data-frz-src]').length));


    BOOMR.addVar('optimized', !!BOOMR.window.fstrz);
    BOOMR.addVar('domstats', tags.join(','));

    complete = true;
    BOOMR.sendBeacon();
  }

  BOOMR.plugins.Domstats = {
    init: function() {
      // we will not count for IE < 8 http://caniuse.com/queryselector
      if (!d.querySelectorAll) {
        done();
      } else {
        BOOMR.subscribe("page_ready", count);
      }
      return this;
    },

    is_complete: iscomplete
  };

}(document));
/**
\file customer.js
Plugin to capture global variable FRZ_GLOBAL_CUSTOMER_KEY
*/

BOOMR.addVar("cust", BOOMR.window.FRZ_GLOBAL_CUSTOMER_KEY);
/**
\file preload.js
 - look for the preload item in sessionStorage
 - send custom beacon for page preload count
 - set id var for page view count (added to boomerang beacon)
*/

(function(d) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  function done() {
    complete = true;
  }

  function iscomplete() {
    return complete;
  }

  function isSessionStorageSupported() {
    try {
      return 'sessionStorage' in BOOMR.window && BOOMR.window['sessionStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  function countPageView() {
    if (isSessionStorageSupported()) {
      var preloadItem = JSON.parse(sessionStorage.getItem('preload-' + location.href));
      if (preloadItem && preloadItem.status === 'preloaded') {
        BOOMR.addVar('p_id', preloadItem.uuid);
        BOOMR.addVar('p_method', preloadItem.method);
        BOOMR.addVar('p_status', 'view');

        preloadItem.status = 'done';
        sessionStorage.setItem('preload-' + location.href, JSON.stringify(preloadItem));
      }
    }

    complete = true;
    BOOMR.sendBeacon();
  }

  function countPagePreload() {
    if (isSessionStorageSupported()) {
      var preloadItem = JSON.parse(sessionStorage.getItem('preload-' + location.href));
      if (preloadItem && preloadItem.status === 'preloading') {
        // send custom beacon to count page preload
        var img = new Image();
        img.src = BOOMR_GLOBAL_CONFIG.beacon_url + '?p_id=' + preloadItem.uuid +
                        '&p_method=' + preloadItem.method +
                        '&p_status=preload' +
                        '&u=' + location.href +
                        '&r=' + preloadItem.referer +
                        '&cust=' + BOOMR.window.FRZ_GLOBAL_CUSTOMER_KEY;

        preloadItem.status = 'preloaded';
        sessionStorage.setItem('preload-' + location.href, JSON.stringify(preloadItem));
      }
    }
  }

  BOOMR.plugins.Preload = {
    init: function() {
      // we will not count for IE < 8 http://caniuse.com/queryselector
      if (!d.querySelectorAll) {
        done();
      } else {
        countPagePreload();
        BOOMR.subscribe("page_ready", countPageView);
      }
      return this;
    },

    is_complete: iscomplete
  };

}(document));
/**
\file jserrors.js
Count js errors for current page
*/

(function(w) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete, jserrors = 0;

  function done() {
    BOOMR.addVar('jserrors', jserrors);
    complete = true;
    BOOMR.sendBeacon();
  }

  function iscomplete() {
    return complete;
  }

  function newError() {
    jserrors++;
  }

  BOOMR.plugins.JsErrors = {
    init: function() {
      BOOMR.utils.addListener(window, 'error', newError);
      BOOMR.subscribe("page_ready", done);

      return this;
    },

    is_complete: iscomplete
  };

}(BOOMR.window));
/**
\file ttfc.js
Measure time to first clic metric.
Answers: When does a user tries to interact with the page?
Can give insight on when does a user considers a page ready enough to interact with
It needs a global BOOMR_lstart = new Date().getTime(); in the calling page
Metric will be sent for every new page loaded.
*/

(function(w, d) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var
    complete,
    name = 't_ttfc';

  function done() {
    complete = true;
    BOOMR.sendBeacon();
  }

  function iscomplete() {
    return complete;
  }

  function clicked() {
    BOOMR.utils.setCookie(name, {value: new Date().getTime() - w.BOOMR_lstart});
    BOOMR.utils.removeListener(d, 'mousedown', clicked);
  }

  BOOMR.plugins.TTFC = {
    init: function() {
      var ttfc = BOOMR.utils.getCookie(name);
      if (ttfc) {
        ttfc = BOOMR.utils.getSubCookies(ttfc);
      } else {
        ttfc = {value: 0};
      }

      // cookie set? we can now store it to be sent
      if (ttfc.value) {
        BOOMR.plugins.RT.setTimer(name, parseInt(ttfc.value));
        BOOMR.utils.removeCookie(name);
      }

      if (w.BOOMR_lstart) {
        BOOMR.utils.addListener(d, 'mousedown', clicked);
      }

      done();
      return this;
    },

    is_complete: iscomplete
  };

}(this, document));
/**
\file support_legacy_browser.js
Send the variable t_page for browsers that don't support navtiming.
*/

(function(w, d) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  function iscomplete() {
    return true;
  }

  BOOMR.plugins.Legacy = {
    init: function() {
      BOOMR.plugins.RT.startTimer('t_page', w.BOOMR_lstart);
      BOOMR.sendBeacon();
      return this;
    },

    is_complete: iscomplete
  };

}(this, document));
/*This plugin can be used as an immediate init plugin when you are loading
boomerang asynchronously: */

var config;
if (BOOMR.window.boomr_beacon_url) {
  config = {
    beacon_url: BOOMR.window.boomr_beacon_url
  };
} else if (BOOMR.window.BOOMR_GLOBAL_CONFIG) {
  config = BOOMR.window.BOOMR_GLOBAL_CONFIG;
}

if (config !== undefined) {
  BOOMR.init(config);
}
BOOMR.t_end = new Date().getTime();

/*jslint continue: true, plusplus: true, regexp: true, unparam: true, sloppy: true, white: true, browser: true, devel: true */
/*properties BOOMR, BOOMR_lstart, BOOMR_start, BOOMR_configt*/

