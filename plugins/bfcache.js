/**
 * Tracks Back-Forward Cache (BFCache) Navigations.
 *
 * This plugin will send a "BFCache" beacon every time a BFCache navigation occurs, and will
 * include the "Not Restored Reasons" when a Back-Forward navigation wasn't a BFCache navigation.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `http.initiator=bfcache`: Designates this beacon as a BFCache navigation
 * * `rt.start=manual`: Since this is a non-Page Load beacon
 * * `t_done`: (Page Load Time) Set to the duration of the `pageshow` event
 * * `t_page`: (Front End Time) Matches `t_done` and is set to the duration of the `pageshow` event
 * * `t_resp`: (Back End Time) Set to 0
 * * `rt.tstart`: (Event start) Set to the timestamp of the `pageshow` event
 * * `rt.end`: (Event end) Set to the timestamp when the `pageshow` event fired
 * * `nt_nav_type`: Set to Back-Forward Navigation (`1`)
 * * `pt.fcp`: First Contentful Paint (from two `requestAnimationFrame`s)
 * * `pt.lcp`: Largest Contentful Paint (from two `requestAnimationFrame`s)
 * * `bfc.nrr`: BFCache "Not Restored Reasons" (list of strings) if BFCache
 *              wasn't possible (for regular Back-Forward navigations)
 *
 * @class BOOMR.plugins.BFCache
 */

