/*eslint-env mocha*/
/*global chai*/

describe("e2e/28-mobile/00-md5-plugin-not-included", function() {
	var assert = chai.assert;
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should return actual URL when MD5 is not present in BOOMR.utils", function() {
			var b = tf.lastBeacon()
			assert.equal(b["nu"], 'https://www.example.com/test-click.html')
	});
});