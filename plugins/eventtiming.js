/**
 * The EventTiming plugin collects interaction metrics exposed by the W3C
 * [Event Timing]{@link https://github.com/w3c/event-timing} proposal.
 *
 * This plugin calculates metrics such as:
 * * **First Input Delay** (FID): For the first interaction on the page, how responsive was it?
 * * **Interaction to Next Paint** (INP): Highest value of interaction latency on the page
 * * **Incremental Interaction to Next Paint** (IINP): Highest value of interaction latency for the current navigation
 *
 * ## Interaction Phases
 *
 * Each interaction on the page can be broken down into three phases:
 *
 * * **Input Latency**: How long it took for the browser to trigger event handlers for the physical interaction
 * * **Processing Latency**: How long it takes for all event handlers to execute
 * * **Presentation Latency**: How long it takes to draw the next frame (visual update)
 *
 * FID and INP/IINP measure different phases of interactions.
 *
 * ## First Input Delay
 *
 * If the user interacts with the page, the EventTiming plugin will measure how
 * long it took for the JavaScript event handler to fire (Input Latency).
 *
 * This can give you an indication of the page being otherwise busy and unresponsive
 * to the user if the callback is delayed.
 *
 * Processing Latency and Presentation Latency are not included in the First Input Delay calculation.
 *
 * This time (measured in milliseconds) is added to the beacon as `et.fid`.
 *
 * ## Interation to Next Paint
 *
 * After every interaction on the page, the total interaction duration is measured.
 *
 * The sum of the input, processing and presentation latency for each interaction is
 * calculated as that interactions' _Interaction to Next Paint_.
 *
 * For every page load, Boomerang will report on (one of) the longest interactions
 * as the page's _Interaction to Next Paint_ (INP) metric.  For page with less than 50
 * interactions, INP is the worst interaction.  For pages with over 50 interactions,
 * INP is the 98th percentile interaction.
 *
 * This time (measured in milliseconds) is added to the beacon as `et.inp`, on the
 * Unload beacon.
 *
 * ## Incremental Interation to Next Paint
 *
 * Boomerang will also add the "Incremental INP" (incremental being since the last beacon)
 * as `et.inp.inc`.
 *
 * For MPA websites, this means the Page Load beacon will have an Incremental INP (if
 * any interactions happened before the Page Load event).  The Unload beacon's `et.inp`
 * will be the "final" INP value.
 *
 * For SPA websites, the SPA Hard and all SPA Soft beacons will contain an Incremental INP,
 * which tracks any interactions since the previous Hard/Soft beacon.  This way you can
 * track INP for long-lived SPA websites, split by each route.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * All beacon parameters are prefixed with `et.`.
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `et.e`: Compressed EventTiming events
 * * `et.fid`: Observed First Input Delay
 * * `et.inp`: Interaction to Next Paint (full page, on Unload beacon)
 * * `et.inp.e`: INP target element
 * * `et.inp.t`: INP timestamp that the interaction occurred
 * * `et.inp.inc`: Incremental Interaction to Next Paint (for the Page Load and each SPA Soft nav)
 * * `et.inp.inc.e`: Incremental INP target element
 * * `et.inp.inc.t`: Incremental INP timestamp that the interaction occurred
 *
 * @see {@link https://github.com/w3c/event-timing/}
 * @class BOOMR.plugins.EventTiming
 */
