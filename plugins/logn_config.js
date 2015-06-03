/*global BOOMR_configt:true*/
(function(w) {
	var dc=document,
	    s="script",
	    dom=w.location.hostname,
	    complete, running,
	    t_start,
	    load, loaded,
	    autorun=true;

	// Don't even bother creating the plugin if this is mhtml
	if (BOOMR.plugins.LOGN || !dom || dom === "localhost" || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//)) {
		return;
	}

	running = complete = false;

	loaded=function() {
		if (complete) {
			return;
		}
		complete = true;
		running = false;

		if (autorun) {
			BOOMR.sendBeacon();
		}
	};

	load=function() {
		var s0=dc.getElementsByTagName(s)[0],
		    s1=dc.createElement(s),
		    bcn=BOOMR.getBeaconURL ? BOOMR.getBeaconURL() : "",
		    plugins = [],
		    pluginName;

		for (pluginName in BOOMR.plugins) {
			if (BOOMR.plugins.hasOwnProperty(pluginName)) {
				plugins.push(encodeURIComponent(pluginName));
			}
		}

		t_start=BOOMR.now();
		s1.src="//%config_host%%config_path%?key=%client_apikey%%config_url_suffix%&d=" + encodeURIComponent(dom)
			+ "&t=" + Math.round(t_start/(5*60*1000))	// add time field at 5 minute resolution so that we force a cache bust if the browser's being nasty
			+ "&v=" + BOOMR.version				// boomerang version so we can force a reload for old versions
			+ (w === window?"":"&if=")			// if this is running in an iframe, we need to look for config vars in parent window
			+ "&sl=" + (BOOMR.session.length>0?1:0)		// is this a new session (0) or existing session (1).  New sessions may be rate limited
									// We don't pass the actual session length so that the URL response can be cached
			+ "&si=" + BOOMR.session.ID + "-" + Math.round(BOOMR.session.start/1000).toString(36)
			+ (complete?"&r=":"")				// if this is running after complete, then we're just refreshing the crumb
			+ (bcn?"&bcn=" + encodeURIComponent(bcn) : "")	// Pass in the expected beacon URL so server can check if it has gone dead
			+ (complete?"":"&plugins=" + plugins.join(","));

		BOOMR.config_url = s1.src;

		s0.parentNode.insertBefore(s1, s0);
		s0=s1=null;

		if (complete) {
			setTimeout(load, 5.5*60*1000);
		}
	};

	BOOMR.plugins.LOGN = {
		init: function(config) {
			if (complete || BOOMR.session.rate_limited) {
				return this;
			}

			if (config && config.rate_limited) {
				BOOMR.session.rate_limited=true;
				return this;
			}

			if (config && typeof config.autorun !== "undefined") {
				autorun = config.autorun;
			}

			// if we are called a second time while running, it means config.js has finished loading
			if (running) {
				// We need this monstrosity because Internet Explorer is quite moody
				// regarding whether it will or willn't fire onreadystatechange for
				// every change of readyState
				BOOMR.setImmediate(loaded);
				setTimeout(load, 5.5*60*1000);

				BOOMR.addVar("t_configjs", BOOMR.now()-t_start);
				if (typeof BOOMR_configt === "number") {
					BOOMR.addVar("t_configfb", BOOMR_configt-t_start);
					delete BOOMR_configt;
				}
				return this;
			}

			running=true;
			if (w === window) {
				BOOMR.subscribe("page_ready", load, null, null);
			}
			else {
				load();
			}

			return this;
		},

		is_complete: function() {
			return complete;
		}
	};

}(BOOMR.window));

/*
 log:null will disable logging, which is what we want for production minified boomerang,
 but not for the debug version.  We use special comment tags to indicate that this code
 block should be removed if the debug version is requested.
*/
BOOMR.addVar({"h.key": "%client_apikey%"}).init({primary:true, /*BEGIN DEBUG TOKEN*/log:null, /*END DEBUG TOKEN*/wait:true, site_domain:null, ResourceTiming:{enabled:false}, Angular:{enabled:false}});
