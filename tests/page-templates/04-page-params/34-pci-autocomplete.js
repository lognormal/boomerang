/*eslint-env mocha*/
/*eslint-disable no-loop-func*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/34-pci-autocomplete", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done){
		t.ensureBeaconCount(done, 1);
	});

	it("Should have set the PCI flag", function(){
		var b = tf.beacons[0];
		assert.equal(b.pci, 1);
	});

	for (var i = 0; i < AUTOCOMPLETE_VALUES.length; i++) {
		(function(n) {
			if (AUTOCOMPLETE_VALUES[n].block) {
				it("Should not have added the " + AUTOCOMPLETE_VALUES[n].value + " field via a Custom Metric XPath", function(){
					var b = tf.beacons[0];
					assert.isUndefined(b["cmet" + n]);
				});

				it("Should have added the " + AUTOCOMPLETE_VALUES[n].value + " field to the pci.redacted list", function(){
					var b = tf.beacons[0];
					assert.include(b["pci.redacted"], "cmet" + n);
				});
			}
			else {
				it("Should have added the " + AUTOCOMPLETE_VALUES[n].value + " field via a Custom Metric XPath", function(){
					var b = tf.beacons[0];
					assert.equal(b["cmet" + n], n);
				});

				it("Should not have added the " + AUTOCOMPLETE_VALUES[n].value + " field to the pci.redacted list", function(){
					var b = tf.beacons[0];
					assert.notInclude(b["pci.redacted"], "cmet" + n);
				});
			}
		})(i);
	}
});
