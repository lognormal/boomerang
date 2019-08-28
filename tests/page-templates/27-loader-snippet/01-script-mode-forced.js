/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/27-loader-snippet/01-script-mode-forced", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have used the SCRIPT Snippet method (if forcing the SCRIPT method is supported)", function() {
		if (!window.forcedSnippetScript) {
			return this.skip();
		}

		assert.isTrue(t.snippetWasLoadedScript());
	});

	it("Should have set sm=s (if forcing the SCRIPT method is supported)", function() {
		if (!window.forcedSnippetScript) {
			return this.skip();
		}

		assert.equal("s", tf.lastBeacon().sm);
	});

	it("Should not have used the IFRAME Snippet method (if forcing the SCRIPT method is supported)", function() {
		if (!window.forcedSnippetScript) {
			return this.skip();
		}

		assert.isFalse(t.snippetWasLoadedIframe());
	});

	it("Should not have used the Preload Snippet method", function() {
		assert.isFalse(t.snippetWasLoadedPreload());
	});

	it("Should have added a SCRIPT with id 'boomr-async' (if forcing the SCRIPT method is supported)", function() {
		if (!window.forcedSnippetScript) {
			return this.skip();
		}

		assert.isNotNull(t.findBoomerangLoaderScript());
	});

	it("Should have added a SCRIPT to the same block (BODY) as the loader snippet (if not IE)", function() {
		if (window.isIE && !window.isEdge) {
			return this.skip();
		}

		assert.strictEqual(t.findBoomerangLoaderScript().parentNode.tagName, "BODY");
	});

	it("Should have added a SCRIPT to the HEAD (if IE and if forcing the SCRIPT method is supported)", function() {
		if (!window.forcedSnippetScript) {
			return this.skip();
		}

		if (!window.isIE || window.isEdge) {
			return this.skip();
		}

		assert.strictEqual(t.findBoomerangLoaderScript().parentNode.tagName, "HEAD");
	});
});
