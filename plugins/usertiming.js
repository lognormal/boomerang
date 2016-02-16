/**
\file usertiming.js
Plugin to collect metrics from the W3C User Timing API.
For more information about User Timing,
see: http://www.w3.org/TR/user-timing/

This plugin is dependent on the UserTimingCompression library
see: https://github.com/nicjansma/usertiming-compression.js
UserTimingCompression must be loaded before this plugin's init is called.
*/

(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.UserTiming) {
		return;
	}

	/**
	 * @returns String compressed user timing data that occurred since the last call
	 */
	function getUserTiming() {
		var map, res, now = BOOMR.now();

		map = UserTimingCompression.getCompressedUserTiming(impl.options);
		res = UserTimingCompression.compressForUri(map);
		impl.options["from"] = now;

		return res;
	}

	var impl = {
		complete: false,
		initialized: false,
		supported: false,
		options: {"from": 0},

		addEntriesToBeacon: function() {
			var r;

			if (this.complete) {
				return;
			}

			BOOMR.removeVar("usertiming");
			r = getUserTiming();
			if (r) {
				BOOMR.info("User Timing API entries found since the last beacon", "usertiming");
				BOOMR.addVar({
					"usertiming": r
				});
			}

			this.complete = true;
			BOOMR.sendBeacon();
		},

		clearMetrics: function(vars) {
			if (vars.hasOwnProperty("usertiming")) {
				BOOMR.removeVar("usertiming");
			}
			this.complete = false;
		}
	};

	BOOMR.plugins.UserTiming = {
		init: function(config) {
			var p = BOOMR.window.performance;

			BOOMR.utils.pluginConfig(impl, config, "UserTiming");

			if (impl.initialized) {
				return this;
			}

			// Check that we have getEntriesByType and that the required UserTimingCompression library is available
			if (p && typeof p.getEntriesByType === "function" && typeof UserTimingCompression !== "undefined") {
				var marks = p.getEntriesByType("mark");
				var measures = p.getEntriesByType("measure");
				// Check that the results of getEntriesByType for marks and measures are Arrays
				// Some polyfill libraries may incorrectly implement this
				if (Object.prototype.toString.call(marks) === "[object Array]" && Object.prototype.toString.call(measures) === "[object Array]") {
					BOOMR.info("Client supports User Timing API", "usertiming");

					BOOMR.subscribe("before_onbeacon", impl.addEntriesToBeacon, null, impl);
					BOOMR.subscribe("onbeacon", impl.clearMetrics, null, impl);

					impl.supported = true;
				}
			}
			else {
				impl.complete = true;
			}

			impl.initialized = true;

			return this;
		},
		is_complete: function() {
			// After initialization, this plugin is ready to beacon data
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		},
	};

}());
