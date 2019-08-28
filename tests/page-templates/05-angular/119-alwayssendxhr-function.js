/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/05-angular/119-alwayssendxhr-function.js", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
		clearTimeout(window.timerid);
	});

	it("Should have sent four beacons", function() {
		assert.equal(tf.beacons.length, 4);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have sent the first beacon with a URL of the page", function() {
		assert.isTrue(tf.beacons[0].u.indexOf("119-alwayssendxhr-function") !== -1);
	});

	it("Should have sent the second beacon as http.initiator = xhr", function() {
		assert.equal(tf.beacons[1]["http.initiator"], "xhr");
	});

	it("Should have sent the second beacon with a URL of the widget.html XHR that is alwaysSendXhr", function() {
		assert.include(tf.beacons[1].u, "widget.html");
	});

	it("Should have sent the second beacon with a Page URL of the app", function() {
		assert.isTrue(tf.beacons[1].pgu.indexOf("119-alwayssendxhr-function") !== -1);
	});

	it("Should have sent the second beacon with a duration of between 2 and 3 seconds", function() {
		assert.operator(tf.beacons[1].t_done, ">=", 2000);
		assert.operator(tf.beacons[1].t_done, "<=", 3000);
	});

	it("Should have sent the third beacon as http.initiator = spa", function() {
		assert.equal(tf.beacons[2]["http.initiator"], "spa");
	});

	it("Should have sent the third beacon with a URL of the widget", function() {
		assert.isTrue(tf.beacons[2].u.indexOf("/widgets/delay/1") !== -1);
	});

	it("Should have sent the third beacon with no pgu", function() {
		assert.isUndefined(tf.beacons[2].pgu);
	});

	it("Should have sent the third beacon with a duration of between 3 and 4 seconds", function() {
		assert.operator(tf.beacons[2].t_done, ">=", 3000);
		assert.operator(tf.beacons[2].t_done, "<=", 4000);
	});

	it("Should have sent the fourth beacon as http.initiator = spa", function() {
		assert.equal(tf.beacons[3]["http.initiator"], "spa");
	});

	it("Should have sent the fourth beacon with a URL of the page", function() {
		assert.isTrue(tf.beacons[3].u.indexOf("119-alwayssendxhr-function") !== -1);
	});

	it("Should have sent the fourth beacon with no pgu", function() {
		assert.isUndefined(tf.beacons[3].pgu);
	});
});
