/**
 * @module UserTiming
 * @desc
 * Plugin to collect metrics from the W3C User Timing API.
 * For more information about User Timing,
 * see: http://www.w3.org/TR/user-timing/
 *
 * This plugin is dependent on the UserTimingCompression library
 * see: https://github.com/nicjansma/usertiming-compression.js
 * UserTimingCompression must be loaded before this plugin's init is called.
 */

/*global UserTimingCompression*/

(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.UserTiming) {
		return;
	}

	var impl = {
		complete: false,
		initialized: false,
		supported: false,
		options: {"from": 0, "window": BOOMR.window},

		/**
		 * Get a timestamp to compare with performance marks and measures.
		 *
		 * This function needs to approximate the time since the Navigation Timing API's
		 * `navigationStart` time. If available, `performance.now()` can provide this
		 * value. If not we either get the navigation start time from the RT plugin or
		 * from `t_lstart` or `t_start`. Those values are subtracted from the current
		 * time to derive a time since `navigationStart` value.
		 *
		 * @returns {float} Exact or approximate time since navigation start.
		 */
		now: function() {
			var now, navigationStart, p = BOOMR.getPerformance();

			if (p && p.now) {
				now = p.now();
			}
			else {
				navigationStart = (BOOMR.plugins.RT && BOOMR.plugins.RT.navigationStart) ?
					BOOMR.plugins.RT.navigationStart() :
					(BOOMR.t_lstart || BOOMR.t_start);

				now = BOOMR.now() - navigationStart;
			}

			return now;
		},

		/**
		 * Calls the UserTimingCompression library to get the compressed user timing data
		 * that occurred since the last call
		 *
		 * @returns {string} compressed user timing data
		 */
		getUserTiming: function() {
			var timings, res, now = this.now();
			var utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;

			timings = utc.getCompressedUserTiming(impl.options);
			res = utc.compressForUri(timings);
			this.options.from = now;

			return res;
		},

		/**
		 * Callback for `before_beacon` boomerang event
		 * Adds the `usertiming` param to the beacon
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
		 * Callback for `onbeacon` boomerang event
		 * Clears the `usertiming` beacon param
		 */
		clearMetrics: function(vars) {
			if (vars.hasOwnProperty("usertiming")) {
				BOOMR.removeVar("usertiming");
			}
			this.complete = false;
		},

		/**
		 * Subscribe to boomerang events that will handle the `usertiming` beacon param
		 */
		subscribe: function() {
			BOOMR.subscribe("before_beacon", this.addEntriesToBeacon, null, this);
			BOOMR.subscribe("onbeacon", this.clearMetrics, null, this);
		},

		/**
		 * Callback for boomerang page_ready event
		 * At page_ready, all javascript should be loaded. We'll call `checkSupport` again
		 * to see if a polyfill for User Timing is available
		 */
		pageReady: function() {
			if (this.checkSupport()) {
				this.subscribe();
			}
		},

		/**
		 * Checks if the browser supports the User Timing API and that the UserTimingCompression library is available
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
					BOOMR.info("Client supports User Timing API", "usertiming");
					this.supported = true;
					return true;
				}
			}
			return false;
		}
	};

	BOOMR.plugins.UserTiming = {
		init: function(config) {
			if (impl.initialized) {
				return this;
			}

			if (impl.checkSupport()) {
				impl.subscribe();
			}
			else {
				// usertiming isn't supported by the browser or the UserTimingCompression library isn't loaded.
				// Let's check again when the page is ready to see if a polyfill was loaded.
				BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
			}

			impl.initialized = true;
			return this;
		},
		is_complete: function() {
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		}
	};

}());
