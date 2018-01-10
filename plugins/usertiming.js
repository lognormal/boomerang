/*global UserTimingCompression*/
/**
 * The UserTiming plugin to collect metrics from the W3C
 * [UserTiming]{@link http://www.w3.org/TR/user-timing/} API.
 *
 * This plugin is dependent on the
 * [UserTimingCompression library]{@link https://github.com/nicjansma/usertiming-compression.js}.
 * `UserTimingCompression` must be loaded before this plugin's `init()` is called.
 *
 * This plugin collects all marks and measures that were added since
 * navigation start or since the last beacon fired for the current navigation.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `usertiming`: Compressed ResourceTiming data
 *
 * The value is a compressed string using
 * [UserTimingCompression library]{@link https://github.com/nicjansma/usertiming-compression.js}.
 * A decompression function is also available in the library.
 *
 * Timing data is rounded to the nearest millisecond.
 *
 * ## Example
 *
 *     // mark current timestamp as mark1
 *     performance.mark('mark1');
 *     // mark current timestamp as mark1
 *     performance.mark('mark2');
 *     // measure1 will be the delta between mark1 and mark2 timestamps
 *     performance.measure('measure1', 'mark1', 'mark2');
 *     //measure2 will be the delta between the mark2 timestamp and the current time
 *     performance.measure('measure2', 'mark2');
 *
 * The compressed data added to the beacon will look similar to the following:
 *
 *     usertiming=~(m~(ark~(1~'2s~2~'5k)~easure~(1~'2s_2s~2~'5k_5k)))
 *
 * Decompressing the above value will give us the original data for the marks
 * and measures collected:
 *
 *     [{"name":"mark1","startTime":100,"duration":0,"entryType":"mark"},
 *     {"name":"measure1","startTime":100,"duration":100,"entryType":"measure"},
 *     {"name":"mark2","startTime":200,"duration":0,"entryType":"mark"},
 *     {"name":"measure2","startTime":200,"duration":200,"entryType":"measure"}]
 *
 * ## Compatibility
 *
 * Many browsers [support](http://caniuse.com/#feat=user-timing) the UserTiming
 * API, e.g.:
 *
 * * Chrome 25+
 * * Edge
 * * Firefox 38+
 * * IE 10+
 * * Opera 15+
 *
 * See Nic Jansma's [usertiming.js]{@link https://github.com/nicjansma/usertiming.js}
 * polyfill library to add UserTiming API support for browsers that don't
 * implement it natively.
 *
 * @see {@link http://www.w3.org/TR/user-timing/}
 * @class BOOMR.plugins.UserTiming
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.UserTiming) {
		return;
	}

	var impl = {
		// Whether or not this plugin is complete.
		complete: false,

		// Whether or not this plugin is initialized
		initialized: false,

		// Whether or not UserTiming is supported by this browser
		supported: false,

		// Options
		options: {"from": 0, "window": BOOMR.window},

		/*
		 * Calls the UserTimingCompression library to get the compressed UserTiming
		 * data that occurred since the last call.
		 *
		 * @returns {string} Compressed UserTiming data
		 */
		getUserTiming: function() {
			var timings, res,
			    now = BOOMR.hrNow(),  // Get a timestamp to compare with performance marks and measures.
			    utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;

			timings = utc.getCompressedUserTiming(impl.options);
			res = utc.compressForUri(timings);
			this.options.from = now;

			return res;
		},

		/**
		 * Callback for `before_beacon` boomerang event.
		 *
		 * Adds the `usertiming` param to the beacon.
		 */
		addEntriesToBeacon: function() {
			var r;

			if (this.complete) {
				return;
			}

			BOOMR.removeVar("usertiming");
			r = this.getUserTiming();
			if (r) {
				BOOMR.addVar({
					"usertiming": r
				});
			}

			this.complete = true;
		},

		/**
		 * Callback for `beacon` boomerang event.
		 *
		 * Clears the `usertiming` beacon param.
		 */
		clearMetrics: function(vars) {
			if (vars.hasOwnProperty("usertiming")) {
				BOOMR.removeVar("usertiming");
			}
			this.complete = false;
		},

		/**
		 * Subscribe to boomerang events that will handle the `usertiming`
		 * beacon param.
		 */
		subscribe: function() {
			BOOMR.subscribe("before_beacon", this.addEntriesToBeacon, null, this);
			BOOMR.subscribe("beacon", this.clearMetrics, null, this);
		},

		/**
		 * Callback for boomerang page_ready event.
		 *
		 * At page_ready, all javascript should be loaded. We'll call `checkSupport`
		 * again to see if a polyfill for UserTiming is available.
		 */
		pageReady: function() {
			if (this.checkSupport()) {
				this.subscribe();
			}
		},

		/**
		 * Checks if the browser supports the UserTiming API and that the
		 * UserTimingCompression library is available.
		 *
		 * @returns {boolean} true if supported, false if not
		 */
		checkSupport: function() {
			if (this.supported) {
				return true;
			}

			// Check that the required UserTimingCompression library is available
			var utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;
			if (typeof utc === "undefined") {
				BOOMR.warn("UserTimingCompression library not found", "usertiming");
				return false;
			}

			var p = BOOMR.getPerformance();

			// Check that we have getEntriesByType
			if (p && typeof p.getEntriesByType === "function") {
				var marks = p.getEntriesByType("mark");
				var measures = p.getEntriesByType("measure");

				// Check that the results of getEntriesByType for marks and measures are Arrays
				// Some polyfill libraries may incorrectly implement this
				if (BOOMR.utils.isArray(marks) && BOOMR.utils.isArray(measures)) {
					BOOMR.info("Client supports UserTiming API", "usertiming");
					this.supported = true;
					return true;
				}
			}

			return false;
		}
	};

	BOOMR.plugins.UserTiming = {
		/**
		 * Initializes the plugin.
		 *
		 * @returns {@link BOOMR.plugins.UserTiming} The UserTiming plugin for chaining
		 * @memberof BOOMR.plugins.UserTiming
		 */
		init: function(config) {
			if (impl.initialized) {
				return this;
			}

			if (impl.checkSupport()) {
				impl.subscribe();
			}
			else {
				// UserTiming isn't supported by the browser or the UserTimingCompression
				// library isn't loaded. Let's check again when the page is
				// ready to see if a polyfill was loaded.
				BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
			}

			impl.initialized = true;
			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.UserTiming
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Whether or not UserTiming is supported in this browser.
		 *
		 * @returns {boolean} `true` if UserTiming is supported.
		 * @memberof BOOMR.plugins.UserTiming
		 */
		is_supported: function() {
			return impl.initialized && impl.supported;
		}
	};
}());
