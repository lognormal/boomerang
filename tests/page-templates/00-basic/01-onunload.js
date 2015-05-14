/*eslint-env mocha*/
/*global assert*/

describe("e2e/00-basic/01-onunload", function() {
	it("Should have sent an unload beacon", function(done) {
		var unloadBeaconHandler = function(data) {
			assert.isString(data["rt.quit"]);
			done();
		};

		var testFrame = document.getElementById("boomer_test_frame");
		testFrame.contentWindow.BOOMR.subscribe("onbeacon", unloadBeaconHandler, null, this);
		testFrame.src = "support/generic.html?2";
	});

});
