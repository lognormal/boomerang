/**
 * This plugin is responsible for fetching config.js[on] for mPulse.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `h.key`: mPulse API key
 * * `h.d`: mPulse domain
 * * `h.t`: mPulse Anti-CSRF timestamp
 * * `h.cr`: mPulse Anti-CSRF crumb
 * * `t_configjs`: The time the config.js[on] data was sent to `init()`
 * * `t_configfb`: The time the config.js[on] data's first bytes were received
 * * `t_configls`: The time the config was read from localStorage (delta from navStart)
 *
 * @class BOOMR.plugins.LOGN
 */
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
	    isConfigXHRFilterSet = false,
	    // Default is undefined. Used from unit tests to change behavior.
	    // When false, the plugin will not run.
	    // When true, the plugin will always run
	    alwaysRun = w.BOOMR_LOGN_always,
	    CONFIG_RELOAD_TIMEOUT = w.BOOMR_CONFIG_RELOAD_TIMEOUT || 5.5 * 60 * 1000,  // milliseconds
	    CONFIG_STORE_TIMEOUT = w.BOOMR_CONFIG_STORE_TIMEOUT || 8 * 60;  // seconds
	    ready = false;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.LOGN) {
		return;
	}

	// Don't even bother creating the plugin if this is mhtml
	if (alwaysRun === false ||
	    (typeof alwaysRun === "undefined" &&
	    (!dom || dom === "localhost" || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//)))) {
		return;
	}

	var impl = {
		storeConfig: false  // use localStorage to cache config, default to false
	};

	/**
	 * Called when config.js[on] has loaded either from a server response or localStorage
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
			BOOMR.debug("Parsing config failed for text: '" + text + "'", "LOGN");
		}

		return null;
	}

	/**
	 * Loads the config JSON either from a server response or localStorage
	 *
	 * @param {object} JSON config object
	 *
	 * @returns {boolean} true if successful
	 */
	function loadJsonConfig(configData) {
		// save the session ID first
		if (configData.session_id) {
			BOOMR.session.ID = configData.session_id;
			delete configData.session_id;
		}

		// addVar other key config
		var params = ["h.key", "h.d", "h.t", "h.cr"];

		for (var i = 0; i < params.length; i++) {
			if (configData[params[i]]) {
				BOOMR.addVar(params[i], configData[params[i]]);

				// strip from the data we give to other plugins
				delete configData[params[i]];
			}
		}

		// call init even if the object is empty like the JS config would have.
		// The page-params plugin (maybe others) depends on this functionality
		BOOMR.init(configData);
		return true;
	}

	/**
	 * Handles a config.json response
	 *
	 * @param {string} responseText HTTP response text
	 * @param {boolean} configRefresh true if the response is a result of a config refresh
	 *
	 * @returns {boolean} true if successful
	 */
	function handleJsonResponse(responseText, configRefresh) {
		w.BOOMR_configt = BOOMR.now();

		var configData = parseJson(responseText), logn;
		if (configData) {
			// Update localStorage with config.
			// When refresh is false then we are receiving the complete config, overwrite everything.
			// When refresh is true then we are only receive crumb data, merge with existing config
			logn = configRefresh ? BOOMR.utils.getLocalStorage("LOGN") || {} : {};
			for (var key in configData) {
				if (configData.hasOwnProperty(key)) {
					logn[key] = configData[key];
				}
			}

			// if storing is enabled then check the current and incomming configs
			if (impl.storeConfig || (configData.LOGN && configData.LOGN.storeConfig)) {
				BOOMR.utils.setLocalStorage("LOGN", logn, CONFIG_STORE_TIMEOUT);
			}

			// if this is the complete config response then queue the first config refresh
			if (!configRefresh) {
				setTimeout(load, CONFIG_RELOAD_TIMEOUT);
			}

			BOOMR.debug("Loading config from JSON response", "LOGN");
			return loadJsonConfig(configData);
		}
		return false;
	}
	/* END_CONFIG_AS_JSON */

	/* BEGIN_CONFIG_AS_JS */
	/**
	 * Remove the specified node
	 *
	 * @param {Element} element HTML element
	 */
	function removeNodeIfSafe(element) {
		element.parentNode.removeChild(element);
	}
	/* END_CONFIG_AS_JS */

	/**
	 * Checks localStorage for an existing config and initiates a server config.js[on] request
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

		/* BEGIN_CONFIG_AS_JSON */
		// we'll always try to load config from localStorage since we don't know
		// at this point if storeConfig is enabled or not
		var configData;
		if (!complete) {
			configData = BOOMR.utils.getLocalStorage("LOGN");
			if (configData) {
				// we found the config in localStorage
				BOOMR.debug("Loading config from localStorage", "LOGN");
				if (loadJsonConfig(configData)) {
					// add config time to beacon
					BOOMR.addVar("t_configls", Math.round(BOOMR.hrNow()));
					BOOMR.setImmediate(loaded);
				}
			}
		}
		/* END_CONFIG_AS_JSON */

		for (pluginName in BOOMR.plugins) {
			if (BOOMR.plugins.hasOwnProperty(pluginName)) {
				plugins.push(encodeURIComponent(pluginName));
			}
		}

		t_start = BOOMR.now();

		url = "%config_scheme%%config_host%%config_path%";
		url += "?key=" +
		    BOOMR.getVar("h.key") +
		    "%config_url_suffix%&d=" + encodeURIComponent(dom) +
		    // add time field at 5 minute resolution so that we force a cache bust if the browser's being nasty
		    "&t=" + Math.round(t_start / (5 * 60 * 1000)) +
		    // boomerang version so we can force a reload for old versions
		    "&v=" + BOOMR.version +
		    // if this is running in an iframe, we need to look for config vars in parent window
		    (w === window ? "" : "&if=") +
		    // is this a new session (0) or existing session (1).  New sessions may be rate limited.
		    // We don't pass the actual session length so that the URL response can be cached
		    "&sl=" + (BOOMR.session.length > 0 ? 1 : 0) +
		    // session ID
		    "&si=" + BOOMR.session.ID + "-" + Math.round(BOOMR.session.start / 1000).toString(36) +
		    // if this is running after complete, then we're just refreshing the crumb
		    (complete ? "&r=" : "") +
		    // Pass in the expected beacon URL so server can check if it has gone dead
		    (bcn ? "&bcn=" + encodeURIComponent(bcn) : "") +
		    // only need to send the plugin list on first config request
		    (complete ? "" : "&plugins=" + plugins.join(","));

		/* BEGIN_CONFIG_AS_JSON */
		// request Access-Control-Allow-Origin in the response headers
		url += "&acao=";
		/* END_CONFIG_AS_JSON */

		// absolutize the url
		a.href = url;
		BOOMR.config_url = a.href;

		/* BEGIN_CONFIG_AS_JSON */
		/*eslint-disable no-inner-declarations, no-empty*/
		// `complete` may change by the time the callback is called, save the value as `refresh`
		(function(refresh) {
			if (window.XDomainRequest) {
				var xdr = new XDomainRequest();
				xdr.open("GET", url);
				xdr.onload = function() {
					handleJsonResponse(xdr.responseText, refresh);
				};
				xdr.send();
			}
			else {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4 && xhr.status === 200) {
						handleJsonResponse(xhr.responseText, refresh);
					}
				};
				xhr.send(null);
			}
		}(complete));
		/* END_CONFIG_AS_JSON */

		/* BEGIN_CONFIG_AS_JS */
		s1 = dc.createElement(s);
		s1.src = url;
		s0.parentNode.insertBefore(s1, s0);
		s0 = null;
		/* END_CONFIG_AS_JS */

		// we'll wait until we get our first config response before queuing the config refreshes here
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

	/**
	 * Fired 'beacon'
	 */
	function onBeacon() {
		// remove config timing vars
		BOOMR.removeVar("t_configjs");
		BOOMR.removeVar("t_configfb");
		BOOMR.removeVar("t_configls");
	}

	//
	// Exports
	//
	BOOMR.plugins.LOGN = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {boolean} [config.rate_limited] Whether or not the session is rate limited
		 * @param {boolean} [config.autorun] Whether or not to auto-run on onload
		 *
		 * @returns {@link BOOMR.plugins.LOGN} The LOGN plugin for chaining
		 * @memberof BOOMR.plugins.LOGN
		 */
		init: function(config) {
			var apiKey;

			BOOMR.utils.pluginConfig(impl, config, "LOGN", ["storeConfig"]);

			if (complete || BOOMR.session.rate_limited) {
				return this;
			}

			if (config) {
				if (config.rate_limited) {
					BOOMR.session.rate_limited = true;
					return this;
				}

				if (typeof config.autorun !== "undefined") {
					autorun = config.autorun;
				}
			}

			// if we are called a second time while running, it means config.js[on] has finished loading
			// either from a server response or localStorage
			if (running) {
				BOOMR.fireEvent("config", config);

				// We need this monstrosity because Internet Explorer is quite moody
				// regarding whether it will or willn't fire onreadystatechange for
				// every change of readyState
				ready = true;
				BOOMR.setImmediate(loaded);

				/* BEGIN_CONFIG_AS_JS */
				// queue the first config refresh.
				// in JSON mode, the first config refresh will be queued in handleJsonResponse because
				// we might arrive here from a localStorage config load
				setTimeout(load, CONFIG_RELOAD_TIMEOUT);
				/* END_CONFIG_AS_JS */

				if (t_start) {
					BOOMR.addVar("t_configjs", BOOMR.now() - t_start);
					if (typeof BOOMR_configt === "number") {
						BOOMR.addVar("t_configfb", BOOMR_configt - t_start);
						delete BOOMR_configt;
					}
				}

				return this;
			}
			else {
				// get the API key from a global BOOMR_API_key or the script loader URL
				if (w && w.BOOMR_API_key) {
					apiKey = w.BOOMR_API_key;
				}
				else if (dc) {
					if (BOOMR.url && BOOMR.url.lastIndexOf("/") !== -1) {
						apiKey = BOOMR.url.substr(BOOMR.url.lastIndexOf("/") + 1);
					}
				}

				if (apiKey) {
					BOOMR.addVar("h.key", apiKey);
					/* BEGIN_CONFIG_AS_JSON */
					// Prevent AutoXHR from instrumenting and beaconing on Boomerangs own config.json requests
					if (!isConfigXHRFilterSet &&
						BOOMR.plugins &&
						BOOMR.plugins.AutoXHR &&
						typeof BOOMR.plugins.AutoXHR.addExcludeFilter === "function") {

						BOOMR.plugins.AutoXHR.addExcludeFilter(function(anchor) {
							if (anchor && anchor.href && anchor.href.indexOf(this) > -1) {
								return true;
							}
							return false;
						}, apiKey, "ConfigXHRRequestFilter");
						isConfigXHRFilterSet = true;
					}
					/* END_CONFIG_AS_JSON */
				}
				else {
					BOOMR.error("API key could not be detected from script URL or BOOMR_API_key, exiting");
					return;
				}
			}

			// put h.d, h.key and h.t at the beginning of the beacon
			BOOMR.setVarPriority("h.d", -1);
			BOOMR.setVarPriority("h.key", -1);
			BOOMR.setVarPriority("h.t", -1);

			// put h.cr at the end
			BOOMR.setVarPriority("h.cr", 1);

			BOOMR.subscribe("beacon", onBeacon, null, null);

			running = true;

			/* BEGIN_CONFIG_AS_JS */
			// load config immediately if running in an iframe otherwise wait
			// until onload so that we don't affect the page timing if the config
			// request is slow
			if (w === window) {
				// Issue 622: this doesn't work for SPA
				BOOMR.subscribe("page_ready", load, null, null, true);
			}
			else {
				load();
			}
			/* END_CONFIG_AS_JS */
			/* BEGIN_CONFIG_AS_JSON */
			// XHR config request shouldn't delay onload even if not in an iframe.
			// Call with setImmediate because if config is found in localStorage it
			// it will call init again
			BOOMR.setImmediate(load);
			/* END_CONFIG_AS_JSON */

			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.LOGN
		 */
		is_complete: function() {
			return ready;
		},

		/**
		 * Determines if Boomerang can send a beacon.  Waits for
		 * h.cr to be available
		 *
		 * @returns {boolean} True once h.cr is available
		 * @memberof BOOMR.plugins.LOGN
		 */
		readyToSend: function() {
			return BOOMR.hasVar("h.cr");
		}

		/* BEGIN_CONFIG_AS_JSON */
		, isJson: true
		/* END_CONFIG_AS_JSON */
	};
}(BOOMR.window));

/*
 log:null will disable logging, which is what we want for production minified boomerang,
 but not for the debug version.  We use special comment tags to indicate that this code
 block should be removed if the debug version is requested.
*/
BOOMR.init({
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
	},
	UserTiming: {
		enabled: false
	},
	Continuity: {
		enabled: false
	},
	IFrameDelay: {
		enabled: false
	},
	Akamai: {
		enabled: false
	}
});
