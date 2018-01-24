/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/02-onclick", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	it("Should have sent at least 2 beacons, 1x onload, 1x xhr", function(done) {
		if (window.MutationObserver && typeof window.MutationObserver === "function") {

			t.ifAutoXHR(
				done,
				function() {
					assert.lengthOf(tf.beacons, 2);
					done();
				}
			);
		}
		else {
			assert.lengthOf(tf.beacons, 1);
			this.skip();
		}
	});

	it("Should have the first beacon URL of the page as 'u'", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[0].u, "02-onclick.html");
					done();
				});
		}
		else {
			this.skip();
		}
	});

	it("Should have the second beacon URL of the image as 'u'", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1].u, "img.jpg");
					done();
				});
		}
		else {
			this.skip();
		}
	});

	it("Should have the second beacon http.initiator = 'click'", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1]["http.initiator"], "click");
					done();
				});
		}
		else {
			this.skip();
		}
	});
});
