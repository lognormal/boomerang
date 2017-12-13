/*eslint-env mocha*/
/*global assert*/

describe("e2e/00-basic/04-onunload-autorun-false", function() {
	it("Should have sent an unload beacon without setting rt.obo", function(done) {
		this.timeout(10000);

		var unloadBeaconHandler = function(data) {
			assert.isString(data["rt.quit"]);
			assert.equal(data["rt.obo"], 0);
			done();
		};

		var testFrame = document.getElementById("boomer_test_frame");
		testFrame.contentWindow.BOOMR.subscribe("beacon", unloadBeaconHandler, null, this);
		testFrame.src = "about:blank";
	});

});
