/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/94400", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should not have any errors", function(done) {
		BOOMR_test.ifAutoXHR(
			done,
			function() {
				assert.equal(typeof tf.lastBeacon().errors, "undefined");
				done();
			});
	});
});
