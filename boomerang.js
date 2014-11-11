/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyright (c) 2014, SOASTA, Inc. All rights reserved.
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

/*eslint-env browser*/
/*global BOOMR:true, BOOMR_start:true, BOOMR_lstart:true, console:false*/
/*eslint no-mixed-spaces-and-tabs:[2, true], console:0, camelcase:0, strict:0, quotes:[2, "double", "avoid-escape"], new-cap:0*/
/*eslint space-infix-ops:0, no-console:0, no-delete-var:0, no-space-before-semi:0*/

// Measure the time the script started
// This has to be global so that we don't wait for the entire
// BOOMR function to download and execute before measuring the
// time.  We also declare it without `var` so that we can later
// `delete` it.  This is the only way that works on Internet Explorer
BOOMR_start = new Date().getTime();

/**
 Check the value of document.domain and fix it if incorrect.
 This function is run at the top of boomerang, and then whenever
 init() is called.  If boomerang is running within an iframe, this
 function checks to see if it can access elements in the parent
 iframe.  If not, it will fudge around with document.domain until
 it finds a value that works.

 This allows customers to change the value of document.domain at
 any point within their page's load process, and we will adapt to
 it.
 */
function BOOMR_check_doc_domain(domain) {
	/*eslint no-unused-vars:0*/
	var test;

	// If domain is not passed in, then this is a global call
	// domain is only passed in if we call ourselves, so we
	// skip the frame check at that point
	if(!domain) {
		// If we're running in the main window, then we don't need this
		if(window.parent === window || !document.getElementById("boomr-if-as")) {
			return;// true;	// nothing to do
		}

		domain = document.domain;
	}

	if(domain.indexOf(".") === -1) {
		return;// false;	// not okay, but we did our best
	}

	// 1. Test without setting document.domain
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 2. Test with document.domain
	catch(err) {
		document.domain = domain;
	}
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 3. Strip off leading part and try again
	catch(err) {
		domain = domain.replace(/^[\w\-]+\./, "");
	}

	BOOMR_check_doc_domain(domain);
}

BOOMR_check_doc_domain();


