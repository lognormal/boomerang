/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/87987", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should not have any errors", function() {
		assert.isUndefined(tf.lastBeacon().errors);
	});
});
