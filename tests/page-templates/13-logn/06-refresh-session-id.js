/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/13-logn/06-refresh-session-id", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have Session ID on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isDefined(b["rt.si"]);
		assert.isTrue(b["rt.si"].indexOf("abc-123-xyz") === 0);
		assert.notInclude(b["rt.si"], "undefined");
	});

	it("Should have Session ID on the second beacon", function() {
		var b = tf.beacons[1];

		assert.isDefined(b["rt.si"]);
		assert.isTrue(b["rt.si"].indexOf("abc-123-xyz") === 0);
		assert.notInclude(b["rt.si"], "undefined");
	});

	it("Should have BOOMR.session.ID", function() {
		assert.isDefined(BOOMR.session.ID);
		assert.isTrue(BOOMR.session.ID.indexOf("abc-123-xyz") === 0);
		assert.notInclude(BOOMR.session.ID, "undefined");
	});
});
