/**
\file usertiming.js
Plugin to collect metrics from the W3C User Timing API.
For more information about User Timing,
see: http://www.w3.org/TR/user-timing/
*/

(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	/**
	 * @returns String compressed user timing data that occurred since the last call
	 */
	function getUserTiming() {
		var now = BOOMR.now();

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

		done: function() {
			var r;

			if (this.complete) {
				return;
			}

			BOOMR.removeVar("usertiming");
			r = getUserTiming();
			if (r) {
				BOOMR.info("Client supports User Timing API", "usertiming");
				BOOMR.addVar({
					"usertiming": JSON.stringify(r)
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

			if (p && typeof p.getEntriesByType === "function") {
				BOOMR.subscribe("page_ready", impl.done, null, impl);
				BOOMR.subscribe("xhr_load", impl.done, null, impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);
				BOOMR.subscribe("onbeacon", impl.clearMetrics, null, impl);
				impl.supported = true;
			}
			else {
				impl.complete = true;
			}

			impl.initialized = true;

			return this;
		},
		is_complete: function() {
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		},
	};

}());
