/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/26-iframedelay/04-iframedelay-co", function() {

	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	function getIFrameBeacon(id, callback) {
		function handler(event) {
			var data = JSON.parse(event.data);
			if (data && data.msg === "beacon") {
				if (window.addEventListener) {
					window.removeEventListener("message", handler);
				}
				else {
					window.dettachEvent("onmessage", handler);
				}
				callback(data.data);
			}
		}

		if (window.addEventListener) {
			window.addEventListener("message", handler);
		}
		else {
			window.attachEvent("onmessage", handler);
		}

		// ask the iframe for lastBeacon data
		document.getElementById(id).contentWindow.postMessage(JSON.stringify({msg: "lastBeacon"}), "*");
	}

	function ensureBeaconCountIFrame(id, count, callback) {
		function handler(event) {
			var data = JSON.parse(event.data);
			if (data && data.msg === "count") {
				if (window.addEventListener) {
					window.removeEventListener("message", handler);
				}
				else {
					window.dettachEvent("onmessage", handler);
				}
				if (!data.data) {
					assert.fail("ensureBeaconCount failed");
				}
				callback();
			}
		}

		if (window.addEventListener) {
			window.addEventListener("message", handler);
		}
		else {
			window.attachEvent("onmessage", handler);
		}

		// ask the iframe for lastBeacon data
		document.getElementById(id).contentWindow.postMessage(JSON.stringify({msg: "ensureBeaconCount", count: count}), "*");
	}

	it("The base page should have only sent one page load beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	it("IFrame 1 Should have only sent one page load beacon", function(done) {
		ensureBeaconCountIFrame("frame1", 1, done);
	});

	it("IFrame 2 Should have only sent one page load beacon", function(done) {
		ensureBeaconCountIFrame("frame2", 1, done);
	});

	describe("IFrame 1 Beacon 1 (onload)", function() {
		var id = "frame1";
		it("Should have a t_done greater than 1500ms", function(done) {
			this.timeout(10000);
			getIFrameBeacon(id, function(b) {
				assert.operator(b.t_done, ">=", 1500);
				done();
			});
		});

		it("Should not have a loaded boomerang in an child iframe", function(done) {
			this.timeout(10000);
			getIFrameBeacon(id, function(b) {
				assert.isUndefined(b["if"]);
				done();
			});
		});
	});

	describe("IFrame 2 Beacon 1 (onload)", function() {
		var id = "frame2";
		it("Should have a t_done greater than 1500ms", function(done) {
			this.timeout(10000);
			getIFrameBeacon(id, function(b) {
				assert.operator(b.t_done, ">=", 1500);
				done();
			});
		});

		it("Should not have a loaded boomerang in an child iframe", function(done) {
			this.timeout(10000);
			getIFrameBeacon(id, function(b) {
				assert.isUndefined(b["if"]);
				done();
			});
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

		it("Should have rt.end of the slowest iframe", function(done) {
			var b = tf.lastBeacon(), bf1, bf2;
			getIFrameBeacon("frame1", function(b1) {
				bf1 = b1;
				getIFrameBeacon("frame2", function(b2) {
					bf2 = b2;
					var loadEnd = Math.max(bf1["rt.end"], bf2["rt.end"]);
					assert.equal(b["rt.end"], loadEnd);
					done();
				});
			});
		});
	});
});
