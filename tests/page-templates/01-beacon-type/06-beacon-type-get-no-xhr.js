/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/06-beacon-type-get-no-xhr", function() {
	it("Should not send an beacon via XHR when beacon type is GET", function() {
		if (BOOMR && typeof BOOMR.sendXhrPostBeacon === "function") {
			assert.isDefined(window.boomrxhr);
			assert.strictEqual(window.boomrxhr, "TestString", "Expected beacon to be not sent via XHR");
			assert.isDefined(window.xhrparams);
			assert.strictEqual(window.xhrparams, "TestString", "Expected beacon to be not sent via XHR");
		}
	});
});
