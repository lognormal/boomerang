/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["PerformanceEventTiming", "POs", "curStartTime", "generateEvent"]);

describe("e2e/31-eventtiming/06-inp-counts-many-interactions-2", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    assert.isTrue(tf.fired_onbeacon);
  });

  describe("Page Load beacon", function() {
    it("Should not have included Interaction to Next Paint (et.inp) on the Page Load beacon", function() {
      assert.isUndefined(tf.beacons[0]["et.inp"]);
    });

    it("Should not have included Interaction to Next Paint target (et.inp.e) on the Page Load beacon", function() {
      assert.isUndefined(tf.beacons[0]["et.inp.e"]);
    });

    it("Should not have included Interaction to Next Paint timestamp (et.inp.t) on the Page Load beacon", function() {
      assert.isUndefined(tf.beacons[0]["et.inp.t"]);
    });

    it("Should have set Incremental Interaction to Next Paint (et.inp.inc) to be the 11th largest interaction on the Unload beacon, based on 500+ interactions", function() {
      assert.equal(parseInt(tf.beacons[0]["et.inp.inc"], 10), 100);
    });

    it("Should have included Incremental Interaction to Next Paint target (et.inp.inc.e) on the Page Load beacon", function() {
      assert.equal(tf.beacons[0]["et.inp.inc.e"], "span#interaction-target");
    });

    it("Should have included Incremental Interaction to Next Paint timestamp (et.inp.inc.t) on the Page Load beacon", function() {
      assert.operator(parseInt(tf.beacons[0]["et.inp.inc.t"], 10), ">=", 0);
    });
  });

  describe("Unload beacon", function() {
    it("Should have set Interaction to Next Paint (et.inp) to be the 11th largest interaction on the Unload beacon, based on 500+ interactions", function() {
      assert.equal(parseInt(tf.beacons[1]["et.inp"], 10), 100);
    });

    it("Should have included Interaction to Next Paint target (et.inp.e) on the Unload beacon", function() {
      assert.equal(tf.beacons[1]["et.inp.e"], "span#interaction-target");
    });

    it("Should have included Interaction to Next Paint timestamp (et.inp.t) on the Unload beacon", function() {
      assert.operator(parseInt(tf.beacons[1]["et.inp.t"], 10), ">=", 0);
    });

    it("Should not have included Incremental Interaction to Next Paint (et.inp.inc) on the Unload beacon", function() {
      assert.isUndefined(tf.beacons[1]["et.inc.inp"]);
    });

    it("Should not have included Incremental Interaction to Next Paint target (et.inp.inc.e) on the Unload beacon", function() {
      assert.isUndefined(tf.beacons[1]["et.inp.inc.e"]);
    });

    it("Should not have included Incremental Interaction to Next Paint timestamp (et.inp.inc.t) on the Unload beacon", function() {
      assert.isUndefined(tf.beacons[1]["et.inp.inc.t"]);
    });
  });
});
