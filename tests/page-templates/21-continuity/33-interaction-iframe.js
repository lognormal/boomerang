/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ttfi"]);

describe("e2e/21-continuity/33-interaction-iframe", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent the Time to First Interaction (c.ttfi)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.ttfi"]);
    var ttfi = parseInt(b["c.ttfi"], 10);

    if (t.isNavigationTimingSupported()) {
      var st = parseInt(b["rt.tstart"], 10);

      assert.closeTo(st + ttfi, window.ttfi, 50);
    }
    else {
      assert.operator(ttfi, ">=", 0);
    }
  });

  it("Should have the interaction timeline (c.t.inter)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.t.inter"]);
    assert.operator(b["c.t.inter"].length, ">=", 1);
  });

  it("Could have the interaction delay timeline (c.t.interdly)", function() {
    var b = tf.lastBeacon();

    if (b["c.i.a"]) {
      assert.isDefined(b["c.t.interdly"]);
      assert.operator(b["c.t.interdly"].length, ">=", 1);
    }
  });

  it("Could have interaction delay metrics (c.i.a, c.i.dc and c.i.dt) in all except Safari", function() {
    if (t.isSafari()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    if (!b["c.i.a"]) {
      assert.operator(parseInt(b["c.i.a"], 10), ">=", 1);
      assert.operator(parseInt(b["c.i.dc"], 10), ">=", 1);
      assert.operator(parseInt(b["c.i.dc"], 10), "<=", 10);
      assert.operator(parseInt(b["c.i.dt"], 10), ">=", 1);
    }
  });

  it("Should not have interaction delay metrics (c.i.a, c.i.dc and c.i.dt) in Safari", function() {
    if (!t.isSafari()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isUndefined(b["c.i.a"]);
    assert.isUndefined(b["c.i.dc"]);
    assert.isUndefined(b["c.i.dc"]);
    assert.isUndefined(b["c.i.dt"]);
  });

  it("Should have First Input Delay (c.fid) in all except Safari", function() {
    if (t.isSafari()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.fid"]);
    assert.operator(parseInt(b["c.fid"], 10), ">=", 19);  // we had a 20ms busy wait, allow for some fuzzing
  });

  it("Should not have First Input Delay (c.fid) in Safari", function() {
    if (!t.isSafari()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isUndefined(b["c.fid"]);
  });
});
