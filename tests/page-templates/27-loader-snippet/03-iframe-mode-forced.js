/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/27-loader-snippet/03-iframe-mode-forced", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should not have used the SCRIPT Snippet method (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		assert.isFalse(t.snippetWasLoadedScript());
	});

	it("Should have set sm=i (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		assert.equal("i", tf.lastBeacon().sm);
	});

	it("Should have used the IFRAME Snippet method (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		assert.isTrue(t.snippetWasLoadedIframe());
	});

	it("Should not have used the Preload Snippet method", function() {
		assert.isFalse(t.snippetWasLoadedPreload());
	});

	it("Should have added a IFRAME with src 'about:blank' (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal("about:blank", iframe.src);
	});

	it("Should have added a IFRAME to the same block (BODY) as the loader snippet (if not IE)", function() {
		if (!t.supportsLoaderIframe() || t.isIE()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.parentNode.tagName, "BODY");
	});

	it("Should have added a IFRAME to HEAD (if IE 8-11)", function() {
		if (!t.supportsLoaderIframe() || !t.isIE()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.parentNode.tagName, "HEAD");
	});

	it("Should have added a IFRAME with title '' (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.strictEqual(iframe.title, "");
	});

	it("Should have added a IFRAME with role 'presentation' (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.role, "presentation");
	});

	it("Should have added a IFRAME with loading 'eager' (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.loading, "eager");
	});

	it("Should have added a IFRAME with width 0 (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.width, 0);
	});

	it("Should have added a IFRAME with height 0 (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.height, 0);
	});

	it("Should have added a IFRAME with border '0px' (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.include(iframe.style.border, "0px");
	});

	it("Should have added a IFRAME with display 'none' (if not IE 6/7)", function() {
		if (!t.supportsLoaderIframe()) {
			return this.skip();
		}

		var iframe = t.findBoomerangLoaderFrame();

		assert.equal(iframe.style.display, "none");
	});
});
