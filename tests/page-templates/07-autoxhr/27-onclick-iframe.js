/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/27-onclick-iframe", function() {
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
			done();
		}
	});

	it("Should not have '[object Object]' as the xhr.pg", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.notEqual(typeof tf.beacons[1]["xhr.pg"], "object");
					done();
				});
		}
		else {
			done();
		}
	});

	it("Should have the IFRAME URL as the 'u'", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1].u, "/delay");
					done();
				});
		}
		else {
			done();
		}
	});

	it("Should have 'click' as the 'http.initiator'", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[1]["http.initiator"], "click");
					done();
				});
		}
		else {
			done();
		}
	});
});
