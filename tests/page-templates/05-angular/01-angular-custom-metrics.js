/*eslint-env mocha*/
/*global BOOMR_test,assert*/

/*
* This app uses a delayed angular.bootstrap (and no ng-app)
* directive.
*/
describe("e2e/05-angular/01-angular-custom-metrics", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function() {
		// only one beacon should've been sent
		assert.equal(tf.beacons.length, 1);
	});

	it("Should have the custom metric 1 - JavaScript var - having been updated by the Angular App", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet1, 11);
	});

	it("Should have the custom metric 2 - JavaScript function - having been updated by the Angular App", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet2, 22);
	});

	it("Should be missing custom metric 3 - undefined JavaScript var", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet3, undefined);
	});

	it("Should have the custom metric 4 - XPath - having been added by the Angular App", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet4, 444.44);
	});

	it("Should have the custom metric 5 - URL", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet5, 1);
	});
});
