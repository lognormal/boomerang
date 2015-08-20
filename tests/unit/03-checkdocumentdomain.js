/*eslint-env mocha*/
/*global chai*/

describe("BOOMR_check_doc_domain", function() {
	var assert = chai.assert;

	it("Should have a function called \"BOOMR_check_doc_domain\" in global scope", function() {
		assert.isFunction(window.BOOMR_check_doc_domain);
	});

	it("Should return undefined when run from the \"main window\"", function() {
		assert.isUndefined(window.BOOMR_check_doc_domain());
	});

	it("Should return undefined when passing a single word domain ie. localhost", function() {
		assert.isUndefined(window.BOOMR_check_doc_domain("localhost"));
	});
});
