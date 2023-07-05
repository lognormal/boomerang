/* eslint-env mocha */
/* global assert */
/* eslint no-loop-func:0 */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["xhrTimes"]);

describe("e2e/07-autoxhr/21-xhrs-duplicate-tao", function() {
  BOOMR_test.templates.XHR["00-xhrs-duplicate"]();
});
