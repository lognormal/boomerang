/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/15-cross-domain/07-invalid-domain-url", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should NOT have \"rt.sstr_dur\" NOR \"rt.sstr_to\" beacon param since we're not transferring anything", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["rt.sstr_dur"]);
		assert.isUndefined(b["rt.sstr_to"]);
	});
});
