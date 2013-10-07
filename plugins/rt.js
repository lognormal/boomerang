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
	onloadfired: false,	//! Set when the page_ready event fires
				//  Use this to determine if unload fires before onload
	unloadfired: false,	//! Set when the first unload event fires
				//  Use this to make sure we don't beacon twice for beforeunload and unload
	visiblefired: false,	//! Set when page becomes visible (Chrome/IE)
				//  Use this to determine if user bailed without opening the tab
	initialized: false,	//! Set when init has completed to prevent double initialization
	complete: false,	//! Set when this plugin has completed

	timers: {},		//! Custom timers that the developer can use
				// Format for each timer is { start: XXX, end: YYY, delta: YYY-XXX }
	cookie: 'RT',		//! Name of the cookie that stores the start time and referrer
	cookie_exp:60*60*24*7,	//! Cookie expiry in seconds (7 days)
	session_exp:60*30,	//! Session expiry in seconds (30 minutes)
	strict_referrer: true,	//! By default, don't beacon if referrers don't match.
				// If set to false, beacon both referrer values and let
				// the back end decide

	navigationType: 0,
	navigationStart: undefined,
	responseStart: undefined,
	loadTime: 0,
	oboError: 0,
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
		if(how === "ul" || how === "hd") {
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

		subcookies.dm = BOOMR.session.domain;
		subcookies.si = BOOMR.session.ID;
		subcookies.ss = BOOMR.session.start;
		subcookies.sl = BOOMR.session.length;
		subcookies.tt = this.loadTime;
		subcookies.obo = this.oboError;
		t_start = new Date().getTime();

		if(how) {
			subcookies[how] = t_start;
		}

		BOOMR.debug("Setting cookie (how=" + how + ")\n" + BOOMR.utils.objectToString(subcookies), "rt");
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

	initFromCookie: function(update_start) {
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
		if(update_start && subcookies.s && (subcookies.r || subcookies.nu)) {
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
		}
		if(subcookies.s) {
			this.lastActionTime = subcookies.s;
		}
		if(subcookies.ss) {
			BOOMR.session.start = parseInt(subcookies.ss, 10);
		}
		if((!BOOMR.session.ID || !BOOMR.session.ID.match(/-/)) && subcookies.si) {
			BOOMR.session.ID = subcookies.si;
			BOOMR.addVar('rt.si', BOOMR.session.ID + '-' + Math.round(BOOMR.session.start/1000).toString(36));
		}
		if(subcookies.sl) {
			BOOMR.session.length = parseInt(subcookies.sl, 10);
		}
		if(subcookies.tt && subcookies.tt.match(/\d/)) {
			this.loadTime = parseInt(subcookies.tt, 10);
		}
		if(subcookies.obo) {
			this.oboError = parseInt(subcookies.obo, 10)||0;
		}
		if(subcookies.dm && !BOOMR.session.domain) {
			BOOMR.session.domain = subcookies.dm;
		}

	},

	page_ready: function() {
		// we need onloadfired because it's possible to reset "impl.complete"
		// if you're measuring multiple xhr loads, but not possible to reset
		// impl.onloadfired
		this.onloadfired = true;
	},

	visibility_changed: function() {
		// we care if the page became visible at some point
		if(!(d.hidden || d.msHidden || d.webkitHidden)) {
			impl.visiblefired = true;
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

		BOOMR.subscribe("visibility_changed", BOOMR.plugins.RT.done, "visible", BOOMR.plugins.RT);

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
		BOOMR.debug("Unload called with " + BOOMR.utils.objectToString(edata) + " when unloadfired = " + this.unloadfired, "rt");
		if(!this.unloadfired) {
			// run done on abort or on page_unload to measure session length
			BOOMR.plugins.RT.done(edata, "unload");
		}

		// set cookie for next page
		this.setCookie(edata.type === 'beforeunload'?'ul':'hd');

		this.unloadfired = true;
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
			this.initFromCookie(false);
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
					["cookie", "cookie_exp", "session_exp", "strict_referrer"]);

		impl.initFromCookie(true);
		if(!BOOMR.session.start) {
			BOOMR.session.start = BOOMR.t_lstart || BOOMR.t_start;
		}
		impl.setCookie(null, false);

		// only initialize once.  we still collect config and check/set cookies
		// every time init is called, but we attach event handlers only once
		if(impl.initialized) {
			return this;
		}

		impl.complete = false;
		impl.timers = {};

		BOOMR.subscribe("page_ready", impl.page_ready, null, impl);
		impl.visiblefired = !(d.hidden || d.msHidden || d.webkitHidden);
		if(!impl.visiblefired) {
			BOOMR.subscribe("visibility_changed", impl.visibility_changed, null, impl);
		}
		BOOMR.subscribe("page_ready", this.done, "load", this);
		BOOMR.subscribe("xhr_load", this.done, "xhr", this);
		BOOMR.subscribe("dom_loaded", impl.domloaded, null, impl);
		BOOMR.subscribe("page_unload", impl.page_unload, null, impl);
		BOOMR.subscribe("click", impl.onclick, null, impl);


		if(BOOMR.t_start) {
			// How long does it take Boomerang to load up and execute (fb to lb)
			this.startTimer('boomerang', BOOMR.t_start);
			this.endTimer('boomerang', BOOMR.t_end);	// t_end === null defaults to current time

			// How long did it take from page request to boomerang fb
			this.endTimer('boomr_fb', BOOMR.t_start);

			if(BOOMR.t_lstart) {
				// when did boomerang show up on the page
				this.endTimer('boomr_ld', BOOMR.t_lstart);
				// what was the network latency for boomerang
				this.setTimer('boomr_lat', BOOMR.t_start - BOOMR.t_lstart);
			}
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
	done: function(edata, ename) {
		BOOMR.debug("Called done with " + BOOMR.utils.objectToString(edata) + ", " + ename, "rt");
		var t_start, t_done=new Date().getTime(),
		    basic_timers = { t_done: 1, t_resp: 1, t_page: 1},
		    ntimers = 0, t_name, timer, t_other=[];

		impl.complete = false;

		if(ename==="load" || ename==="visible") {
			impl.initNavTiming();

			if(impl.checkPreRender()) {
				return this;
			}

			if(impl.responseStart) {
				// Use NavTiming API to figure out resp latency and page time
				// t_resp will use the cookie if available or fallback to NavTiming
				this.endTimer("t_resp", impl.responseStart);
				if(impl.timers.t_load) {	// t_load is the actual time load completed if using prerender
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
		}

		if(ename==="xhr" && edata.name && impl.timers[edata.name]) {
			t_start = impl.timers[edata.name].start;
			BOOMR.addVar("rt.start", "manual");
		}
		else if(impl.navigationStart) {
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

		BOOMR.debug("Got start time: " + t_start);

		impl.initFromCookie(false);

		// if session hasn't started yet, or if it's been more than thirty minutes since the last beacon,
		// reset the session (note 30 minutes is an industry standard limit on idle time for session expiry)
		if((t_start && BOOMR.session.start > t_start) || t_done - (impl.lastActionTime || BOOMR.t_start) > impl.session_exp*1000) {
			BOOMR.session.start = t_start || BOOMR.t_lstart || BOOMR.t_start;
			BOOMR.session.length = 0;
			impl.loadTime = 0;
			impl.oboError = 0;
		}

		// If the dev has already called endTimer, then this call will do nothing
		// else, it will stop the page load timer
		this.endTimer("t_done", t_done);

		// make sure old variables don't stick around
		BOOMR.removeVar('t_done', 't_page', 't_resp', 'r', 'r2', 'rt.tstart', 'rt.bstart', 'rt.end', 'rt.abld', 'rt.ss', 'rt.sl', 'rt.tt', 'rt.lt', 't_postrender', 't_prerender', 't_load');

		BOOMR.addVar('rt.tstart', t_start);
		BOOMR.addVar('rt.bstart', BOOMR.t_start);
		BOOMR.addVar('rt.end', impl.timers.t_done.end);	// don't just use t_done because dev may have called endTimer before we did

		if(impl.timers.t_configfb && typeof impl.timers.t_configfb.start !== 'number') {
			if(impl.timers.t_configjs && typeof impl.timers.t_configjs.start === 'number') {
				impl.timers.t_configfb.start = impl.timers.t_configjs.start;
			}
			else {
				delete impl.timers.t_configfb;
			}
		}

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
			if(ename !== "xhr") {
				BOOMR.addVar("r", impl.r);

				if(impl.r2 !== impl.r) {
					BOOMR.addVar("r2", impl.r2);
				}
			}

			if(t_other.length) {
				BOOMR.addVar("t_other", t_other.join(','));
			}
		}

		// we're either in onload, or onunload fired before onload
		if(ename === 'load' || ename === 'xhr' || !impl.onloadfired) {
			BOOMR.session.length++;
			if(isNaN(impl.timers.t_done.delta)) {
				impl.oboError++;
			}
			else {
				impl.loadTime += impl.timers.t_done.delta;
			}
		}

		BOOMR.addVar({
			'rt.si': BOOMR.session.ID,
			'rt.ss': BOOMR.session.start,
			'rt.sl': BOOMR.session.length,
			'rt.tt': impl.loadTime,
			'rt.obo': impl.oboError
		});

		impl.setCookie();

		if(ename==='unload') {
			BOOMR.addVar('rt.quit', '');

			if(!impl.onloadfired) {
				BOOMR.addVar('rt.abld', '');
			}

			if(!impl.visiblefired) {
				BOOMR.addVar('rt.ntvu', '');
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