// beaconing section
// the parameter is the window
(function(w) {

var impl, boomr, d, myurl, createCustomEvent, dispatchEvent;

// This is the only block where we use document without the w. qualifier
if(w.parent !== w
		&& document.getElementById("boomr-if-as")
		&& document.getElementById("boomr-if-as").nodeName.toLowerCase() === "script") {
	w = w.parent;
	myurl = document.getElementById("boomr-if-as").src;
}

d = w.document;

// Short namespace because I don't want to keep typing BOOMERANG
if(!w.BOOMR) { w.BOOMR = {}; }
BOOMR = w.BOOMR;
// don't allow this code to be included twice
if(BOOMR.version) {
	return;
}

BOOMR.version = "0.9";
BOOMR.window = w;

if (!BOOMR.plugins) { BOOMR.plugins = {}; }

// CustomEvent proxy for IE9 & 10 from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
(function() {
	try {
		if (new w.CustomEvent("CustomEvent") !== undefined) {
			createCustomEvent = function (e_name, params) {
				return new w.CustomEvent(e_name, params);
			};
		}
	}
	catch(ignore) {
	}

	try {
		if (!createCustomEvent && d.createEvent && d.createEvent( "CustomEvent" )) {
			createCustomEvent = function (e_name, params) {
				var evt = d.createEvent( "CustomEvent" );
				params = params || { cancelable: false, bubbles: false };
				evt.initCustomEvent( e_name, params.bubbles, params.cancelable, params.detail );

				return evt;
			};
		}
	}
	catch(ignore) {
	}

	if (!createCustomEvent && d.createEventObject) {
		createCustomEvent = function (e_name, params) {
			var evt = d.createEventObject();
			evt.type = evt.propertyName = e_name;
			evt.detail = params.detail;

			return evt;
		};
	}

	if(!createCustomEvent) {
		createCustomEvent = function() { return undefined; };
	}
}());

dispatchEvent = function(e_name, e_data) {
	var ev = createCustomEvent(e_name, {"detail": e_data});
	if (!ev) {
		return;
	}

	BOOMR.setImmediate(function() {
		if(d.dispatchEvent) {
			d.dispatchEvent(ev);
		}
		else if(d.fireEvent) {
			d.fireEvent("onpropertychange", ev);
		}
	});
};

// impl is a private object not reachable from outside the BOOMR object
// users can set properties by passing in to the init() method
impl = {
	// properties
	beacon_url: location.protocol + "//%beacon_dest_host%%beacon_dest_path%",
	//! User's ip address determined on the server.  Used for the BA cookie
	user_ip: "",

	//! strip_query_string: false,

	//! onloadfired: false,

	//! handlers_attached: false,
	events: {
		"page_ready": [],
		"page_unload": [],
		"dom_loaded": [],
		"visibility_changed": [],
		"before_beacon": [],
		"onbeacon": [],
		"xhr_load": [],
		"click": [],
		"form_submit": []
	},

	public_events: {
		"before_beacon": "onBeforeBoomerangBeacon",
		"onbeacon": "onBoomerangBeacon",
		"onboomerangloaded": "onBoomerangLoaded"
	},

	vars: {},

	errors: {},

	disabled_plugins: {},

	xb_handler: function(type) {
		return function(ev) {
			var target;
			if (!ev) { ev = w.event; }
			if (ev.target) { target = ev.target; }
			else if (ev.srcElement) { target = ev.srcElement; }
			if (target.nodeType === 3) {// defeat Safari bug
				target = target.parentNode;
			}

			// don't capture events on flash objects
			// because of context slowdowns in PepperFlash
			if(target && target.nodeName.toUpperCase() === "OBJECT" && target.type === "application/x-shockwave-flash") {
				return;
			}
			impl.fireEvent(type, target);
		};
	},

	fireEvent: function(e_name, data) {
		var i, handler, handlers;

		e_name = e_name.toLowerCase();

		if(!this.events.hasOwnProperty(e_name)) {
			return;// false;
		}

		if (this.public_events.hasOwnProperty(e_name)) {
			dispatchEvent(this.public_events[e_name], data);
		}

		handlers = this.events[e_name];

		for(i=0; i<handlers.length; i++) {
			try {
				handler = handlers[i];
				handler.fn.call(handler.scope, data, handler.cb_data);
			}
			catch(err) {
				BOOMR.addError(err, "fireEvent." + e_name);
			}
		}

		return;// true;
	}
};


// We create a boomr object and then copy all its properties to BOOMR so that
// we don't overwrite anything additional that was added to BOOMR before this
// was called... for example, a plugin.
boomr = {
	//! t_lstart: value of BOOMR_lstart set in host page
	t_start: BOOMR_start,
	//! t_end: value set in zzz_last_plugin.js

	url: myurl,
	config_url: null,

	session: {
		// You can disable all cookies by setting site_domain to a falsy value
		domain: null,
		ID: Math.random().toString(36).replace(/^0\./, ""),
		start: undefined,
		length: 0
	},

	// Utility functions
	utils: {
		objectToString: function(o, separator, nest_level) {
			var value = [], k;

			if(!o || typeof o !== "object") {
				return o;
			}
			if(separator === undefined) {
				separator="\n\t";
			}
			if(!nest_level) {
				nest_level=0;
			}

			if (Object.prototype.toString.call(o) === "[object Array]") {
				for(k=0; k<o.length; k++) {
					if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
						value.push(
							this.objectToString(
								o[k],
								separator + (separator === "\n\t" ? "\t" : ""),
								nest_level-1
							)
						);
					}
					else {
						if (separator === "&") {
							value.push(encodeURIComponent(o[k]));
						}
						else {
							value.push(o[k]);
						}
					}
				}
				separator = ",";
			}
			else {
				for(k in o) {
					if(Object.prototype.hasOwnProperty.call(o, k)) {
						if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
							value.push(encodeURIComponent(k) + "=" +
								this.objectToString(
									o[k],
									separator + (separator === "\n\t" ? "\t" : ""),
									nest_level-1
								)
							);
						}
						else {
							if (separator === "&") {
								value.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k]));
							}
							else {
								value.push(k + "=" + o[k]);
							}
						}
					}
				}
			}

			return value.join(separator);
		},

		getCookie: function(name) {
			if(!name) {
				return null;
			}

			name = " " + name + "=";

			var i, cookies;
			cookies = " " + d.cookie + ";";
			if ( (i=cookies.indexOf(name)) >= 0 ) {
				i += name.length;
				cookies = cookies.substring(i, cookies.indexOf(";", i));
				return cookies;
			}
		},

		setCookie: function(name, subcookies, max_age) {
			var value, nameval, savedval, c, exp;

			if(!name || !BOOMR.session.domain) {
				BOOMR.debug("No cookie name or site domain: " + name + "/" + BOOMR.session.domain);
				return null;
			}

			value = this.objectToString(subcookies, "&");
			nameval = name + "=" + value;

			c = [nameval, "path=/", "domain=" + BOOMR.session.domain];
			if(max_age) {
				exp = new Date();
				exp.setTime(exp.getTime() + max_age*1000);
				exp = exp.toGMTString();
				c.push("expires=" + exp);
			}

			if ( nameval.length < 500 ) {
				d.cookie = c.join("; ");
				// confirm cookie was set (could be blocked by user's settings, etc.)
				savedval = this.getCookie(name);
				if(value === savedval) {
					return true;
				}
				BOOMR.warn("Saved cookie value doesn't match what we tried to set:\n" + value + "\n" + savedval);
			}
			else {
				BOOMR.warn("Cookie too long: " + nameval.length + " " + nameval);
			}

			return false;
		},

		getSubCookies: function(cookie) {
			var cookies_a,
			    i, l, kv,
			    gotcookies=false,
			    cookies={};

			if(!cookie) {
				return null;
			}

			if(typeof cookie !== "string") {
				BOOMR.debug("TypeError: cookie is not a string: " + typeof cookie);
				return null;
			}

			cookies_a = cookie.split("&");

			for(i=0, l=cookies_a.length; i<l; i++) {
				kv = cookies_a[i].split("=");
				if(kv[0]) {
					kv.push("");	// just in case there's no value
					cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
					gotcookies=true;
				}
			}

			return gotcookies ? cookies : null;
		},

		removeCookie: function(name) {
			return this.setCookie(name, {}, -86400);
		},

		cleanupURL: function(url) {
			if (!url) {
				return "";
			}
			if(impl.strip_query_string) {
				return url.replace(/\?.*/, "?qs-redacted");
			}
			return url;
		},

		hashQueryString: function(url, stripHash) {
			if(!url) {
				return url;
			}
			if(url.match(/^\/\//)) {
				url = location.protocol + url;
			}
			if(!url.match(/^(https?|file):/)) {
				BOOMR.error("Passed in URL is invalid: " + url);
				return "";
			}
			if(stripHash) {
				url = url.replace(/#.*/, "");
			}
			if(!BOOMR.utils.MD5) {
				return url;
			}
			return url.replace(/\?([^#]*)/, function(m0, m1) { return "?" + (m1.length > 10 ? BOOMR.utils.MD5(m1) : m1); });
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
			} else if (el.attachEvent) {
				el.attachEvent( "on" + type, fn );
			}
		},

		removeListener: function (el, type, fn) {
			if (el.removeEventListener) {
				el.removeEventListener(type, fn, false);
			} else if (el.detachEvent) {
				el.detachEvent("on" + type, fn);
			}
		}
	},

	init: function(config) {
		var i, k,
		    properties = ["beacon_url", "user_ip", "strip_query_string", "secondary_beacons"];

		BOOMR_check_doc_domain();

		if(!config) {
			config = {};
		}

		if(config.primary && impl.handlers_attached) {
			return this;
		}

		for(i=0; i<properties.length; i++) {
			if(config[properties[i]] !== undefined) {
				impl[properties[i]] = config[properties[i]];
			}
		}

		if(config.site_domain !== undefined) {
			this.session.domain = config.site_domain;
		}

		if(config.instrument_xhr) {
			BOOMR.instrumentXHR();
		}
		else if (config.instrument_xhr === false) {
			BOOMR.uninstrumentXHR();
		}

		if(config.log !== undefined) {
			this.log = config.log;
		}
		if(!this.log) {
			this.log = function(/* m,l,s */) {};
		}

		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				// config[plugin].enabled has been set to false
				if( config[k]
					&& config[k].hasOwnProperty("enabled")
					&& config[k].enabled === false
				) {
					impl.disabled_plugins[k] = 1;
					continue;
				}

				// plugin was previously disabled but is now enabled
				if(impl.disabled_plugins[k]) {
					delete impl.disabled_plugins[k];
				}

				// plugin exists and has an init method
				if(typeof this.plugins[k].init === "function") {
					try {
						this.plugins[k].init(config);
					}
					catch(err) {
						BOOMR.addError(err, k + ".init");
					}
				}
			}
		}

		if(impl.handlers_attached) {
			return this;
		}

		// The developer can override onload by setting autorun to false
		if(!impl.onloadfired && (config.autorun === undefined || config.autorun !== false)) {
			if(d.readyState && d.readyState === "complete") {
				BOOMR.loadedLate = true;
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
			var fire_visible, forms, iterator;
			// visibilitychange is useful to detect if the page loaded through prerender
			// or if the page never became visible
			// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
			// http://www.nczonline.net/blog/2011/08/09/introduction-to-the-page-visibility-api/
			fire_visible = function() { impl.fireEvent("visibility_changed"); };
			if(d.webkitVisibilityState) {
				boomr.utils.addListener(d, "webkitvisibilitychange", fire_visible);
			}
			else if(d.msVisibilityState) {
				boomr.utils.addListener(d, "msvisibilitychange", fire_visible);
			}
			else if(d.visibilityState) {
				boomr.utils.addListener(d, "visibilitychange", fire_visible);
			}

			boomr.utils.addListener(d, "mouseup", impl.xb_handler("click"));

			forms = d.getElementsByTagName("form");
			for(iterator = 0; iterator < forms.length; iterator++) {
				boomr.utils.addListener(forms[iterator], "submit", impl.xb_handler("form_submit"));
			}

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
	page_ready: function(ev) {
		if (!ev) { ev = w.event; }
		if (!ev) { ev = { name: "load" }; }
		if(impl.onloadfired) {
			return this;
		}
		impl.fireEvent("page_ready", ev);
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
		var i, handler, ev, unload_handler;

		e_name = e_name.toLowerCase();

		if(!impl.events.hasOwnProperty(e_name)) {
			return this;
		}

		ev = impl.events[e_name];

		// don't allow a handler to be attached more than once to the same event
		for(i=0; i<ev.length; i++) {
			handler = ev[i];
			if(handler.fn === fn && handler.cb_data === cb_data && handler.scope === cb_scope) {
				return this;
			}
		}
		ev.push({ "fn": fn, "cb_data": cb_data || {}, "scope": cb_scope || null });

		// attaching to page_ready after onload fires, so call soon
		if(e_name === "page_ready" && impl.onloadfired) {
			this.setImmediate(fn, null, cb_data, cb_scope);
		}

		// Attach unload handlers directly to the window.onunload and
		// window.onbeforeunload events. The first of the two to fire will clear
		// fn so that the second doesn't fire. We do this because technically
		// onbeforeunload is the right event to fire, but all browsers don't
		// support it.  This allows us to fall back to onunload when onbeforeunload
		// isn't implemented
		if(e_name === "page_unload") {
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

	addError: function(err, src) {
		if (typeof err !== "string") {
			err = String(err);
		}
		if (src !== undefined) {
			err = "[" + src + ":" + (new Date().getTime()) + "] " + err;
		}

		if (impl.errors[err]) {
			impl.errors[err]++;
		}
		else {
			impl.errors[err] = 1;
		}
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

	requestStart: function(name) {
		var t_start = new Date().getTime();
		BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);

		return {
			loaded: function(data) {
				BOOMR.responseEnd(name, t_start, data);
			}
		};
	},

	responseEnd: function(name, t_start, data) {
		if(impl.vars["h.cr"]) {
			BOOMR.addVar("xhr.pg", name);
			BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);
			impl.fireEvent("xhr_load", {
				"name": "xhr_" + name,
				"data": data
			});
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

	/**
	 * Undo XMLHttpRequest instrumentation and reset the original
	 */
	uninstrumentXHR: function() {
		if (BOOMR.XMLHttpRequest && BOOMR.XMLHttpRequest !== BOOMR.window.XMLHttpRequest) {
			BOOMR.window.XMLHttpRequest = BOOMR.XMLHttpRequest;
		}
	},
	/**
	 * Instrument all requests made via XMLHttpRequest to send beacons
	 */
	instrumentXHR: function() {
		var proxy_XMLHttpRequest,
		    orig_XMLHttpRequest = BOOMR.window.XMLHttpRequest,
		    readyStateMap;

		if (!orig_XMLHttpRequest) {
			// Nothing to instrument
			return;
		}

		BOOMR.XMLHttpRequest = orig_XMLHttpRequest;

		readyStateMap = [ "uninitialized", "open", "responseStart", "domInteractive", "responseEnd" ];

		// We could also inherit from window.XMLHttpRequest, but for this implementation,
		// we'll use composition
		proxy_XMLHttpRequest = function() {
			var req, resource = { timing: {} }, orig_open, orig_send;

			req = new orig_XMLHttpRequest();

			orig_open = req.open;
			orig_send = req.send;

			req.open = function(method, url, async) {
				if (async) {
					req.addEventListener("readystatechange", function() {
						resource.timing[readyStateMap[req.readyState]] = new Date().getTime();
					}, false);
				}

				req.addEventListener("load", function() {
					resource.timing.loadEventEnd = new Date().getTime();
					resource.status = req.status;
					// TODO add response headers
				}, false);
				req.addEventListener("timeout", function() {
					resource.timing.loadEventEnd = new Date().getTime();
					resource.status = 10503;
				}, false);
				req.addEventListener("error", function() {
					resource.timing.loadEventEnd = new Date().getTime();
					resource.status = 10500;
				}, false);
				req.addEventListener("abort", function() {
					resource.timing.loadEventEnd = new Date().getTime();
					resource.status = 10501;
				}, false);

				req.addEventListener("loadend", function() {
					impl.fireEvent("xhr_load", resource);
				}, false);

				resource.url = url;
				resource.method = method;

				// call the original open method
				return orig_open.apply(req, arguments);
			};

			req.send = function() {
				resource.timing.requestStart = new Date().getTime();

				// call the original send method
				return orig_send.apply(req, arguments);
			};

			req.resource = resource;

			return req;
		};

		BOOMR.window.XMLHttpRequest = proxy_XMLHttpRequest;
	},

	sendBeacon: function(beacon_url_override) {
		var k, url, furl, img, nparams=0, errors=[];

		// This plugin wants the beacon to go somewhere else,
		// so update the location
		if(beacon_url_override) {
			impl.beacon_url = beacon_url_override;
		}

		BOOMR.debug("Checking if we can send beacon");

		// At this point someone is ready to send the beacon.  We send
		// the beacon only if all plugins have finished doing what they
		// wanted to do
		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				if(impl.disabled_plugins[k]) {
					continue;
				}
				if(!this.plugins[k].is_complete()) {
					BOOMR.debug("Plugin " + k + " is not complete, deferring beacon send");
					return false;
				}
			}
		}

		// use d.URL instead of location.href because of a safari bug
		if(!impl.vars.u) {
			impl.vars.u = BOOMR.utils.cleanupURL(d.URL.replace(/#.*/, ""));
		}
		impl.vars.v = BOOMR.version;

		impl.vars["rt.si"] = BOOMR.session.ID + "-" + Math.round(BOOMR.session.start/1000).toString(36);
		impl.vars["rt.ss"] = BOOMR.session.start;
		impl.vars["rt.sl"] = BOOMR.session.length;

		if(w !== window) {
			impl.vars["if"] = "";
		}

		for (k in impl.errors) {
			if (impl.errors.hasOwnProperty(k)) {
				errors.push(k + (impl.errors[k] > 1 ? " (*" + impl.errors[k] + ")" : ""));
			}
		}

		if(errors.length > 0) {
			impl.vars.errors = errors.join("\n");
		}

		impl.errors = {};

		// If we reach here, all plugins have completed
		impl.fireEvent("before_beacon", impl.vars);

		// Don't send a beacon if no beacon_url has been set
		// you would do this if you want to do some fancy beacon handling
		// in the `before_beacon` event instead of a simple GET request
		BOOMR.debug("Ready to send beacon: " + BOOMR.utils.objectToString(impl.vars));
		if(!impl.beacon_url) {
			BOOMR.debug("No beacon URL, so skipping.");
			return true;
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
						? ""
						: encodeURIComponent(impl.vars[k])
					)
				);
			}
		}
		BOOMR.removeVar("qt");

		furl = impl.beacon_url + ((impl.beacon_url.indexOf("?") > -1)?"&":"?") + url.join("&");

		// If we reach here, we've transferred all vars to the beacon URL.
		// The only thing that can stop it now is if we're rate limited
		impl.fireEvent("onbeacon", impl.vars);

		// Stop at this point if we are rate limited
		if(BOOMR.session.rate_limited) {
			BOOMR.debug("Skipping because we're rate limited");
			return this;
		}

		// only send beacon if we actually have something to beacon back
		if(nparams) {
			img = new Image();
			img.src=furl;
		}

		if (impl.secondary_beacons) {
			for(k = 0; k<impl.secondary_beacons.length; k++) {
				furl = impl.secondary_beacons[k] + "?" + url.join("&");
				img = new Image();
				img.src=furl;
			}
		}

		return true;
	}

};

delete BOOMR_start;

if(typeof BOOMR_lstart === "number") {
	boomr.t_lstart = BOOMR_lstart;
	delete BOOMR_lstart;
}
else if(typeof BOOMR.window.BOOMR_lstart === "number") {
	boomr.t_lstart = BOOMR.window.BOOMR_lstart;
}

(function() {
	var make_logger;

	if(typeof console === "object" && console.log !== undefined) {
		boomr.log = function(m,l,s) { console.log(s + ": [" + l + "] " + m); };
	}

	make_logger = function(l) {
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



(function() {
var ident;
for(ident in boomr) {
	if(boomr.hasOwnProperty(ident)) {
		BOOMR[ident] = boomr[ident];
	}
}
}());

BOOMR.plugins = BOOMR.plugins || {};

dispatchEvent("onBoomerangLoaded", { "BOOMR": BOOMR } );

}(window));

// end of boomerang beaconing section
