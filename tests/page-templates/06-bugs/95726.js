/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/95726", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should send a beacon", function(){
		assert.isTrue(tf.fired_onbeacon);
	});
});
