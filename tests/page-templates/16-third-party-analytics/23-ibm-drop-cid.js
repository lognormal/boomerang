/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/23-ibm-drop-cid", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have IBM Analytics Core ID", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.coreid"], undefined);
	});

	it("Should have IBM campaign vendor set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_vendor"], "vendor");
	});

	it("Should have IBM campaign category set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_category"], "category");
	});

	it("Should have IBM campaign placement set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_placement"], "placement");
	});

	it("Should have IBM campaign item set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_item"], "item");
	});

	it("Should have IBM site promotion type set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.sp_type"], "fall");
	});

	it("Should have IBM site promotion set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.sp_promotion"], "sale");
	});

	it("Should have IBM site promotion link set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.sp_link"], "free shipping?cm_mmc=Organic_Social-_-Facebook-_-Placement-_-Item");
	});

	it("Should have IBM real estate version set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.re_version"], "page A");
	});

	it("Should have IBM real estate page area set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.re_pagearea"], "left navbar");
	});

	it("Should have IBM real estate link set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.re_link"], "mens shirts");
	});
});
