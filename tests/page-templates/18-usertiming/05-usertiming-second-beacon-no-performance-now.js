/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-usertiming/05-usertiming-second-beacon-no-performance-now", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should receive user timing data for marks/measures set before load beacon only", function() {
		if (t.isUserTimingSupported()) {
			var b = tf.beacons[0];
			assert.isString(b.usertiming);

			var data = UserTimingDecompression.decompressUserTiming(b.usertiming);
			var usertiming = {};

			for (var i = 0; i < data.length; i++) {
				usertiming[data[i].name] = data[i];
			}

			assert.isTrue("pre-load-mark-start" in usertiming);
			assert.isTrue("pre-load-mark-end" in usertiming);
			assert.isTrue("pre-load-measure" in usertiming);

			assert.isFalse("post-load-mark-start" in usertiming);
			assert.isFalse("post-load-mark-end" in usertiming);
			assert.isFalse("post-load-measure" in usertiming);
		}
	});

	it("Should receive user timing data for marks/measures set before post-load beacon only", function() {
		if (t.isUserTimingSupported()) {
			var b = tf.beacons[1];
			assert.isString(b.usertiming);

			var data = UserTimingDecompression.decompressUserTiming(b.usertiming);
			var usertiming = {};

			for (var i = 0; i < data.length; i++) {
				usertiming[data[i].name] = data[i];
			}

			assert.isTrue("post-load-mark-start" in usertiming);
			assert.isTrue("post-load-mark-end" in usertiming);
			assert.isTrue("post-load-measure" in usertiming);

			assert.isFalse("pre-load-mark-start" in usertiming);
			assert.isFalse("pre-load-mark-end" in usertiming);
			assert.isFalse("pre-load-measure" in usertiming);
		}
	});
});
