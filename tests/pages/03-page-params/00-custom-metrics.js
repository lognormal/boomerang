/*eslint-env mocha*/
/*global assert*/

describe("e2e/03-page-params/00-custom-metrics", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should find XPath Currency value", function() {
		assert.isString(tf.lastBeaconData["cmet.XpathCurrency"]);
		assert.equal("143.12", tf.lastBeaconData["cmet.XpathCurrency"]);
	});
});
