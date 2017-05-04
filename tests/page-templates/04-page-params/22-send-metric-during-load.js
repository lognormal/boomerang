/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/22-send-metric-during-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done){
		t.ensureBeaconCount(done, 2);
	});

	it("Should have set the Custom Metric on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["cmet.CM1"], "10");
	});

	it("Should have set the Page Group on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "PG");
	});

	it("Should have set the A/B Test on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["h.ab"], "A");
	});

	it("Should have set the Custom Dimension on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["cdim.CD1"], "Dimension1");
	});

	it("Should have set api=1 on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b.api, "1");
	});

	it("Should have set api.v=2 on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["api.v"], "2");
	});

	it("Should have set api.l=boomr on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["api.l"], "boomr");
	});

	it("Should have set http.initiator=api_custom_metric on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["http.initiator"], "api_custom_metric");
	});

	it("Should have set rt.sl=1 on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["rt.sl"], "1");
	});

	it("Should have set rt.si on the first beacon", function(){
		var b = tf.beacons[0];
		assert.isDefined(b["rt.si"]);
	});

	it("Should have set rt.sl on the first beacon", function(){
		var b = tf.beacons[0];
		assert.isDefined(b["rt.sl"]);
		assert.operator(b["rt.sl"], ">", 0);
	});

	it("Should have set rt.start=manual on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b["rt.start"], "manual");
	});

	it("Should have set pid on the first beacon", function(){
		var b = tf.beacons[0];
		assert.equal(b.pid, BOOMR.pageId);
	});

	it("Should have set h.key on the first beacon", function(){
		var b = tf.beacons[0];
		assert.isDefined(b["h.key"]);
	});

	it("Should have set h.d on the first beacon", function(){
		var b = tf.beacons[0];
		assert.isDefined(b["h.d"]);
	});

	it("Should have set h.cr on the first beacon", function(){
		var b = tf.beacons[0];
		assert.isDefined(b["h.cr"]);
	});

	it("Should have set h.t on the first beacon", function(){
		var b = tf.beacons[0];
		assert.isDefined(b["h.t"]);
	});

	it("Should not have set the Custom Timer for the first beacon", function(){
		var b = tf.beacons[0];
		assert.notInclude(b.t_other, "custom1|111");
	});

	it("Should have sent a regular page load beacon for the second beacon", function(){
		var b = tf.beacons[1];
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have set the Custom Timer for the second beacon", function(){
		var b = tf.beacons[1];
		assert.include(b.t_other, "custom1|111");
	});
});
