/*eslint-env mocha*/
/*eslint-disable no-loop-func*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/36-pci-autocomplete-other-elements", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done){
		t.ensureBeaconCount(done, 1);
	});

	it("Should have set the PCI flag", function(){
		var b = tf.beacons[0];
		assert.equal(b.pci, 1);
	});

	for (var i = 0; i < 2; i++) {
		(function(n) {
			it("Should not have added id=" + n + " via a Custom Dimension XPath", function(){
				var b = tf.beacons[0];
				assert.isUndefined(b["cdim." + n]);
			});

			it("Should have added id=" + n + " field to the pci.redacted list", function(){
				var b = tf.beacons[0];
				assert.include(b["pci.redacted"], "cdim." + n);
			});
		})(i);
	}
});