(function() {
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.BFCache) {
    return;
  }

  /* BEGIN_DEBUG */
  function debugLog(msg) {
    BOOMR.debug(msg, "BFCache");
  }
  /* END_DEBUG */

  var impl = {
    //
    // Configuration
    //
    /**
     * Minimum amount of time (in milliseconds) that a user must stay on the page
     * after a BFCache navigation for it to count and a beacon will be sent.
     *
     * This is to avoid rapid back-back-back BFCache navigations sending multiple beacons
     * if the user is not staying on the intermediate pages.
     */
    minimumDwellTime: 500,

    //
    // State
    //
    /**
     * Whether or not we're initialized
     */
    initialized: false,

    /**
     * Not Restored Reasons (if a back-forward nav was not a BFCache nav)
     */
    notRestoredReasons: undefined,

    /**
     * Whether or not Not Restored Reasons were sent on the Page Load beacon
     */
    hasSentNotRestoredReasons: false,

    /**
     * After getting a BFCache navigation, this timeout is set to minimumDwellTime,
     * after which a beacon is sent.  If it's reset to false, no beacon will be sent.
     */
    dwellTimeout: false,

    /**
     * Send a BFCache beacon
     *
     * @param {string} edata Event data
     * @param {number} pageShowStart pageshow event callback time
     * @param {number} fcpLcp FCP and LCP time
     */
    sendBeacon: function(edata, pageShowStart, fcpLcp) {
      var p = BOOMR.getPerformance();

      var restoreDuration = Math.floor(pageShowStart - edata.timeStamp);

      // Increment session length
      BOOMR.plugins.RT.incrementSessionDetails();

      // Mark as a BFCache nav
      BOOMR.addVar("http.initiator", "bfcache");
      BOOMR.addVar("rt.start", "manual");

      // All timing is categorized as front-end time
      BOOMR.addVar("t_done", restoreDuration, true);
      BOOMR.addVar("t_page", restoreDuration, true);

      // No back-end time
      BOOMR.addVar("t_resp", 0, true);

      // Set start / End times
      BOOMR.addVar("rt.tstart", Math.floor(edata.timeStamp + p.timing.navigationStart), true);
      BOOMR.addVar("rt.end", Math.floor(pageShowStart + p.timing.navigationStart), true);

      // Technically a Back-Forward Navigation
      BOOMR.addVar("nt_nav_type", 1);

      // FCP and LCP
      BOOMR.addVar("pt.fcp", Math.floor(fcpLcp - pageShowStart), true);
      BOOMR.addVar("pt.lcp", Math.floor(fcpLcp - pageShowStart), true);

      // Let other plugins add data to the bfcache beacon
      BOOMR.fireEvent("bfcache", edata);

      // Send it!
      debugLog("Sending BFCache beacon");

      BOOMR.sendBeacon();
    },

    /**
     * Callback for 'pagehide' events
     *
     * @param {Event} e pagehide Event
     */
    onPageHide: function(e) {
      // stop a BFCache beacon from being sent if we're in the dwell period
      if (impl.dwellTimeout) {
        clearTimeout(impl.dwellTimeout);

        impl.dwellTimeout = false;
      }

      /* BEGIN_DEBUG */
      debugLog("pagehide detected");

      if (e && !e.persisted) {
        debugLog("Not able to be restored");
      }
      else {
        debugLog("Might be restored later!");
      }
      /* END_DEBUG */
    },

    /**
     * Callback for 'pageshow' events
     *
     * @param {Event} e pageshow Event
     */
    onPageShow: function(e) {
      var pageShowStart = BOOMR.hrNow();

      debugLog("pageshow detected", e);

      if (!e.persisted) {
        debugLog("Was not persisted");
      }
      else {
        debugLog("Was restored!");

        // measure FCP and LCP by running two rAFs (suggested per web-vitals.js)
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            var fcpLcp = BOOMR.hrNow();

            // wait for the minimum dwell time before sending the beacon
            impl.dwellTimeout = setTimeout(function() {
              // only send a beacon if our timeout hasn't been reset (e.g. via pagehide)
              if (impl.dwellTimeout) {
                impl.sendBeacon(e, pageShowStart, fcpLcp);
              }

              impl.dwellTimeout = false;
            }, impl.minimumDwellTime);
          });
        });
      }
    },

    /**
     * Callback for the before_beacon event
     *
     * @param {object} e Event data
     */
    onBeforeBeacon: function(e) {
      if (!BOOMR.isPageLoadBeacon(e) ||
          impl.hasSentNotRestoredReasons) {
        // only send it on the first page load beacon, once
        return;
      }

      var reasons = BOOMR.plugins.BFCache.notRestoredReasons();

      if (reasons) {
        BOOMR.addVar("bfc.nrr", reasons, true);
      }

      // only send once
      impl.hasSentNotRestoredReasons = true;
    }
  };

  BOOMR.plugins.BFCache = {
    /**
     * Initializes the plugin.
     *
     * @param {object} config Configuration
     * @param {number} config.minimumDwellTime Minimum dwell time before a beacon is sent
     *
     * @returns {@link BOOMR.plugins.BFCache} The BFCache plugin for chaining
     * @memberof BOOMR.plugins.BFCache
     */
    init: function(config) {
      // gather config and config overrides
      BOOMR.utils.pluginConfig(impl, config, "BFCache",
        ["minimumDwellTime"]);

      // skip re-initialization
      if (impl.initialized) {
        return this;
      }

      // Origin trial: Expires Aug 8, 2023 / Chrome 114
      var metaTag = document.createElement("meta");

      metaTag.httpEquiv = "origin-trial";
      metaTag.content = "A2uWz2bbyoykT6h7LZQlNUdwVAFfb3IL5LU+YR1qxtW5T1dCRKjJ5/h3zur1LmuLWk0B1kyAAwyCxJzDCzNxUAQAAAB6" +
        "eyJvcmlnaW4iOiJodHRwczovL2FrYW1haS5jb206NDQzIiwiZmVhdHVyZSI6IkJhY2tGb3J3YXJkQ2FjaGVOb3RSZXN0b3JlZFJlYXNvbnMi" +
        "LCJleHBpcnkiOjE2OTE1MzkxOTksImlzVGhpcmRQYXJ0eSI6dHJ1ZX0=";
      document.head.append(metaTag);

      BOOMR.registerEvent("bfcache");

      // Listen for a pagehide and pageshow events
      BOOMR.utils.addListener(BOOMR.window, "pagehide", impl.onPageHide);
      BOOMR.utils.addListener(BOOMR.window, "pageshow", impl.onPageShow);

      // Add NRR to the first Page Load beacon
      var p = BOOMR.getPerformance();

      if (p &&
        typeof p.getEntriesByType === "function") {
        var navEntries = p.getEntriesByType("navigation");

        impl.notRestoredReasons = navEntries && navEntries[0] && navEntries[0].notRestoredReasons;

        if (impl.notRestoredReasons) {
          debugLog(impl.notRestoredReasons);

          BOOMR.subscribe("before_beacon", impl.onBeforeBeacon, null, impl);
        }
      }

      impl.initialized = true;

      return this;
    },

    /**
     * This plugin is always complete (ready to send a beacon)
     *
     * @returns {boolean} `true`
     * @memberof BOOMR.plugins.BFCache
     */
    is_complete: function() {
      return true;
    },

    /**
     * Gets the page's Not Restored Reasons (if any), joined by a comma
     *
     * @returns {string} String of Not Restored Reasons
     * @memberof BOOMR.plugins.BFCache
     */
    notRestoredReasons: function() {
      if (!impl.notRestoredReasons ||
          !impl.notRestoredReasons.blocked) {
        return;
      }

      // get top-level frame reasons
      var reasons = [];

      if (impl.notRestoredReasons.reasons.length) {
        reasons = [].concat(impl.notRestoredReasons.reasons);
      }

      // get any children frame ids or names
      if (impl.notRestoredReasons.children) {
        reasons = reasons.concat(impl.notRestoredReasons.children
          .filter(function(c) {
            return c.blocked;
          })
          .map(function(c) {
            if (c.id) {
              return "id-" + c.id;
            }
            else if (c.name) {
              return "name-" + c.name;
            }
            else {
              return "frame-unknown";
            }
          }));
      }

      return reasons.length ? reasons.join(",") : undefined;
    }

    /* BEGIN_DEBUG */,
    onPageShow: impl.onPageShow,
    onPageHide: impl.onPageHide
    /* END_DEBUG */
  };
}());
