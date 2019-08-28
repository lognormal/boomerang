/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/26-iframedelay/05-iframedelay-snippet", function() {

	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	function getIFrameBeacon(id) {
		return document.getElementById(id).contentWindow.BOOMR.plugins.TestFramework.lastBeacon();
	}

	it("The base page should have only sent one page load beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	it("IFrame 1 Should have only sent one page load beacon", function(done) {
		var w = document.getElementById("frame1").contentWindow;
		w.BOOMR_test.ensureBeaconCount(done, 1);
	});

	it("IFrame 2 Should have only sent one page load beacon", function(done) {
		var w = document.getElementById("frame2").contentWindow;
		w.BOOMR_test.ensureBeaconCount(done, 1);
	});

	describe("IFrame 1 Beacon 1 (onload)", function(done) {
		var id = "frame1";
		it("Should have a t_done greater than 1500ms", function() {
			var b = getIFrameBeacon(id);
			assert.operator(b.t_done, ">=", 1500);
		});
	});

	describe("IFrame 2 Beacon 1 (onload)", function(done) {
		var id = "frame2";
		it("Should have a t_done greater than 1500ms", function() {
			var b = getIFrameBeacon(id);
			assert.operator(b.t_done, ">=", 1500);
		});
	});

	describe("Base page Beacon 1", function() {
		it("Should have page_ready (pr) flag", function() {
			var b = tf.lastBeacon();
			assert.equal(b.pr, "1");
		});

		it("Should have ifdl.done param", function() {
			var b = tf.lastBeacon();
			assert.isDefined(b["ifdl.done"]);
		});

		it("Should have ifdl.ct param", function() {
			var b = tf.lastBeacon();
			assert.equal(b["ifdl.ct"], "2");
		});

		it("Should have ifdl.r param", function() {
			var b = tf.lastBeacon();
			assert.equal(b["ifdl.r"], "0");
		});

		it("Should have ifdl.mon param", function() {
			var b = tf.lastBeacon();
			assert.equal(b["ifdl.mon"], "2");
		});

		it("Should have rt.end of the slowest iframe", function() {
			var b = tf.lastBeacon(), bf1 = getIFrameBeacon("frame1"), bf2 = getIFrameBeacon("frame2");
			var loadEnd = Math.max(bf1["rt.end"], bf2["rt.end"]);
			assert.equal(b["rt.end"], loadEnd);
		});
	});
});
