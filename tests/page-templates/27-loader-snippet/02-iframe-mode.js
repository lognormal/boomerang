/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/27-loader-snippet/02-iframe-mode", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have used the IFRAME Snippet method (if not IE 6/7 and doesn't support Preload)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		if (t.supportsPreload()) {
			return this.skip();
		}

		assert.isTrue(t.snippetWasLoadedIframe());
	});

	it("Should have set sm=i (if not IE 6/7 and doesn't support Preload)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		if (t.supportsPreload()) {
			return this.skip();
		}

		assert.equal("i", tf.lastBeacon().sm);
	});
});
