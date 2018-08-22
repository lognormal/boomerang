/**
 * The PaintTiming plugin collects paint metrics exposed by the W3C
 * [Paint Timing]{@link https://www.w3.org/TR/paint-timing/} specification.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * All beacon parameters are prefixed with `pt.`.
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `pt.fp`: `first-paint` in `DOMHighResTimestamp`
 * * `pt.fcp`: `first-contentful-paint` in `DOMHighResTimestamp`
 * * `pt.hid`: The document was loaded hidden (at some point), so FP and FCP are
 *             user-driven events, and thus won't be added to the beacon.
 *
 * @see {@link https://www.w3.org/TR/paint-timing/}
 * @class BOOMR.plugins.PaintTiming
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.PaintTiming) {
		return;
	}

	/**
	 * Map of Paint Timing API names to `pt.*` beacon parameters
	 *
	 * https://www.w3.org/TR/paint-timing/
	 */
	var PAINT_TIMING_MAP = {
		"first-paint": "fp",
		"first-contentful-paint": "fcp"
	};

	/**
	 * Private implementation
	 */
	var impl = {
		/**
		 * Whether or not we've initialized yet
		 */
		initialized: false,

		/**
		 * Whether or not we've added data to the beacon
		 */
		complete: false,

		/**
		 * Whether or not the browser supports PaintTiming (cached value)
		 */
		supported: null,

		/**
		 * Cached PaintTiming values
		 */
		timingCache: {},

		/**
		 * Executed on `page_ready` and `before_unload`
		 */
		done: function(edata, ename) {
			var p, paintTimings, i;

			if (this.complete) {
				// we've already added data to the beacon
				return this;
			}

			//
			// Don't add PaintTimings to SPA Soft or XHR beacons --
			// Only add to Page Load (ename: load) and SPA Hard (ename: xhr
			// and initiator: spa_hard) beacons.
			//
			if (ename !== "load" && (!edata || edata.initiator !== "spa_hard")) {
				this.complete = true;

				return this;
			}

			p = BOOMR.getPerformance();
			if (!p || typeof p.getEntriesByType !== "function") {
				// can't do anything if window.performance isn't available
				this.complete = true;

				return;
			}

			//
			// Get First Paint, First Contentful Paint, etc from Paint Timing API
			// https://www.w3.org/TR/paint-timing/
			//
			paintTimings = p.getEntriesByType("paint");

			if (paintTimings && paintTimings.length) {
				BOOMR.info("This user agent supports PaintTiming", "pt");

				for (i = 0; i < paintTimings.length; i++) {
					// cache it for others who want to use it
					impl.timingCache[paintTimings[i].name] = paintTimings[i].startTime;

					if (PAINT_TIMING_MAP[paintTimings[i].name]) {
						// add pt.* to a single beacon
						BOOMR.addVar(
							"pt." + PAINT_TIMING_MAP[paintTimings[i].name],
							Math.floor(paintTimings[i].startTime),
							true);
					}
				}

				this.complete = true;

				BOOMR.sendBeacon();
			}
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.PaintTiming = {
		/**
		 * Initializes the plugin.
		 *
		 * This plugin does not have any configuration.
		 *
		 * @returns {@link BOOMR.plugins.PaintTiming} The PaintTiming plugin for chaining
		 * @memberof BOOMR.plugins.PaintTiming
		 */
		init: function() {
			// skip initialization if not supported
			if (!this.is_supported()) {
				impl.complete = true;
				impl.initialized = true;
			}

			// If we haven't added PaintTiming data and the page is currently
			// hidden, don't add anything to the beacon as the paint might
			// happen only when the visitor makes the document visible.
			if (!impl.complete && BOOMR.visibilityState() === "hidden") {
				BOOMR.addVar("pt.hid", 1, true);

				impl.complete = true;
			}

			if (!impl.initialized) {
				// we'll add data to the beacon on whichever happens first
				BOOMR.subscribe("page_ready", impl.done, "load", impl);
				BOOMR.subscribe("xhr_load", impl.done, "xhr", impl);
				BOOMR.subscribe("before_unload", impl.done, null, impl);

				impl.initialized = true;
			}

			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.PaintTiming
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Whether or not this plugin is enabled and PaintTiming is supported.
		 *
		 * @returns {boolean} `true` if PaintTiming plugin is enabled and supported.
		 * @memberof BOOMR.plugins.PaintTiming
		 */
		is_enabled: function() {
			return impl.initialized && this.is_supported();
		},

		/**
		 * Whether or not PaintTiming is supported in this browser.
		 *
		 * @returns {boolean} `true` if PaintTiming is supported.
		 * @memberof BOOMR.plugins.PaintTiming
		 */
		is_supported: function() {
			var p;

			if (impl.supported !== null) {
				return impl.supported;
			}

			// check for getEntriesByType and the entry type existing
			var p = BOOMR.getPerformance();
			impl.supported = p &&
				typeof window.PerformancePaintTiming !== "undefined" &&
				typeof p.getEntriesByType === "function";

			return impl.supported;
		},

		/**
		 * Gets the PaintTiming timestamp for the specified name
		 *
		 * @param {string} timingName PaintTiming name
		 *
		 * @returns {DOMHighResTimestamp} Timestamp
		 * @memberof BOOMR.plugins.PaintTiming
		 */
		getTimingFor: function(timingName) {
			var p, paintTimings, i;

			// look in our cache first
			if (impl.timingCache[timingName]) {
				return impl.timingCache[timingName];
			}

			// skip if not supported
			if (!this.is_supported()) {
				return;
			}

			// need to get the window.performance interface
			var p = BOOMR.getPerformance();
			if (!p || typeof p.getEntriesByType !== "function") {
				return;
			}

			// get all Paint Timings
			paintTimings = p.getEntriesByType("paint");

			if (paintTimings && paintTimings.length) {
				for (i = 0; i < paintTimings.length; i++) {
					if (paintTimings[i].name === timingName) {
						// cache the value since it'll never change
						impl.timingCache[timingName] = paintTimings[i].startTime;

						return impl.timingCache[timingName];
					}
				}
			}
		}
	};

}());
