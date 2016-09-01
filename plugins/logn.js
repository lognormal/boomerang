/*global BOOMR_configt:true*/
(function(w) {
	var dc = document,
	    /* BEGIN_CONFIG_AS_JS */
	    s = "script",
	    /* END_CONFIG_AS_JS */
	    dom = w.location.hostname,
	    complete = false,
	    running = false,
	    t_start,
	    autorun = true,
	    alwaysRun = typeof w.BOOMR_LOGN_always !== "undefined",
	    CONFIG_RELOAD_TIMEOUT = w.BOOMR_CONFIG_RELOAD_TIMEOUT || 5.5 * 60 * 1000,
	    ready = false;

	// Don't even bother creating the plugin if this is mhtml
	if (!alwaysRun &&
		(BOOMR.plugins.LOGN || !dom || dom === "localhost" || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//))) {
		return;
	}

	/**
	 * Called when config.js[on] has loaded
	 */
	function loaded() {
		if (complete) {
			return;
		}

		complete = true;
		running = false;

		if (autorun || (BOOMR.onloadFired() && BOOMR.visibilityState() !== "prerender")) {
			BOOMR.sendBeacon();
		}
	}

	/* BEGIN_CONFIG_AS_JSON */
	/**
	 * Parses JSON from text, using JSON.parse, json_parse or eval
	 *
	 * @param {string} text JSON string
	 * @returns {object} JSON object
	 */
	function parseJson(text) {
		var parse = function() {
			throw new Exception("No JSON.parse available");
		};

		/* BEGIN_CONFIG_AS_JSON_EVAL */
		parse = function() {
			/*eslint-disable no-eval*/
			// fallback is `eval`
			return eval("(" + text + ")");
			/*eslint-enable no-eval*/
		};
		/* END_CONFIG_AS_JSON_EVAL */

		if (window.JSON && typeof JSON.parse === "function") {
			// native is available
			parse = JSON.parse;
		}
		else if (BOOMR.window) {
			if (BOOMR.window.JSON && typeof BOOMR.window.JSON.parse === "function") {
				// use polyfill
				parse = BOOMR.window.JSON.parse;
			}
			else if (typeof BOOMR.window.json_parse === "function") {
				// https://github.com/douglascrockford/JSON-js
				parse = BOOMR.window.json_parse;
			}
		}

		try {
			return parse(text);
		}
		catch (e) {
			// NOP
		}

		return null;
	}

	/**
	 * Handles a config.json response
	 *
	 * @param {string} responseText HTTP response text
	 */
	function handleJsonResponse(responseText) {
		w.BOOMR_configt = BOOMR.now();

		var configData = parseJson(responseText);
		if (configData) {
			// save the session ID first
			BOOMR.session.ID = configData.session_id;
			delete configData.session_id;

			// addVar other key config
			var params = ["h.key", "h.d", "h.t", "h.cr"];

			for (var i = 0; i < params.length; i++) {
				BOOMR.addVar(params[i], configData[params[i]]);

				// strip from the data we give to other plugins
				delete configData[params[i]];
			}

			BOOMR.init(configData);
		}
	}
	/* END_CONFIG_AS_JSON */

	/* BEGIN_CONFIG_AS_JS */
	function removeNodeIfSafe(element) {
		element.parentNode.removeChild(element);
	}
	/* END_CONFIG_AS_JS */

	/**
	 * Loads a config.js[on]
	 */
	function load() {
		/* BEGIN_CONFIG_AS_JS */
		var s0 = dc.getElementsByTagName(s)[0],
		    s1;
		/* END_CONFIG_AS_JS */

		var a = dc.createElement("A"),
		    bcn = BOOMR.getBeaconURL ? BOOMR.getBeaconURL() : "",
		    plugins = [],
		    pluginName,
		    url;

		for (pluginName in BOOMR.plugins) {
			if (BOOMR.plugins.hasOwnProperty(pluginName)) {
				plugins.push(encodeURIComponent(pluginName));
			}
		}

		t_start = BOOMR.now();

		url = "//%config_host%%config_path%";
		url += "?key="
			+ (w.BOOMR_LOGN_key ? w.BOOMR_LOGN_key : "%client_apikey%")
			+ "%config_url_suffix%&d=" + encodeURIComponent(dom)
			+ "&t=" + Math.round(t_start / (5 * 60 * 1000))	// add time field at 5 minute resolution so that we force a cache bust if the browser's being nasty
			+ "&v=" + BOOMR.version				// boomerang version so we can force a reload for old versions
			+ (w === window ? "" : "&if=")			// if this is running in an iframe, we need to look for config vars in parent window
			+ "&sl=" + (BOOMR.session.length > 0 ? 1 : 0)		// is this a new session (0) or existing session (1).  New sessions may be rate limited
									// We don't pass the actual session length so that the URL response can be cached
			+ "&si=" + BOOMR.session.ID + "-" + Math.round(BOOMR.session.start / 1000).toString(36)
			+ (complete ? "&r=" : "")				// if this is running after complete, then we're just refreshing the crumb
			+ (bcn ? "&bcn=" + encodeURIComponent(bcn) : "")	// Pass in the expected beacon URL so server can check if it has gone dead
			+ (complete ? "" : "&plugins=" + plugins.join(","));

		/* BEGIN_CONFIG_AS_JSON */
		url += "&acao=";
		/* END_CONFIG_AS_JSON */

		// absolutize the url
		a.href = url;
		BOOMR.config_url = a.href;

		/* BEGIN_CONFIG_AS_JSON */
		/*eslint-disable no-inner-declarations, no-empty*/
		if (window.XDomainRequest) {
			var xdr = new XDomainRequest();
			xdr.open("GET", url);
			xdr.onload = function() {
				handleJsonResponse(xdr.responseText);
			};
			xdr.send();
		}
		else {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					handleJsonResponse(xhr.responseText);
				}
			};
			xhr.send(null);
		}
		/* END_CONFIG_AS_JSON */

		/* BEGIN_CONFIG_AS_JS */
		s1 = dc.createElement(s);
		s1.src = url;
		s0.parentNode.insertBefore(s1, s0);
		s0 = null;
		/* END_CONFIG_AS_JS */

		if (complete) {
			// remove this node and start another after CONFIG_RELOAD_TIMEOUT
			setTimeout(function() {
				load();

				/* BEGIN_CONFIG_AS_JS */
				if (s1) {
					removeNodeIfSafe(s1);
					s1 = null;
				}
				/* END_CONFIG_AS_JS */
			}, CONFIG_RELOAD_TIMEOUT);
		}
	}

	BOOMR.plugins.LOGN = {
		init: function(config) {
			if (complete || BOOMR.session.rate_limited) {
				return this;
			}

			if (config && config.rate_limited) {
				BOOMR.session.rate_limited = true;
				return this;
			}

			if (config && typeof config.autorun !== "undefined") {
				autorun = config.autorun;
			}

			// if we are called a second time while running, it means config.js has finished loading
			if (running) {
				BOOMR.fireEvent("onconfig", config);

				// We need this monstrosity because Internet Explorer is quite moody
				// regarding whether it will or willn't fire onreadystatechange for
				// every change of readyState
				ready = true;
				BOOMR.setImmediate(loaded);
				setTimeout(load, CONFIG_RELOAD_TIMEOUT);

				BOOMR.addVar("t_configjs", BOOMR.now() - t_start);
				if (typeof BOOMR_configt === "number") {
					BOOMR.addVar("t_configfb", BOOMR_configt - t_start);
					delete BOOMR_configt;
				}

				return this;
			}
			else {
				BOOMR.registerEvent("onconfig");
			}

			// put h.d, h.key and h.t at the beginning of the beacon
			BOOMR.setVarPriority("h.d", -1);
			BOOMR.setVarPriority("h.key", -1);
			BOOMR.setVarPriority("h.t", -1);

			// put h.cr at the end
			BOOMR.setVarPriority("h.cr", 1);

			running = true;
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
		},

		/**
		 * Determines if Boomerang can send a beacon.  Waits for
		 * h.cr to be available
		 *
		 * @returns {boolean} True once h.cr is available
		 */
		readyToSend: function() {
			return BOOMR.hasVar("h.cr");
		}
	};

}(BOOMR.window));

/*
 log:null will disable logging, which is what we want for production minified boomerang,
 but not for the debug version.  We use special comment tags to indicate that this code
 block should be removed if the debug version is requested.
*/
BOOMR.addVar({"h.key": "%client_apikey%"})
	.init({
		primary: true,
		/* BEGIN_PROD */log: null, /* END_PROD */
		site_domain: "",
		wait: true,
		site_domain: null,
		ResourceTiming: {
			enabled: false
		},
		Angular: {
			enabled: false
		},
		Ember: {
			enabled: false
		},
		Backbone: {
			enabled: false
		},
		History: {
			enabled: false
		},
		Errors: {
			enabled: false
		},
		TPAnalytics: {
			enabled: false
		}
	});
