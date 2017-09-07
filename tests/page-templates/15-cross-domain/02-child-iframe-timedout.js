/*eslint-env mocha*/
/*global BOOMR_test,assert*/

/*
  Test ensures we set the timedout flag on beacon if the main did not respond on time and we move on with our session

  +---------+        +----------+
  |  Alias  +---?---->   Main   |
  +---------+        +----------+

  +---------+
  |   Main  +------> ... Thinking ...
  +---------+

  +--------------------------------------------+
  |Alias: No Data from Main. Using own data... |
  +--------------------------------------------+
*/

describe("e2e/15-cross-domain/02-child-iframe-timedout", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should include the timedout flag for session transfer", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.sstr_to"], "1");
	});
});
