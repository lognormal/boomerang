/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.XHR = BOOMR_test.templates.XHR || {};
BOOMR_test.templates.XHR["00-xhrs-duplicate"] = function() {

	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 5 beacons: 1 onload, 4 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(30000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 5);
			});
	});

	function check(b, secs) {
		assert.closeTo(b.t_done, secs * 1000, 250);
		assert.closeTo(b.nt_res_end - b.nt_req_st, secs * 1000, 250, "response should be close to " + secs + " seconds");
		if (b.nt_fet_st) {
			// not avail in PhantomJS
			assert.ok(b.nt_fet_st <= b.nt_req_st, "nt_fet_st should be at most nt_req_st");
		}
		assert.ok(b.nt_req_st <= b.nt_res_st, "nt_req_st should be at most nt_res_st");
		assert.ok(b.nt_res_st <= b.nt_res_end, "nt_res_st should be at most nt_res_end");
		assert.ok(b.nt_res_end <= b.nt_load_st, "nt_res_end should be at most nt_load_st");
	}

	it("Should have the next beacon contain a time of around around 0 seconds", function(done) {
		this.timeout(30000);
		t.ifAutoXHR(
			done,
			function() {
				check(tf.beacons[1], 0);
				done();
			});
	});

	it("Should have the next beacon contain a time of around around 1 seconds", function(done) {
		this.timeout(30000);
		t.ifAutoXHR(
			done,
			function() {
				check(tf.beacons[2], 1);
				done();
			});
	});

	it("Should have the next beacon contain a time of around around 2 seconds", function(done) {
		this.timeout(30000);
		t.ifAutoXHR(
			done,
			function() {
				check(tf.beacons[3], 2);
				done();
			});
	});

	it("Should have the next beacon contain a time of around around 3 seconds", function(done) {
		this.timeout(30000);
		t.ifAutoXHR(
			done,
			function() {
				check(tf.beacons[4], 3);
				done();
			});
	});
};
