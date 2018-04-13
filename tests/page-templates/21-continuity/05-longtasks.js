/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/05-longtasks", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	// finds LongTasks that we know we triggered (since we caused a 1500ms loop)
	function findMyLongTasks(b, type) {
		return BOOMR.utils.Compression.jsUrlDecompress(b["c.lt"]).filter(function(o) {
			return parseInt(o.d, 36) >= 1000 && o.n === type;
		})[0];
	}

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have set the LongTask count (c.lt.n) of at least 2 (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.lt.n"]);

		// we caused at least 2
		assert.operator(parseInt(b["c.lt.n"], 10), ">=", 2);
	});

	it("Should have set the LongTask time (c.lt.tt) (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.lt.tt"]);

		// we caused 3000ms
		assert.operator(parseInt(b["c.lt.tt"], 10), ">=", 2900);

		// should be less less than 10 seconds
		assert.operator(parseInt(b["c.lt.tt"], 10), "<=", 10000);
	});

	it("Should have set the LongTask data (c.lt) start time for the 'self' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 1);
		assert.operator(parseInt(ltData.s, 36), ">", 0);
		assert.operator(parseInt(ltData.s, 36), "<=", 5000);
	});

	it("Should have set the LongTask data (c.lt) duration for the 'self' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 1);
		assert.operator(parseInt(ltData.d, 36), ">=", 1400);
		assert.operator(parseInt(ltData.d, 36), "<=", 3000);
	});

	it("Should have set the LongTask data (c.lt) type for the 'self' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 1);
		assert.equal(ltData.n, "1");
	});

	it("Should have set the LongTask data (c.lt) start time for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.operator(parseInt(ltData.s, 36), ">", 0);
		assert.operator(parseInt(ltData.s, 36), "<=", 10000);
	});

	it("Should have set the LongTask data (c.lt) duration for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.operator(parseInt(ltData.d, 36), ">=", 1400);
		assert.operator(parseInt(ltData.d, 36), "<=", 3000);
	});

	it("Should have set the LongTask data (c.lt) type for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.equal(ltData.n, "3");
	});

	it("Should have set the LongTask data (c.lt) attribution culprit attribution for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.equal(ltData.a[0].a, "1");
	});

	it("Should have set the LongTask data (c.lt) attribution culprit name for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.equal(ltData.a[0].t, "1");
	});

	it("Should have set the LongTask data (c.lt) attribution container id for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.equal(ltData.a[0].i, "longtaskframeid");
	});

	it("Should have set the LongTask data (c.lt) attribution container name for the 'same-origin-descendant' task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = findMyLongTasks(b, 3);
		assert.equal(ltData.a[0].n, "longtaskframename");
	});

	it("Should have the LongTask timeline (c.t.longtask) (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.fps"]);
		assert.operator(b["c.t.fps"].length, ">=", 1);
	});
});
