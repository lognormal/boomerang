/*eslint-env mocha*/
/*eslint-disable no-loop-func*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/35-pci-input-values", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done){
		t.ensureBeaconCount(done, 1);
	});

	it("Should have set the PCI flag", function(){
		var b = tf.beacons[0];
		assert.equal(b.pci, 1);
	});

	for (var i = 0; i < VALUES.length; i++) {
		(function(n) {
			if (VALUES[n].block) {
				it("Should not have added the " + VALUES[n].value + " field via a Custom Dimension XPath", function(){
					var b = tf.beacons[0];
					assert.isUndefined(b["cdim." + n]);
				});

				it("Should have added the " + VALUES[n].value + " field to the pci.redacted list", function(){
					var b = tf.beacons[0];
					assert.include(b["pci.redacted"], "cdim." + n);
				});
			}
			else {
				it("Should have added the " + VALUES[n].value + " field via a Custom Dimension XPath", function(){
					var b = tf.beacons[0];
					assert.equal(b["cdim." + n], VALUES[n].sanitized || VALUES[n].value);
				});

				it("Should not have added the " + VALUES[n].value + " field to the pci.redacted list", function(){
					var b = tf.beacons[0];
					assert.notInclude(b["pci.redacted"], "cdim." + n);
				});
			}
		})(i);
	}
});
