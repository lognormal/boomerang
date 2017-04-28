/**
\file usertiming.js
Plugin to collect metrics from the W3C User Timing API.
For more information about User Timing,
see: http://www.w3.org/TR/user-timing/

This plugin is dependent on the UserTimingCompression library
see: https://github.com/nicjansma/usertiming-compression.js
UserTimingCompression must be loaded before this plugin's init is called.
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
		 * @returns String compressed user timing data that occurred since the last call
		 */
		getUserTiming: function() {
			var timings, res, now = BOOMR.now();

			timings = UserTimingCompression.getCompressedUserTiming(impl.options);
			res = UserTimingCompression.compressForUri(timings);
			this.options.from = now;

			return res;
		},

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

		clearMetrics: function(vars) {
			if (vars.hasOwnProperty("usertiming")) {
				BOOMR.removeVar("usertiming");
			}
			this.complete = false;
		},

		subscribe: function() {
			BOOMR.subscribe("before_beacon", this.addEntriesToBeacon, null, this);
			BOOMR.subscribe("onbeacon", this.clearMetrics, null, this);
		},

		pageReady: function() {
			if (this.checkSupport()) {
				this.subscribe();
			}
		},

		checkSupport: function() {
			if (this.supported) {
				return true;
			}

			var p = BOOMR.getPerformance();
			// Check that we have getEntriesByType and that the required UserTimingCompression library is available
			if (p && typeof p.getEntriesByType === "function" &&
			    typeof UserTimingCompression !== "undefined") {
				var marks = p.getEntriesByType("mark");
				var measures = p.getEntriesByType("measure");
				// Check that the results of getEntriesByType for marks and measures are Arrays
				// Some polyfill libraries may incorrectly implement this
				if (Object.prototype.toString.call(marks) === "[object Array]" &&
				    Object.prototype.toString.call(measures) === "[object Array]") {
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
				// usertiming isn't supported by the browser. Let's check again when the page is ready to see if a polyfill was loaded.
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
