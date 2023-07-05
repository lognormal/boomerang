/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ev"]);

describe("e2e/21-continuity/42-keydown-cancellable-false", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent the key count (c.k)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.k"]);
    assert.equal(parseInt(b["c.k"], 10), 3);
  });

  it("Should have sent the esc key count (c.k.e)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.k.e"]);
    assert.equal(parseInt(b["c.k.e"], 10), 3);
  });

  it("Should have sent the log (c.l)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.l"]);
  });

  it("Should have logged the correct events (c.l)", function() {
    var b = tf.lastBeacon();

    var keyLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
      // LOG_TYPE_KEY === 3
      return obj.type === 3;
    });

    assert.equal(keyLogs.length, 3);
  });

  it("Should have the key timeline (c.t.key)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.t.key"]);
    assert.operator(b["c.t.key"].length, ">=", 1);
  });

  it("Should not have the interaction timeline (c.t.inter)", function() {
    var b = tf.lastBeacon();

    assert.isUndefined(b["c.t.inter"]);
  });

  it("Should not have the Time to First Interaction (c.ttfi)", function() {
    var b = tf.lastBeacon();

    assert.isUndefined(b["c.ttfi"]);
  });

  it("Should not have First Input Delay (c.fid)", function() {
    var b = tf.lastBeacon();

    assert.isUndefined(b["c.fid"]);
  });
});
