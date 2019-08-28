/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/27-loader-snippet/05-csp", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have used the Preload Snippet method (if Preload is supported)", function() {
		if (!t.supportsPreload()) {
			return this.skip();
		}

		assert.isTrue(t.snippetWasLoadedPreload());
	});

	it("Should not have used the Preload Snippet method (if Preload is not supported)", function() {
		if (t.supportsPreload()) {
			return this.skip();
		}

		assert.isFalse(t.snippetWasLoadedPreload());
	});

	it("Should have detected the CSP violation for the one script without a nonce (if SecurityPolicyViolationEvent is supported)", function() {
		if (typeof window.SecurityPolicyViolationEvent === "undefined") {
			return this.skip();
		}

		assert.equal(1, window.violations.length);
	});
});
