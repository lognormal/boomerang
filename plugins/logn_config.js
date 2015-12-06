/*global BOOMR_configt:true*/
(function(w) {
	var dc=document,
	    s="script",
	    dom=w.location.hostname,
	    complete, running,
	    t_start,
	    load, loaded,
	    autorun=true,
	    alwaysRun = typeof w.BOOMR_LOGN_always !== "undefined",
	    CONFIG_RELOAD_TIMEOUT=5.5*60*1000,
	    ready=false;

	// Don't even bother creating the plugin if this is mhtml
	if (!alwaysRun &&
		(BOOMR.plugins.LOGN || !dom || dom === "localhost" || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//))) {
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

	var removeNodeIfSafe = function(element) {
		element.parentNode.removeChild(element);
	};

	load=function() {
		var s0=dc.getElementsByTagName(s)[0],
		    s1,
		    a=dc.createElement("A"),
		    bcn=BOOMR.getBeaconURL ? BOOMR.getBeaconURL() : "",
		    plugins = [],
		    pluginName,
		    url;

		for (pluginName in BOOMR.plugins) {
			if (BOOMR.plugins.hasOwnProperty(pluginName)) {
				plugins.push(encodeURIComponent(pluginName));
			}
		}

		t_start=BOOMR.now();

		var configAsJSON = false;
		url = configAsJSON ?
			"//%config_host%%config_json_path%" :
			"//%config_host%%config_path%";
		url+="?key=%client_apikey%%config_url_suffix%&d=" + encodeURIComponent(dom)
			+ "&t=" + Math.round(t_start/(5*60*1000))	// add time field at 5 minute resolution so that we force a cache bust if the browser's being nasty
			+ "&v=" + BOOMR.version				// boomerang version so we can force a reload for old versions
			+ (w === window?"":"&if=")			// if this is running in an iframe, we need to look for config vars in parent window
			+ "&sl=" + (BOOMR.session.length>0?1:0)		// is this a new session (0) or existing session (1).  New sessions may be rate limited
									// We don't pass the actual session length so that the URL response can be cached
			+ "&si=" + BOOMR.session.ID + "-" + Math.round(BOOMR.session.start/1000).toString(36)
			+ (complete?"&r=":"")				// if this is running after complete, then we're just refreshing the crumb
			+ (bcn?"&bcn=" + encodeURIComponent(bcn) : "")	// Pass in the expected beacon URL so server can check if it has gone dead
			+ (complete?"":"&plugins=" + plugins.join(","));

		if (configAsJSON) {
			url += "&acao=";
		}

		// absolutize the url
		a.href = url;
		BOOMR.config_url = a.href;

		if (configAsJSON) {
			/*eslint-disable no-inner-declarations,no-empty*/
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					BOOMR_configt = BOOMR.now();
					var configData;
					try {
						configData = JSON.parse(xhr.responseText);
					}
					catch (e) {}

					if (configData) {
						function stripVars(data, params) {
							var vars = {};
							for (var i = 0; i < params.length; i++) {
								vars[params[i]] = data[params[i]];
								delete data[params[i]];
							}
							return vars;
						}
						BOOMR.session.ID = configData.session_id;
						delete configData.session_id;
						BOOMR.addVar(stripVars(configData, ["h.key", "h.d", "h.t", "h.cr"]));
						BOOMR.init(configData);
					}
				}
			};
			xhr.send(null);
		}
		else {
			s1=dc.createElement(s);
			s1.src = url;
			s0.parentNode.insertBefore(s1, s0);
			s0=null;
		}

		if (complete) {
			// remove this node and start another after CONFIG_RELOAD_TIMEOUT
			setTimeout(function() {
				load();

				if (s1) {
					/* DEBUG DISABLE LINE */removeNodeIfSafe(s1);
					s1=null;
				}
			}, CONFIG_RELOAD_TIMEOUT);
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
				ready = true;
				BOOMR.setImmediate(loaded);
				setTimeout(load, CONFIG_RELOAD_TIMEOUT);

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
			return ready;
		}
	};

}(BOOMR.window));

/*
 log:null will disable logging, which is what we want for production minified boomerang,
 but not for the debug version.  We use special comment tags to indicate that this code
 block should be removed if the debug version is requested.
*/
BOOMR.addVar({"h.key": "%client_apikey%"}).init({primary:true, /*BEGIN DEBUG TOKEN*/log:null, /*END DEBUG TOKEN*/wait:true, site_domain:null, ResourceTiming:{enabled:false}, Angular:{enabled:false}, Ember:{enabled:false}, Backbone:{enabled:false}, History:{enabled:false}});