(function() {
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.EventTiming) {
    return;
  }

  /**
   * Event names
   */
  var EVENT_TYPES = {
    "click": 0,
    "dblclick": 1,
    "mousedown": 2,
    "mouseup": 3,
    "mousemove": 4,
    "touchstart": 5,
    "touchend": 6,
    "touchmove": 7,
    "keydown": 8,
    "keyup": 9,
    "keypress": 10,
    "wheel": 11,
    "pointerdown": 12,
    "pointerup": 13,
    "pointermove": 14,
    "compositionstart": 17,
    "compositionupdate": 18,
    "compositionend": 19,
    "contextmenu": 20,
    "pointerover": 21,
    "mouseover": 22,
    "pointerenter": 23,
    "auxclick": 24,
    "beforeinput": 25,
    "dragend": 26,
    "dragenter": 27,
    "dragleave": 28,
    "dragover": 29,
    "dragstart": 30,
    "drop": 31,
    "gotpointercapture": 32,
    "input": 33,
    "lostpointercapture": 34,
    "mouseenter": 35,
    "mouseleave": 36,
    "mouseout": 37,
    "pointercancel": 38,
    "pointerleave": 39,
    "pointerout": 40,
    "touchcancel": 41
  };

  /**
   * Maximum number of EventTiming entries to keep (by default).
   *
   * The number of entries kept will affect INP calculations, as it
   * uses the 98th percentile.
   */
  var MAX_ENTRIES_DEFAULT = 100;

  /**
   * EventTiming duration threshold.
   *
   * The spec's default value is 104, and minimum possible is 16.
   *
   * We set to 16 to be notified of the maximum number of EventTiming events
   * possible.
   */
  var DURATION_THRESHOLD_DEFAULT = 16;

  /**
   * Private implementation
   */
  var impl = {
    /**
     * Whether or not we've initialized yet
     */
    initialized: false,

    /**
     * Whether or not the browser supports EventTiming (cached value)
     */
    supported: null,

    /**
     * The PerformanceObserver for 'event'
     */
    observerEvent: null,

    /**
     * The PerformanceObserver for 'firstInput'
     */
    observerFirstInput: null,

    /**
     * List of EventTiming entries
     */
    entries: [],

    /**
     * Maximum number of EventTiming entries to keep (after which, no new entries are added).
     *
     * Set to -1 for unlimited.
     */
    maxEntries: MAX_ENTRIES_DEFAULT,

    /**
     * EventTiming event Duration threshold
     */
    durationThreshold: DURATION_THRESHOLD_DEFAULT,

    /**
     * Map of page interactions (excluding those since last beacon),
     * split by Interaction ID
     */
    interactions: {},

    /**
     * Map of page interactions since last beacon
     */
    interactionsSinceLastBeacon: {},

    /**
     * First Input Delay (calculated)
     */
    firstInputDelay: null,

    /**
     * Time to First Interaction
     */
    timeToFirstInteraction: null,

    /**
     * Executed on `before_beacon`
     */
    onBeforeBeacon: function() {
      var i;

      // gather all stored entries since last beacon
      if (impl.entries && impl.entries.length) {
        var compressed = [];

        for (i = 0; i < impl.entries.length; i++) {
          var entry = {
            n: typeof EVENT_TYPES[impl.entries[i].name] !== "undefined" ?
              EVENT_TYPES[impl.entries[i].name] : impl.entries[i].name,
            s: Math.round(impl.entries[i].startTime).toString(36),
            d: Math.round(impl.entries[i].duration).toString(36),
            p: Math.round(impl.entries[i].processingEnd -
              impl.entries[i].processingStart).toString(36),
            c: impl.entries[i].cancelable ? 1 : 0,
            fi: impl.entries[i].entryType === "first-input" ? 1 : undefined,
            i: impl.entries[i].interactionId ? impl.entries[i].interactionId.toString(36) : undefined
          };

          if (impl.entries[i].target) {
            entry.t = BOOMR.utils.makeSelector(impl.entries[i].target);
          }

          compressed.push(entry);
        }

        BOOMR.addVar("et.e", BOOMR.utils.serializeForUrl(compressed), true);
      }

      // clear until the next beacon
      impl.entries = [];

      // First Input Delay
      if (impl.firstInputDelay !== null) {
        BOOMR.addVar("et.fid", Math.ceil(impl.firstInputDelay), true);

        // should only go out on one beacon
        impl.firstInputDelay = null;
      }

      // Incremental Interaction to Next Paint
      var iinp = BOOMR.plugins.EventTiming.metrics
        .interactionToNextPaintData(impl.interactionsSinceLastBeacon);

      if (iinp) {
        BOOMR.addVar("et.inp.inc", iinp.duration, true);
        BOOMR.addVar("et.inp.inc.e", iinp.target, true);
        BOOMR.addVar("et.inp.inc.t", iinp.startTime, true);
      }

      // put all interactionsSinceLastBeacon into interactions
      for (var interactionId in impl.interactionsSinceLastBeacon) {
        impl.interactions[interactionId] = impl.interactionsSinceLastBeacon[interactionId];
      }

      // clear our interactions since last beacon
      impl.interactionsSinceLastBeacon = {};
    },

    /**
     * Fired as the page is unloading
     */
    onPageUnload: function(data) {
      // merge any recent interactions into the full interactions list
      // NOTE: Object.assign is OK to use as all browsers w/ EventTiming support Object.assign
      Object.assign(impl.interactions, impl.interactionsSinceLastBeacon);

      // Interaction to Next Paint
      var inp = BOOMR.plugins.EventTiming.metrics
        .interactionToNextPaintData(impl.interactions);

      if (inp) {
        BOOMR.addVar("et.inp", inp.duration, true);
        BOOMR.addVar("et.inp.e", inp.target, true);
        BOOMR.addVar("et.inp.t", inp.startTime, true);
      }
    },

    /**
     * Fired on each EventTiming event
     *
     * @param {object[]} list List of EventTimings
     */
    onEventTiming: function(list) {
      var entries = list.getEntries();

      // look for the max INP
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].interactionId) {
          //
          // If interactionId is missing or 0, it means it's not a real
          // user interaction (e.g. !isTrusted or not a specific interaction event).
          // In this case, we won't use these EventTiming events for INP calculation.
          //
          // Ref:
          // https://www.w3.org/TR/2022/WD-event-timing-20220524/#sec-computing-interactionid
          //
          continue;
        }

        var interactionId = entries[i].interactionId;

        // save the max duration for this interaction
        impl.interactionsSinceLastBeacon[interactionId] = impl.interactionsSinceLastBeacon[interactionId] || {};

        // update the latest duration
        if (!impl.interactionsSinceLastBeacon[interactionId].duration ||
          entries[i].duration > impl.interactionsSinceLastBeacon[interactionId].duration) {
          // this duration is higher than what we saw for this ID before
          impl.interactionsSinceLastBeacon[interactionId] = {
            duration: Math.ceil(entries[i].duration),
            target: BOOMR.utils.makeSelector(entries[i].target),
            startTime: Math.floor(entries[i].startTime)
          };
        }
      }

      // add to our tracked entries
      if (impl.maxEntries > 0 && impl.entries.length >= impl.maxEntries) {
        return;
      }

      // note we may add a few extra beyond maxEntries if the list is more than one
      impl.entries = impl.entries.concat(entries);
    },

    /**
     * Fired on each FirstInput event
     *
     * @param {object[]} list List of EventTimings
     */
    onFirstInput: function(list) {
      var i,
          newEntries = list.getEntries();
      var fid = newEntries[0];

      impl.entries = impl.entries.concat(newEntries);

      impl.firstInputDelay = Math.ceil(fid.processingStart - fid.startTime);

      // TTFI -- can be offset by Prerendered activationStart
      impl.timeToFirstInteraction = BOOMR.getPrerenderedOffset(Math.floor(fid.startTime));

      // consider FID for INP
      impl.interactionsSinceLastBeacon.fid = {
        duration: Math.ceil(fid.duration),
        target: BOOMR.utils.makeSelector(fid.target),
        startTime: Math.floor(fid.startTime)
      };
    }
  };

  //
  // Exports
  //
  BOOMR.plugins.EventTiming = {
    /**
     * Initializes the plugin.
     *
     * @param {object} config Configuration
     * @param {boolean} [config.EventTiming.maxEntries=100] Maximum number of EventTiming entries to track, set
     *  to -1 for unlimited
     * @param {number} [config.EventTiming.durationThreshold=16] EventTiming duration threshold
     *
     * @returns {@link BOOMR.plugins.EventTiming} The EventTiming plugin for chaining
     * @memberof BOOMR.plugins.EventTiming
     */
    init: function(config) {
      BOOMR.utils.pluginConfig(
        impl,
        config,
        "EventTiming",
        ["enabled", "maxEntries", "durationThreshold"]);

      // skip initialization if not supported
      if (!this.is_supported()) {
        impl.initialized = true;
      }

      if (!impl.initialized) {
        BOOMR.subscribe("before_beacon", impl.onBeforeBeacon, null, impl);

        try {
          var w = BOOMR.window;

          impl.observerEvent = new w.PerformanceObserver(impl.onEventTiming);
          impl.observerEvent.observe({
            type: ["event"],
            buffered: true,
            durationThreshold: impl.durationThreshold
          });

          impl.observerFirstInput = new w.PerformanceObserver(impl.onFirstInput);
          impl.observerFirstInput.observe({
            type: ["first-input"],
            buffered: true
          });
        }
        catch (e) {
          impl.supported = false;
        }

        // Send some data (e.g. INP) at Unload
        BOOMR.subscribe("page_unload", impl.onPageUnload, null, impl);

        impl.initialized = true;
      }

      return this;
    },

    /**
     * Whether or not this plugin is complete
     *
     * @returns {boolean} `true` if the plugin is complete
     * @memberof BOOMR.plugins.EventTiming
     */
    is_complete: function() {
      return true;
    },

    /**
     * Whether or not this plugin is enabled and EventTiming is supported.
     *
     * @returns {boolean} `true` if EventTiming plugin is enabled and supported.
     * @memberof BOOMR.plugins.EventTiming
     */
    is_enabled: function() {
      return impl.initialized && this.is_supported();
    },

    /**
     * Whether or not EventTiming is supported in this browser.
     *
     * @returns {boolean} `true` if EventTiming is supported.
     * @memberof BOOMR.plugins.EventTiming
     */
    is_supported: function() {
      var p;

      if (impl.supported !== null) {
        return impl.supported;
      }

      var w = BOOMR.window;

      // check for getEntriesByType and the entry type existing
      var p = BOOMR.getPerformance();

      impl.supported = p &&
        typeof w.PerformanceEventTiming !== "undefined" &&
        typeof w.PerformanceObserver === "function";

      if (impl.supported) {
        BOOMR.info("This user agent supports EventTiming", "et");
      }

      return impl.supported;
    },

    /**
     * Stops observing
     *
     * @memberof BOOMR.plugins.EventTiming
     */
    stop: function() {
      if (impl.observerEvent) {
        impl.observerEvent.disconnect();
        impl.observerEvent = null;
      }

      if (impl.observerFirstInput) {
        impl.observerFirstInput.disconnect();
        impl.observerFirstInput = null;
      }
    },

    /**
     * Exported metrics
     *
     * @memberof BOOMR.plugins.EventTiming
     */
    metrics: {
      /**
       * Calculates the EventTiming count
       */
      count: function() {
        return impl.entries.length;
      },

      /**
       * Calculates the average EventTiming duration
       */
      averageDuration: function() {
        if (impl.entries.length === 0) {
          return 0;
        }

        var sum = 0;

        for (var i = 0; i < impl.entries.length; i++) {
          sum += impl.entries[i].duration;
        }

        return sum / impl.entries.length;
      },

      /**
       * Returns the observed First Input Delay
       */
      firstInputDelay: function() {
        return impl.firstInputDelay;
      },

      /**
       * Returns the observed Time to First Interaction
       */
      timeToFirstInteraction: function() {
        return impl.timeToFirstInteraction;
      },

      /**
       * Returns the Interaction to Next Paint metric for the session.
       */
      interactionToNextPaint: function() {
        // merge both maps
        // NOTE: Object.assign is OK to use as all browsers w/ EventTiming support Object.assign
        var interactions = Object.assign({}, impl.interactions, impl.interactionsSinceLastBeacon);

        // Interaction to Next Paint from the combined list
        var inp = this.interactionToNextPaintData(interactions);

        return inp ? inp.duration : undefined;
      },

      /**
       * Returns the Incremental Interaction to Next Paint (since last beacon)
       */
      incrementalInteractionToNextPaint: function() {
        var iinp = this.interactionToNextPaintData(impl.interactionsSinceLastBeacon);

        return iinp ? iinp.duration : undefined;
      },

      /**
       * Returns the INP details (duration, target, timestamp) based on the input
       * interaction array.
       *
       * @param {object} interactions Interactions map to use.
       */
      interactionToNextPaintData: function(interactions) {
        if (typeof Object.values !== "function") {
          // Object.values not supported, must be an older browser that doesn't support INP anyway
          return null;
        }

        // reverse-sort all durations
        var durations = Object.values(interactions || impl.interactions).sort(function(a, b) {
          return b.duration - a.duration;
        });

        // If interactionCount is not supported, we don't know how to calculate anything other than
        // the maximum INP.  If interactionCount is less than 50, the 98th percentile is also the max.
        // NOTE: Discussion on interactionCount is in https://github.com/w3c/event-timing/issues/117
        if (!("interactionCount" in performance)) {
          return durations[0];
        }

        var percentileIndex = Math.floor(performance.interactionCount * 0.02);

        if (percentileIndex >= durations.length) {
          percentileIndex = durations.length - 1;
        }

        return durations[percentileIndex];
      }
    }
  };
}());
