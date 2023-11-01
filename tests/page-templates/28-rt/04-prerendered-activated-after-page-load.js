/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/28-rt/04-prerendered-activated-after-page-load", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should not have sent a beacon while prerendering", function() {
    assert.isUndefined(BOOMR_test.sentWhilePrerendering);
  });

  it("Should have set nt_act_st on the beacon", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var navSt = parseInt(tf.lastBeacon().nt_nav_st, 10);
    var actSt = parseInt(tf.lastBeacon().nt_act_st, 10);

    assert.equal(actSt - navSt, BOOMR_test.fakeActivationStartOffset);
  });

  it("Should have set the perceived Load Time (t_done) to 1ms", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    assert.equal(tf.lastBeacon().t_done, 1);
  });

  it("Should have set the Front-End Time (t_page) to 1 ms", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    assert.equal(tf.lastBeacon().t_page, 1);
  });

  it("Should have set the Back-End Time (t_resp) to 0", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    assert.equal(tf.lastBeacon().t_resp, 0);
  });
});
