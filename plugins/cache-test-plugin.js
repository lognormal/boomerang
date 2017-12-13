/**
 * The `CT` plugin tests how long an item stays in the browser's cache.
 *
 * Given a URL, this plugin loads the specified URL and measures how long it took to load.
 *
 * You can use the results of this plugin to determine how cacheable a URL is across
 * browsers and over time.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Usage
 *
 * This plugin requires a server-generated JavaScript file that calls
 * {@link BOOMR.plugins.CT.loaded} with the server's timestamp.
 *
 * This file is specified as {@link BOOMR.plugins.CT.init CT.cached_url} and should
 * return an `application/javascript` file with contents similar to:
 *
 * ```
 * BOOMR.plugins.CT.loaded(12345); // server-generated timestamp
 * ```
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `cch.ce`: Time when the cached item started to load
 * * `cch.lt`: Load time of cached item (ms)
 * * `cch.se`: Server timestamp
 *
 * @class BOOMR.plugins.CT
 */
(function() {
	var dc = document,
	    s = "script",
	    dom = location.hostname,
	    complete = false,
	    t_start;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.CT) {
		return;
	}

	// Don't even bother creating the plugin if this is mhtml
	if (!dom || dom === "localhost" || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//)) {
		return;
	}

	/**
	 * Loads the cache URL
	 */
	function load() {
		var s0 = dc.getElementsByTagName(s)[0],
		    s1 = dc.createElement(s);

		s1.onload = BOOMR.plugins.CT.loaded;
		s1.src = cached_url;
		t_start = BOOMR.now();
		BOOMR.addVar("cch.ce", t_start);

		s0.parentNode.insertBefore(s1, s0);
		s0 = s1 = null;

		// this is a timeout so we don't wait forever to send the beacon
		// if the server fails
		setTimeout(BOOMR.plugins.CT.loaded, 500);
	};

	//
	// Exports
	//
	BOOMR.plugins.CT = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {string} config.CT.cached_url URL to load
		 *
		 * @returns {@link BOOMR.plugins.CT} The CT plugin for chaining
		 * @memberof BOOMR.plugins.CT
		 */
		init: function(config) {
			if (complete) {
				return this;
			}

			if (config && config.CT && config.CT.cached_url) {
				cached_url = config.CT.cached_url;
			}
			else {
				complete = true;
				return this;
			}

			if (BOOMR.window === window) {
				BOOMR.subscribe("page_ready", load, null, null);
			}
			else {
				load();
			}

			return this;
		},

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.CACHE_RELOAD
		 */
		is_complete: function() {
			return complete;
		},

		/**
		 * Called when the {@link BOOMR.plugins.CT.init CT.cached_url} is loaded.
		 *
		 * @param {number} t Server timestamp
		 */
		loaded: function(t) {
			if (complete) {
				return;
			}

			if (!t) {
				t = -1;
			}

			// how long did it take for the call to return
			BOOMR.addVar({
				"cch.lt": BOOMR.now() - t_start,
				"cch.se": t
			});

			complete = true;
			BOOMR.sendBeacon();
		}
	};
}());
