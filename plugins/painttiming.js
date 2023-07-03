/**
 * The PaintTiming plugin collects paint metrics exposed by the W3C
 * [Paint Timing]{@link https://www.w3.org/TR/paint-timing/} and
 * [Largest Contentful Paint]{@link https://wicg.github.io/largest-contentful-paint/}
 * specifications.
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
 * * `pt.lcp`: `largest-contentful-paint` in `DOMHighResTimestamp`
 * * `pt.hid`: The document was loaded hidden (at some point), so FP and FCP are
 *             user-driven events, and thus won't be added to the beacon.
 * * `pt.lcp.src`: Source URL of the Largest Contentful Paint element
 * * `pt.lcp.el`: Element tag name of the Largest Contentful Paint
 * * `pt.lcp.id`: Element ID of the Largest Contentful Paint
 * * `pt.lcp.e`: Element Pseudo-CSS selector for the Largest Contentful Paint
 * * `pt.lcp.srcset`: Element srcset property of the Largest Contentful Paint
 * * `pt.lcp.sizes`: Element sizes property of the Largest Contentful Paint
 * * `pt.lcp.s`: Size of the Largest Contentful Paint in device-independent pixels squared
 *
 * @see {@link https://www.w3.org/TR/paint-timing/}
 * @see {@link https://wicg.github.io/largest-contentful-paint/}
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
    "first-contentful-paint": "fcp",
    "largest-contentful-paint": "lcp"
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

    /* BEGIN_DEBUG */
    /**
     * History of timings
     */
    timingHistory: {},
    /* END_DEBUG */

    /**
     * LCP observer
     */
    observer: null,

    // Metrics that will be exported
    externalMetrics: {},

    // the largest contentful paint at the moment
    lcp: {
      // render time
      time: 0,

      // tag name
      el: "",

      // src / href
      src: "",

      // element ID
      id: "",

      // pseudo-css selector
      e: "",

      // srcset attribute
      srcset: "",

      // sizes attribute
      sizes: "",

      // size
      s: 0
    },

    // keeps track if onBeforeBeacon has sent lcp data once already
    lcpDataSent: false,

    /**
     * Executed on `page_ready`, `xhr_load` and `before_unload`
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
    },

    /**
     * `before_beacon` listener for adding Largest Contentful Paint
     * to beacon data. Allows LCP to be added to both Page Load and
     * Early beacons, while avoiding sending it on Error beacons,
     * SPA Soft Navigations, or sending redundant LCPs.
     */
    onBeforeBeacon: function(data){
      if (!BOOMR.isPageLoadBeacon(data)) {
        // we don't want to send LCP data on beacons not related to page load
        return;
      }

      if (impl.lcpDataSent) {
        // prevents LCP data from being sent redundantly
        return;
      }

      // LCP isn't supported for Soft Navigations or any other non-Page Load beacons, so
      // don't listen any more if LCP hasn't happened by the Page Load beacon.
      if (!data.early && impl.observer) {
        impl.observer.disconnect();
        impl.observer = null;
      }

      if (!impl.lcp.time) {
        // time is used to check if LCP has been populated
        return;
      }

      BOOMR.addVar("pt.lcp", Math.floor(impl.lcp.time), true);

      if (impl.lcp.src) {
        BOOMR.addVar("pt.lcp.src", impl.lcp.src, true);
      }

      if (impl.lcp.el) {
        BOOMR.addVar("pt.lcp.el", impl.lcp.el, true);
      }

      if (impl.lcp.id) {
        BOOMR.addVar("pt.lcp.id", impl.lcp.id, true);
      }

      if (impl.lcp.e) {
        BOOMR.addVar("pt.lcp.e", impl.lcp.e, true);
      }

      if (impl.lcp.srcset) {
        BOOMR.addVar("pt.lcp.srcset", impl.lcp.srcset, true);
      }

      if (impl.lcp.sizes) {
        BOOMR.addVar("pt.lcp.sizes", impl.lcp.sizes, true);
      }

      if (impl.lcp.s) {
        BOOMR.addVar("pt.lcp.s", impl.lcp.s, true);
      }

      if (!data.early) {
        impl.lcpDataSent = true;
      }
    },

    /**
     * Performance observer callback for LCP
     *
     * @param {PerformanceEntry[]} list Performance entries
     */
    onObserver: function(list) {
      var entries = list.getEntries();

      if (entries.length === 0) {
        return;
      }

      // Use the latest one
      var lcp = entries[entries.length - 1];

      // LCP can change over time, so always take the latest value.  Use renderTime
      // if available (for same-origin resources or if they have Timing-Allow-Origin),
      // otherwise loadTime is the best we can get.
      impl.lcp.time = lcp.renderTime || lcp.loadTime;

      // cache it for others who want to use it
      impl.timingCache[lcp.entryType] = impl.lcp.time;

      // size
      impl.lcp.s = lcp.size ? lcp.size : 0;

      if (lcp.element) {
        // tag name
        impl.lcp.el = lcp.element.tagName;

        // src / href
        impl.lcp.src = (lcp.element.href || lcp.element.src) || "";

        // element ID
        impl.lcp.id = lcp.element.id || "";

        // Pseudo-CSS selector
        impl.lcp.e = BOOMR.utils.makeSelector(lcp.element);

        // srcset attribute
        impl.lcp.srcset = lcp.element.srcset || "";

        // sizes attribute
        impl.lcp.sizes = lcp.element.sizes || "";
      }

      /* BEGIN_DEBUG */
      /**
			 * History of timings
			 */
      impl.timingHistory[lcp.entryType] = impl.timingHistory[lcp.entryType] || [];
      impl.timingHistory[lcp.entryType].push({
        time: impl.lcp.time,
        src: impl.lcp.src,
        el: impl.lcp.el,
        id: impl.lcp.id,
        e: impl.lcp.e,
        srcset: impl.lcp.srcset,
        sizes: impl.lcp.sizes,
        s: impl.lcp.s
      });
      /* END_DEBUG */
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
        BOOMR.subscribe("before_beacon", impl.onBeforeBeacon, null, impl);

        // create a PO for LCP
        if (typeof BOOMR.window.PerformanceObserver === "function" &&
            typeof window.LargestContentfulPaint === "function") {
          impl.observer = new BOOMR.window.PerformanceObserver(impl.onObserver);
          impl.observer.observe({ type: "largest-contentful-paint", buffered: true });
        }

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
    },

    /* BEGIN_DEBUG */
    /**
     * Get the history of timings for the specified metric
     */
    getHistoryFor: function(timingName) {
      return impl.timingHistory[timingName] || [];
    },
    /* END_DEBUG */

    // external metrics
    metrics: {
      lcp: function() {
        return Math.floor(impl.lcp.time);
      },
      lcpSrc: function() {
        return impl.lcp.src;
      },
      lcpEl: function() {
        return impl.lcp.el;
      },
      lcpId: function() {
        return impl.lcp.id;
      },
      lcpE: function() {
        return impl.lcp.e;
      },
      lcpSrcset: function() {
        return impl.lcp.srcset;
      },
      lcpSizes: function() {
        return impl.lcp.sizes;
      },
      lcpS: function() {
        return impl.lcp.s;
      }
    }

  };
}());
