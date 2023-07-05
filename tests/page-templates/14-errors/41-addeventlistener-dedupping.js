/* eslint-env mocha */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_script_delay", "handler", "attach"]);

describe("e2e/14-errors/41-addeventlistener-dedupping", function() {
  var tf = BOOMR.plugins.TestFramework;

  it("Should have only fired the foo handler once", function(done) {
    var b = tf.lastBeacon();

    assert.equal(b.foo, "bar");
    done();
  });
});
