/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/28-rt/05-prerendered-activated-while-prerendering-before-back-end-time", function() {
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

  it("Should have NOT reduced the perceived Load Time (t_done)", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var navSt = parseInt(tf.lastBeacon().nt_nav_st, 10);
    var loadEnd = parseInt(tf.lastBeacon().nt_load_end, 10);

    var loadTime = loadEnd - navSt;

    // allow for rounding
    assert.closeTo(tf.lastBeacon().t_done, loadTime, 1);
  });

  it("Should have NOT reduced the perceived Front-End Time (t_page)", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var respSt = parseInt(tf.lastBeacon().nt_res_st, 10);
    var loadEnd = parseInt(tf.lastBeacon().nt_load_end, 10);

    var pageTime = loadEnd - respSt;

    // allow for rounding
    assert.closeTo(tf.lastBeacon().t_page, pageTime, 1);
  });

  it("Should have reduced the Back-End Time (t_resp) by the activation time", function() {
    if (!t.isNavigationTiming2Supported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var navSt = parseInt(tf.lastBeacon().nt_nav_st, 10);
    var actSt = parseInt(tf.lastBeacon().nt_act_st, 10);
    var respSt = parseInt(tf.lastBeacon().nt_res_st, 10);

    var respTime = respSt - navSt;
    var actTime = actSt - navSt;

    // allow for rounding
    assert.closeTo(tf.lastBeacon().t_resp, respTime - actTime, 1);
  });
});
