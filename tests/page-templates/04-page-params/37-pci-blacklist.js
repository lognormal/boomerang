/*eslint-env mocha*/
/*eslint-disable no-loop-func*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/37-pci-blacklist", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done){
		t.ensureBeaconCount(done, 1);
	});

	it("Should have set the PCI flag", function(){
		var b = tf.beacons[0];
		assert.equal(b.pci, 1);
	});

	for (var i = 0; i < GOOD_INPUTS.length; i++) {
		(function(n) {
			if (!GOOD_INPUTS[n]) {
				it("Should not have added the #id" + n + " field via a Custom Dimension XPath (if QSA is supported)", function(){
					if (!document.querySelectorAll) {
						return this.skip();
					}

					var b = tf.beacons[0];
					assert.isUndefined(b["cdim." + n]);
				});

				it("Should have added the #id" + n + " field to the pci.redacted list (if QSA is supported)", function(){
					if (!document.querySelectorAll) {
						return this.skip();
					}

					var b = tf.beacons[0];
					assert.include(b["pci.redacted"], "cdim." + n);
				});
			}
			else {
				it("Should have added the #id" + n + " field via a Custom Dimension XPath", function(){
					var b = tf.beacons[0];
					assert.equal(b["cdim." + n], "good");
				});

				it("Should not have added the #id" + n + " field to the pci.redacted list", function(){
					var b = tf.beacons[0];
					assert.notInclude(b["pci.redacted"], "cdim." + n);
				});
			}
		})(i);
	}
});
