/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/18-usertiming/06-usertiming-no-compression", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have usertiming (if UserTiming is supported)", function() {
		if (t.isUserTimingSupported()) {
			var b = tf.beacons[0];
			assert.isString(b.usertiming);
			var data = JSON.parse(b.usertiming);
			assert.isTrue("mark" in data);
			var marks = data.mark;
			assert.isTrue("mark1" in marks);
			assert.isTrue("mark2" in marks);
			assert.isTrue("measure" in data);
			var measures = data.measure;
			assert.isTrue("measure1" in measures);
		}
	});
});
