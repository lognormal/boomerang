/*eslint-env mocha*/
/*global assert*/

describe("05-xhr-before-onload-alwayssendxhr", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 5 beacons: 1 onload, 4 xhr (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.lengthOf(tf.beacons, 5);
				done();
			});
	});

	it("First beacon should be an XHR, opened and completed before config", function() {
		var beacon = tf.beacons[0];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&1");
	});

	it("Second beacon should be an XHR, opened and completed after config, before onload", function() {
		var beacon = tf.beacons[1];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&2");
	});

	it("Third beacon should be the navigation beacon", function() {
		var beacon = tf.beacons[2];
		assert.isUndefined(beacon["http.initiator"]);
		assert.equal(beacon["rt.start"], "navigation");
	});

	it("Fourth beacon should be an XHR, opened before config, completed after config, after onload", function() {
		var beacon = tf.beacons[3];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&3");
		assert.isTrue(beacon.t_done > 2000);
	});

	it("Fifth beacon should be an XHR, opened and completed after config, after onload", function() {
		var beacon = tf.beacons[4];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&4");
	});

});
