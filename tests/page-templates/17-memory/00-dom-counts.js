/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/00-dom-counts", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have found 3 images", function() {
		assert.equal(tf.lastBeacon()["dom.img"], 3);
	});

	it("Should have found 2 external images", function() {
		assert.equal(tf.lastBeacon()["dom.img.ext"], 2);
	});

	it("Should have found 1 unique external images", function() {
		assert.equal(tf.lastBeacon()["dom.img.uniq"], 1);
	});

	it("Should have found 12 scripts (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script"], 12);
	});

	it("Should have found 13 scripts (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script"], 13);
	});

	it("Should have found 13 scripts (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script"], 13);
	});

	it("Should have found 7 external scripts (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script.ext"], 7);
	});

	it("Should have found 8 external scripts (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script.ext"], 8);
	});

	it("Should have found 8 external scripts (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script.ext"], 8);
	});

	it("Should have found 6 unique external scripts (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script.uniq"], 6);
	});

	it("Should have found 7 unique external scripts (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script.uniq"], 7);
	});

	it("Should have found 7 unique external scripts (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.script.uniq"], 7);
	});

	it("Should have found 3 iframes (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe"], 3);
	});

	it("Should have found 2 iframes (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe"], 2);
	});

	it("Should have found 2 iframes (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe"], 2);
	});

	it("Should have found 2 external iframes (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe.ext"], 2);
	});

	it("Should have found 0 external iframes (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon()["dom.iframe.ext"]);
	});

	it("Should have found 0 external iframes (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon()["dom.iframe.ext"]);
	});

	it("Should have found 1 unique external iframes (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe.uniq"], 1);
	});

	it("Should have found 1 unique external iframes (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe.uniq"], 1);
	});

	it("Should have found 1 unique external iframes (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.iframe.uniq"], 1);
	});

	it("Should have found 3 links (when Snippet was in IFRAME mode)", function() {
		if (!t.snippetWasLoadedIframe()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.link"], 3);
	});

	it("Should have found 3 links (when Snippet was in SCRIPT mode)", function() {
		if (!t.snippetWasLoadedScript()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.link"], 3);
	});

	it("Should have found 4 links (when Snippet was in Preload mode)", function() {
		if (!t.snippetWasLoadedPreload()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["dom.link"], 4);
	});

	it("Should have found 2 stylessheets", function() {
		assert.equal(tf.lastBeacon()["dom.link.css"], 2);
	});

	it("Should have found 1 unique stylesheets", function() {
		assert.equal(tf.lastBeacon()["dom.link.css.uniq"], 1);
	});
});
