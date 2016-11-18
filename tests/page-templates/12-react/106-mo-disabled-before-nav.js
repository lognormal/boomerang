/*eslint-env mocha*/
/*global BOOMR_test,it,describe,assert*/
describe("e2e/12-react/106-mo-disabled-before-nav", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should ensure that instrumentXHR() was not called before onload", function() {
		assert.isFalse(window.proxyXhrCreatedBeforeOnload);
	});

	it("Should ensure that instrumentXHR() was called after onload", function() {
		if (t.isMutationObserverSupported()) {
			assert.isDefined(BOOMR.proxy_XMLHttpRequest);
		}
	});

});
