/* eslint-env mocha */
/* global BOOMR,BOOMR_test,assert */

describe("common", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;
  var assert = window.chai.assert;

  // Get a performance.now() polyfill that doesn't rely on BOOMR.now
  var dateNow =
    (function() {
      return Date.now || function() {
        return new Date().getTime();
      };
    }());
  var perfNow = dateNow;

  if ("performance" in window && window.performance && typeof window.performance.now === "function") {
    perfNow = function() {
      if (window.performance && typeof window.performance.now === "function" && !window.performance.now.isCustom) {
        return Math.round(window.performance.now() + window.performance.timing.navigationStart);
      }
      else {
        // might've been deleted via BOOMR_test.removeNavigationTimingSupport()
        return dateNow();
      }
    };
  }

  /**
   * Validates an page load beacon
   */
  function testPageLoadBeacon(b, prefix) {
    // TODO
    assert.isUndefined(b.pgu, prefix + "does not have the pgu param");
    assert.isUndefined(b["xhr.pg"], prefix + "does not have the xhr.pg param");
  }

  /**
   * Validates an spa_hard beacon
   */
  function testSpaHardBeacon(b, prefix) {
    assert.isUndefined(b.api, prefix + "does not have the api param");
    assert.isUndefined(b["xhr.pg"], prefix + "does not have the xhr.pg param");

    if (!t.doNotTestSpaAbort) {
      assert.isUndefined(b["rt.abld"], prefix + "does not have the rt.abld param");
      assert.isUndefined(b["rt.quit"], prefix + "does not have the rt.quit param");
    }
  }

  /**
   * Validates an spa soft beacon
   */
  function testSpaSoftBeacon(b, prefix) {
    var fieldsUndefined = [
      "api",
      "xhr.pg",
      "nt_nav_st",
      "nt_fet_st",
      "nt_dns_st",
      "nt_dns_end",
      "nt_con_st",
      "nt_con_end",
      "nt_req_st",
      "nt_res_st",
      "nt_res_end",
      "nt_domloading",
      "nt_domint",
      "nt_domcontloaded_st",
      "nt_domcontloaded_end",
      "nt_domcomp",
      "nt_load_st",
      "nt_load_end",
      "nt_unload_st",
      "nt_unload_end",
      "nt_enc_size",
      "nt_dec_size",
      "nt_trn_size",
      "nt_protocol",
      "nt_first_paint",
      "nt_red_cnt",
      "nt_nav_type"
    ],
        field;

    if (!t.doNotTestSpaAbort) {
      assert.isUndefined(b["rt.abld"], prefix + "does not have the rt.abld param");
      assert.isUndefined(b["rt.quit"], prefix + "does not have the rt.quit param");
    }

    for (var i = 0; i < fieldsUndefined.length; i++) {
      field = fieldsUndefined[i];
      assert.isUndefined(b[field], prefix + field + " must not be on spa soft beacon");
    }
  }

  /**
   * Validates an xhr beacon
   */
  function testXhrBeacon(b, prefix) {
    assert.isUndefined(b.api, prefix + "does not have the api param");
    assert.isDefined(b.pgu, prefix + "has the pgu param");
    assert.isUndefined(b["h.pg"], prefix + "does not have the h.pg param");
  }

  /**
   * Validates an early beacon against the load beacon
   */
  function testEarlyBeacon(early, normal) {
    var i, field, timer, timers,
        early_timers = {},
        normal_timers = {};

    // Don't test h.pg, we'll do some magic in the tests to make sure page params runs twice

    // Not yet tested:
    // "vis.st",
    // "dom.res",
    // "dom.doms",
    // "mem.total",
    // "mem.limit",
    // "mem.used",
    // "scr.xyv",
    // "scr.bpp",
    // "scr.orn",
    // "scr.dpx",
    // "cpu.cnc",
    // "dom.ln",
    // "dom.sz",
    // "dom.img",
    // "dom.script",
    // "dom.script.ext",
    // "dom.iframe",
    // "dom.iframe.ext",
    // "dom.link",

    // fields that should be the same on both beacons
    var fieldsEqual = [
      "h.key",
      "rt.start",
      "rt.bmr",
      "rt.tstart",
      "rt.nstart",
      "rt.bstart",
      "rt.blstart",
      "rt.si",
      "rt.ss",
      "rt.sstr_dur",
      "rt.sstr_to",
      "v",
      "pid",
      "ua.plt",
      "ua.vnd",
      "u",
      "nt_red_cnt",
      "nt_nav_type",
      "nt_nav_st",
      "nt_red_st",
      "nt_red_end",
      "nt_fet_st",
      "nt_dns_st",
      "nt_dns_end",
      "nt_con_st",
      "nt_con_end",
      "nt_req_st",
      "nt_res_st",
      "nt_res_end",
      "nt_domloading",
      "nt_domint",
      "nt_domcontloaded_st",
      "nt_domcontloaded_end",
      "nt_unload_st",
      "nt_unload_end",
      "nt_domcomp",
      "nt_load_st",
      // load could have ended in the case of SPA hard
      "nt_load_end",
      "nt_first_paint",
      "nt_spdy",
      "nt_cinf",
      "if",
      "vis.pre",
      "t_configls",
      "t_domloaded",
      "t_load",
      "t_prerender",
      "t_postrender"
    ];

    // fields that should not be on early beacon
    var fieldsUndefined = [
      // no page load timing available yet
      "t_resp",
      "t_page",
      "t_done",
      // no restiming on early beacons
      "restiming"
    ];

    // fields that should be the same on both beacons if available
    var fieldsEqualIfExists = [
      // may not be there if config loaded from localStorage
      "rt.cnf",
      "t_configfb",
      "t_configjs"
    ];

    // fields that must be on the early beacon
    var fieldsMustExist = [
      "rt.end",
      "rt.tt",
      "early"
    ];

    for (i = 0; i < fieldsEqual.length; i++) {
      field = fieldsEqual[i];

      if (field.indexOf("nt_") === 0 && (!(field in early) || early[field] === 0)) {
        // nav timing fields may be 0 or missing on the early beacon
        continue;
      }

      if (typeof normal[field] === "undefined") {
        assert.isUndefined(early[field], field + " must not be on early beacon if not on the load beacon");
      }
      else {
        assert.equal(normal[field], early[field], field + " " + normal[field] + " === " +  early[field]);
      }
    }

    for (i = 0; i < fieldsUndefined.length; i++) {
      field = fieldsUndefined[i];
      assert.isUndefined(early[field], field + " must not be on early beacon");
    }

    for (i = 0; i < fieldsEqualIfExists.length; i++) {
      field = fieldsEqualIfExists[i];

      if (typeof early[field] !== "undefined") {
        assert.equal(normal[field], early[field], field + " " + normal[field] + " === " +  early[field]);
      }
    }

    for (i = 0; i < fieldsMustExist.length; i++) {
      field = fieldsMustExist[i];
      assert.isDefined(early[field], field + " must exist");
    }

    // rt.sl should be 1 less on the early beacon
    assert.equal(parseInt(normal["rt.sl"], 10), parseInt(early["rt.sl"], 10) + 1,
      "session length " + normal["rt.sl"] + " === " +  early["rt.sl"] + " + 1");

    // rt.obo should be equal or 1 more on the normal beacon (if navtiming not supported)
    if (early["rt.obo"] !== normal["rt.obo"] && (parseInt(early["rt.obo"], 10) + 1) !== parseInt(normal["rt.obo"], 10)) {
      assert.fail("rt.obo must be equal or 1 more on normal beacon");
    }

    // t_other, if a timer is on the early beacon then it must be on the normal beacon
    if (early.t_other) {
      if (normal.t_other) {
        normal_timers = t.parseTimers(normal.t_other);
        early_timers = t.parseTimers(early.t_other);

        for (timer in early_timers) {
          if (early_timers.hasOwnProperty(timer)) {
            if (timer.indexOf("custom") === 0) {
              // custom timers may get longer (eg. ResourceGroups matching several resources)
              assert.operator(normal_timers[timer], ">=", early_timers[timer],
                "t_other  " + timer + " " + normal_timers[timer] + " >= " +  early_timers[timer]);
            }
            else {
              assert.equal(normal_timers[timer], early_timers[timer],
                "t_other  " + timer + " " + normal_timers[timer] + " === " +  early_timers[timer]);
            }
          }
        }
      }
      else {
        assert.fail("t_other on early beacon but missing on the normal beacon");
      }
    }

    // http.initiator must be the same in both beacons (even if it is undefined)
    assert.equal(early["http.initiator"], normal["http.initiator"], "both beacons should have the same initiator (http.initiator)");
  };

  it("Should have sent beacons that pass basic validation", function() {
    var i, b, tm,
        now = perfNow(),
        prefix, nextb;

    if (!tf.beacons.length) {
      return this.skip();
    }

    for (i = 0; i < tf.beacons.length; i++) {
      b = tf.beacons[i];
      prefix = "ensure beacon " + (i + 1) + " ";

      assert.equal(b.n, i + 1, prefix + "has the correct beacon number");

      assert.equal(b.v, BOOMR.version, prefix + "has the boomerang version");

      if (BOOMR.snippetVersion) {
        assert.equal(b.sv, BOOMR.snippetVersion, prefix + "has the boomerang snippet version");
      }

      if (BOOMR.snippetMethod) {
        assert.equal(b.sm, BOOMR.snippetMethod, prefix + "has the boomerang snippet method");
      }

      assert.equal(b["h.key"], window.BOOMR_API_key, prefix + "has the correct API key (h.key)");
      assert.isDefined(b["h.d"], prefix + "has the domain (h.d) param");

      assert.isDefined(b["h.t"], prefix + "has the time (h.t) param");

      if (!b.early) {
        // not early beacon
        if (typeof b["rt.sl"] !== "undefined") {
          assert.operator(parseInt(b["rt.sl"], 10), ">", 0);
        }
      }
      else {
        // early beacon
        if (typeof b["rt.sl"] !== "undefined") {
          assert.operator(parseInt(b["rt.sl"], 10), ">=", 0);
        }

        assert.operator(i + 1, "<", tf.beacons.length, prefix + "(early) is not the last beacon");
        nextb = tf.beacons[i + 1];
        assert.isUndefined(nextb.early, "(early) should not be followed by another early beacon");
        testEarlyBeacon(b, nextb);
      }

      if (window.BOOMR_LOGN_always !== true) {
        assert.equal(b["h.cr"], "abc", prefix + "has the correct crumb (h.cr)");
      }
      else {
        assert.isDefined(b["h.cr"], prefix + "has the crumb (h.cr)");
      }

      if (!t.doNotTestErrorsParam) {
        assert.isUndefined(b.errors, prefix + "does not have the errors param");
      }

      if (b["rt.start"] === "navigation") {
        // page load beacon
        testPageLoadBeacon(b, prefix);
      }
      else if (b["rt.start"] === "manual") {
        if (b["http.initiator"] === "spa_hard") {
          // spa hard beacon
          testSpaHardBeacon(b, prefix);
        }
        else if (b["http.initiator"] === "spa") {
          // spa soft beacon
          testSpaSoftBeacon(b, prefix);
        }
        else if (b["http.initiator"] === "xhr") {
          // xhr beacon
          testXhrBeacon(b, prefix);
        }
        else if (b["http.initiator"] === "click") {
          // click (AutoXHR) beacon
          assert.isUndefined(b.api, prefix + "does not have the api param");
          assert.isDefined(b.pgu, prefix + "has the pgu param");
        }
        else if (b["http.initiator"] === "api_custom_metric") {
          // send metric beacon
          assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
          assert.equal(b["api.v"], "2", prefix + "has api version equal to 2");
          assert.equal(b["api.l"], "boomr", prefix + "has the api source equal to boomr");
        }
        else if (b["http.initiator"] === "api_custom_timer") {
          // send timer beacon
          assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
          assert.equal(b["api.v"], "2", prefix + "has api version equal to 2");
          assert.equal(b["api.l"], "boomr", prefix + "has the api source equal to boomr");
        }
        else if (b["http.initiator"] === "error") {
          // error beacon
          assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
        }
        else if (b["http.initiator"] === "bfcache") {
          // BFCache navigation
          assert.equal(b["rt.start"], "manual", prefix + "has rt.start set to manual");
        }
        else if (b["http.initiator"] === "interaction") {
          // Interaction beacon
          // nothing special
        }
        else if (typeof b["http.initiator"] === "undefined") {
          // requestStart and/or responseEnd initiated beacon
          // TODO
        }
        else {
          // invalid
          assert.fail(prefix + "with a rt.start=manual has a valid http.initiator, was:" + b["http.initiator"]);
        }
      }
      else if (b["rt.start"] === "none") {
        if (b["http.initiator"] === "spa_hard") {
          // spa hard beacon
          testSpaHardBeacon(b, prefix);
        }
        else if (b["http.initiator"] === "spa") {
          // spa soft beacon
          testSpaSoftBeacon(b, prefix);
        }
        else {
          // TODO
        }
      }
      else if (b["rt.start"] === "cookie") {
        // TODO
      }
      else if (b["rt.start"] === "csi") {
        // TODO
      }
      else if (b["rt.start"] === "gtb") {
        // TODO
      }
      else if (typeof b["rt.start"] === "undefined") {
        if (b["http.initiator"] === "error") {
          // error beacon
          assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
        }
        else if (b["rt.quit"] !== "undefined") {
          // unload beacon
        }
        else {
          // invalid
          assert.fail(prefix + "has a valid rt.start, was:" + b["rt.start"]);
        }
      }
      else {
        // invalid
        assert.fail(prefix + "has a valid rt.start, was: " + b["rt.start"]);
      }
    }
  });

  it("Should have sent beacons with the same Page ID (pid)", function() {
    var pid, i, prefix, b;

    if (!tf.beacons.length) {
      return this.skip();
    }

    pid = tf.beacons[0].pid;
    for (i = 0; i < tf.beacons.length; i++) {
      b = tf.beacons[i];
      prefix = "ensure beacon " + (i + 1) + " ";
      assert.lengthOf(b.pid, 8, prefix + "has a page ID (pid) with a length equal to 8");
      assert.equal(b.pid, pid, prefix + "has the same pid as first beacon");
    }
  });

  it("Should have sent beacons with valid timers", function() {
    var i, j, b, prefix, timer;
    var TIMERS = [
      "t_done",
      "t_resp",
      "t_page",
      "rt.tt",
      "mob.rtt",
      "pt.fp",
      "pt.fcp",
      "pt.lcp",
      "rt.sstr_dur"
    ];

    if (!tf.beacons.length) {
      return this.skip();
    }

    for (i = 0; i < tf.beacons.length; i++) {
      b = tf.beacons[i];
      prefix = "ensure beacon " + (i + 1) + " ";

      if (typeof b["rt.tstart"] !== "undefined" && typeof b["rt.end"] !== "undefined" && typeof b.t_done !== "undefined") {
        assert.equal(parseInt(b["rt.end"]) - parseInt(b["rt.tstart"]), parseInt(b.t_done), prefix + "has rt.end - rt.tstart == t_done");
      }

      for (var j = 0; j < TIMERS.length; j++) {
        timer = TIMERS[j];

        if (typeof b[timer] !== "undefined") {
          assert.operator(parseInt(b[timer], 10), ">=", 0, prefix + "has a positive '" + timer + "' timer");
          assert.operator(parseInt(b[timer], 10), "<", 10 * 60 * 1000, prefix + "has a sane value for '" + timer + "' timer");
        }
      }
    }
  });

  it("BUG: Should have sent beacons without negative custom timers", function() {
    var i, b, prefix, timers, timer;

    if (!tf.beacons.length) {
      return this.skip();
    }

    for (i = 0; i < tf.beacons.length; i++) {
      b = tf.beacons[i];
      prefix = "ensure beacon " + (i + 1) + " ";

      if (b.t_other) {
        timers = t.parseTimers(b.t_other);
        for (timer in timers) {
          if (timers.hasOwnProperty(timer)) {
            // TODO: this test reveals a bug, see Issue #626
            // assert.isTrue(timers[timer] >= 0, prefix + "has a positive 't_other." + timer + "' timer");
            if (timers[timer] < 0) {
              return this.skip();
            }

            if (b[timer + "_st"]) {
              assert.operator(parseInt(b[timer + "_st"], 10), ">=", 0, prefix + "has a positive '" + timer + "_st' value");
            }
          }
        }
      }
    }
  });

  it("Should have sent beacons with valid epoch times", function() {
    var i, j, b, prefix, param, tm,
        now = perfNow();
    var TIMES = [
      "h.t",
      "rt.tstart",
      "rt.end",
      "rt.ss",
      "t.bstart",
      "nt_nav_st",
      "nt_fet_st",
      "nt_dns_st",
      "nt_dns_end",
      "nt_con_st",
      "nt_con_end",
      "nt_req_st",
      "nt_res_st",
      "nt_res_end",
      "nt_domloading",
      "nt_domint",
      "nt_domcontloaded_st",
      "nt_domcontloaded_end",
      "nt_domcomp",
      "nt_load_st",
      "nt_load_end",
      "nt_unload_st",
      "nt_unload_end",
      "nt_ssl_st",
      "nt_first_paint"
    ];

    if (!tf.beacons.length) {
      return this.skip();
    }

    for (i = 0; i < tf.beacons.length; i++) {
      b = tf.beacons[i];
      prefix = "ensure beacon " + (i + 1) + " ";

      for (var j = 0; j < TIMES.length; j++) {
        param = TIMES[j];

        if (b.nt_bad && param.match(/^nt_/)) {
          // don't check navtiming timers, they were detected as bad
          continue;
        }

        if (typeof b[param] !== "undefined") {
          tm = parseInt(b[param], 10);

          if (tm === 2997993600000) {
            // this future timestamp is used for debugging
            continue;
          }

          // now +- an hour. Cloud based Simulators/Emulators might have clock skew
          assert.closeTo(tm, now, (70 * 60 * 1000), prefix + "has " + param + "  as a valid timestamp");
        }
      }
    }
  });

  it("AutoXHR: Should not have pending events", function(done) {
    if (t.isConsentConsentInlinePluginOptedOut()) {
      this.skip();
    }

    t.ifAutoXHR(
      done,
      function() {
        var events = BOOMR.plugins.AutoXHR.getMutationHandler().pending_events;

        events = BOOMR.utils.arrayFilter(events, function(val) {
          return typeof val !== "undefined";
        });
        assert.lengthOf(events, 0);
        done();
      },
      this.skip.bind(this)
    );
  });

  it("User-Agent Deprecation: If navigator.userAgentData is available, ensure navigator.userAgentData.platform is used instead of navigator.platform", function() {
    if (window.navigator.userAgentData &&
        !window.navigator.userAgentData.testOverride &&
        tf.lastBeacon() &&
        tf.lastBeacon()["ua.plt"]) {
      assert.isString(tf.lastBeacon()["ua.plt"], "ua.plt is not a string");
      assert.equal(tf.lastBeacon()["ua.plt"], navigator.userAgentData.platform);
    }
  });

  it("Should not access navigator.platform if navigator.userAgentData.platform exists", function() {
    if (window._BOOMR_navigatorCheck) {
      throw window._BOOMR_navigatorCheck;
    }
  });

  it("Should not access navigator.userAgent if navigator.userAgentData exists", function() {
    if (window._BOOMR_userAgentCheck) {
      throw window._BOOMR_userAgentCheck;
    }
  });

  it("Should not leak global variables", function() {
    var leakedVariables = BOOMR_test.findGlobalLeaks(
      window,
      BOOMR_test.initialGlobals.concat(BOOMR_test.addedGlobals),
      BOOMR_test.globalProps(window));

    assert.deepEqual(leakedVariables, []);
  });
});
