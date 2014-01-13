(function(w) {
var dc=document,
    s="script",
    dom=w.location.hostname,
    complete=false, running=false,
    t_start,
    load, loaded,
    errorTimeout, timedOut;

// Don't even bother creating the plugin if this is mhtml
if(!dom || dom === 'localhost' || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//)) {
	return;
}

loaded=function() {
	if(errorTimeout) {
		clearTimeout(errorTimeout);
		errorTimeout=null;
	}

	if(complete) {
		return;
	}
	complete = true;
	running = false;
	BOOMR.sendBeacon();
};

timedOut=function() {
	// These are our failure settings, so be as careful as possible
	complete = true;
	running = false;
	BOOMR.addVar({"h.d": encodeURIComponent(dom), "config.timedout": "true"}).init({ strip_query_string: true, BW: { enabled: false } });

	BOOMR.sendBeacon();
};

load=function() {
	var s0=dc.getElementsByTagName(s)[0],
	    s1=dc.createElement(s),
	    bcn=BOOMR.getBeaconURL ? BOOMR.getBeaconURL() : "";

	t_start=new Date().getTime();
	s1.src="//%config_host%%config_path%?key=%client_apikey%%config_url_suffix%&d=" + encodeURIComponent(dom)
		+ '&t=' + Math.round(t_start/(5*60*1000))	// add time field at 5 minute resolution so that we force a cache bust if the browser's being nasty
		+ '&v=' + BOOMR.version				// boomerang version so we can force a reload for old versions
		+ (w === window?"":"&if=")			// if this is running in an iframe, we need to look for config vars in parent window
		+ '&sl=' + (BOOMR.session.length>0?1:0)		// is this a new session (0) or existing session (1).  New sessions may be rate limited
								// We don't pass the session length so that the URL response can be cached
		+ (complete?"&r=":"")				// if this is running after complete, then we're just refreshing the crumb
		+ (bcn?"&bcn=" + encodeURIComponent(bcn) : "")	// Pass in the expected beacon URL so server can check if it has gone dead
	;

	s0.parentNode.insertBefore(s1, s0);
	s0=s1=null;

	if(complete) {
		setTimeout(load, 5.5*60*1000);
	}

	if(!complete) {
		errorTimeout = setTimeout(timedOut, 3*60*1000);
	}
};

BOOMR.plugins.LOGN = {
	init: function() {
		if(complete) {
			return this;
		}

		// if we are called a second time while running, it means config.js has finished loading
		if(running) {
			// We need this monstrosity because Internet Explorer is quite moody
			// regarding whether it will or willn't fire onreadystatechange for
			// every change of readyState
			BOOMR.setImmediate(loaded);
			setTimeout(load, 5.5*60*1000);

			BOOMR.addVar('t_configjs', new Date().getTime()-t_start);
			if(typeof BOOMR_configt === "number") {
				BOOMR.addVar('t_configfb', BOOMR_configt-t_start);
				delete BOOMR_configt;
			}
			return;
		}

		running=true;
		if(w === window) {
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
BOOMR.addVar({"h.key": "%client_apikey%"}).init({/*BEGIN DEBUG TOKEN*/log:null,/*END DEBUG TOKEN*/wait:true,site_domain:null});
