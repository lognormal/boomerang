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
			},
			this.skip.bind(this));
	});

	function check(b, ms) {
		assert.closeTo(b.t_done, ms, 250);
		assert.closeTo(b.nt_res_end - b.nt_req_st, b.t_resp, 250);

		if (b.nt_fet_st) {
			// not avail in PhantomJS
			assert.ok(b.nt_fet_st <= b.nt_req_st, "nt_fet_st should be at most nt_req_st");
		}

		assert.ok(b.nt_req_st <= b.nt_res_st, "nt_req_st should be at most nt_res_st");
		assert.ok(b.nt_res_st <= b.nt_res_end, "nt_res_st should be at most nt_res_end");
		assert.ok(b.nt_res_end <= b.nt_load_st, "nt_res_end should be at most nt_load_st");
	}

	describe("Beacon 2 (xhr)", function() {
		var i = 1;
		it("Should have a time of around around " + window.xhrTimes[i - 1] + " ms", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					check(tf.beacons[i], window.xhrTimes[i - 1]);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (xhr)", function() {
		var i = 2;
		it("Should have a time of around around " + window.xhrTimes[i - 1] + " ms", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					check(tf.beacons[i], window.xhrTimes[i - 1]);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 4 (xhr)", function() {
		var i = 3;
		it("Should have a time of around around " + window.xhrTimes[i - 1] + " ms", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					check(tf.beacons[i], window.xhrTimes[i - 1]);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 5 (xhr)", function() {
		var i = 4;
		it("Should have a time of around around " + window.xhrTimes[i - 1] + " ms", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					check(tf.beacons[i], window.xhrTimes[i - 1]);
					done();
				},
				this.skip.bind(this));
		});
	});
};
