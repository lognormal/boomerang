/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

/*
  Why is this test here?
  ======================

  Some tests require us to have a proper domain and port assigned and requesting resources from those domains+ports
  as this is the only way we can ensure a cookie is created and session details can be validated.

  In this set of tests we ensure that both the port and domain are setup as expected in our environment.
 */

describe("e2e/00-basic/11-local-domains", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have successfully requested a resource from it's main server domain (--main-domain in grunt)", function(done){
		var xhr1 = new XMLHttpRequest();

		xhr1.open("GET", "http://" + window.mainServer + ":" + (window.mainPort) + "/pages/00-basic/support/generic.html");
		xhr1.send(null);

		xhr1.addEventListener("load", function() {
			if (xhr1.readyState === XMLHttpRequest.DONE) {
				done();
			}
		});
	});

	it("Should have successfully requested a resource from it's secondary server domain (--secondary-domain in grunt)", function(done){
		var xhr2 = new XMLHttpRequest();

		xhr2.open("GET", "http://" + window.secondaryServer + ":" + (window.secondaryPort) + "/pages/00-basic/support/generic.html");
		xhr2.send(null);

		xhr2.addEventListener("load", function() {
			if (xhr2.readyState === XMLHttpRequest.DONE) {
				done();
			}
		});
	});
});

