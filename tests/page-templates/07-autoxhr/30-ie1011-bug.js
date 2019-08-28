/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/30-ie1011-bug", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(5000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should have the XHR beacon have the complete data", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.isTrue(t.xhrValue.indexOf("1340") !== -1, "XHR data is complete");
				done();
			},
			this.skip.bind(this));
	});

	it("Should have waited for the IMG to load (if MutationObserver is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (t.isMutationObserverSupported()) {
					assert.operator(tf.beacons[1].t_done, ">=", 3000);
					done();
				}
				else {
					this.skip();
				}
			}.bind(this),
			this.skip.bind(this));
	});

	it("Should not have waited for the IMG to load (if MutationObserver is not supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (!t.isMutationObserverSupported()) {
					assert.operator(tf.beacons[1].t_done, "<", 1000);
					done();
				}
				else {
					this.skip();
				}
			}.bind(this),
			this.skip.bind(this));
	});

	it("Should have loaded right away (if ResourceTiming is not supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (!t.isResourceTimingSupported()) {
					assert.operator(tf.beacons[1].t_done, ">=", 0);
					done();
				}
				else {
					this.skip();
				}
			}.bind(this),
			this.skip.bind(this));
	});
});
