/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/00-dom-counts", function() {
	var tf = BOOMR.plugins.TestFramework;

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

	it("Should have found 12 scripts", function() {
		assert.equal(tf.lastBeacon()["dom.script"], 12);
	});

	it("Should have found 7 external scripts", function() {
		assert.equal(tf.lastBeacon()["dom.script.ext"], 7);
	});

	it("Should have found 6 unique external scripts", function() {
		assert.equal(tf.lastBeacon()["dom.script.uniq"], 6);
	});

	it("Should have found 3 iframes", function() {
		assert.equal(tf.lastBeacon()["dom.iframe"], 3);
	});

	it("Should have found 2 external iframes", function() {
		assert.equal(tf.lastBeacon()["dom.iframe.ext"], 2);
	});

	it("Should have found 1 unique external iframes", function() {
		assert.equal(tf.lastBeacon()["dom.iframe.uniq"], 1);
	});

	it("Should have found 3 links", function() {
		assert.equal(tf.lastBeacon()["dom.link"], 3);
	});

	it("Should have found 2 stylessheets", function() {
		assert.equal(tf.lastBeacon()["dom.link.css"], 2);
	});

	it("Should have found 1 unique stylesheets", function() {
		assert.equal(tf.lastBeacon()["dom.link.css.uniq"], 1);
	});
});
