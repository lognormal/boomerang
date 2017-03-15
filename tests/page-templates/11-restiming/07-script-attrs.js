/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/07-script-attrs", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;


	function getInterestingScripts(resources) {
		var interesting = [];
		for (var i = 0; i < resources.length; i++) {
			if (resources[i].name.endsWith("/mocha.js") || resources[i].name.match(/\/07-script-attrs(\.\w+)?\.js$/)) {
				interesting.push(resources[i]);
			}
		}

		return interesting;
	}

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should find the script elements", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			var interesting = getInterestingScripts(resources);

			assert.strictEqual(interesting.length, 6);
		}
	});

	it("Should find attributes for script elements", function() {
		if (t.isResourceTimingSupported()) {
			var RT = BOOMR.plugins.ResourceTiming;

			var SCRIPT_ATTR_EXPR = new RegExp("^.*\\" + RT.SPECIAL_DATA_PREFIX + RT.SPECIAL_DATA_SCRIPT_ATTR_TYPE);

			var b = tf.beacons[0];

			var trie = JSON.parse(b.restiming);
			var interesting = trie[location.protocol + "//" + location.host + "/"]["pages/11-restiming/"];

			var js_head_static = trie[location.protocol + "//" + location.host + "/"]["vendor/"]["mocha/mocha."].js;
			var js_body_static = interesting["07-script-attrs."].js;
			var js_body_async  = interesting["support/07-script-attrs."]["bodyasync.js"];
			var js_body_defer  = interesting["support/07-script-attrs."]["defer.js"];
			var js_head_async  = interesting["support/07-script-attrs."].as["ync.js"];
			var js_head_asfer  = interesting["support/07-script-attrs."].as["fer.js"];

			assert.match(js_head_static, SCRIPT_ATTR_EXPR);
			js_head_static = parseInt(js_head_static.replace(SCRIPT_ATTR_EXPR, ""), 10);
			assert.strictEqual(js_head_static & RT.ASYNC_ATTR, 0);
			assert.strictEqual(js_head_static & RT.DEFER_ATTR, 0);
			assert.strictEqual(js_head_static & RT.LOCAT_ATTR, 0);

			assert.match(js_head_async, SCRIPT_ATTR_EXPR);
			js_head_async = parseInt(js_head_async.replace(SCRIPT_ATTR_EXPR, ""), 10);
			assert.strictEqual(js_head_async  & RT.ASYNC_ATTR, RT.ASYNC_ATTR);
			assert.strictEqual(js_head_async  & RT.DEFER_ATTR, 0);
			assert.strictEqual(js_head_async  & RT.LOCAT_ATTR, 0);

			assert.match(js_head_asfer, SCRIPT_ATTR_EXPR);
			js_head_asfer = parseInt(js_head_asfer.replace(SCRIPT_ATTR_EXPR, ""), 10);
			assert.strictEqual(js_head_asfer  & RT.ASYNC_ATTR, RT.ASYNC_ATTR);
			assert.strictEqual(js_head_asfer  & RT.DEFER_ATTR, RT.DEFER_ATTR);
			assert.strictEqual(js_head_asfer  & RT.LOCAT_ATTR, 0);

			assert.match(js_body_static, SCRIPT_ATTR_EXPR);
			js_body_static = parseInt(js_body_static.replace(SCRIPT_ATTR_EXPR, ""), 10);
			assert.strictEqual(js_body_static & RT.ASYNC_ATTR, 0);
			assert.strictEqual(js_body_static & RT.DEFER_ATTR, 0);
			assert.strictEqual(js_body_static & RT.LOCAT_ATTR, RT.LOCAT_ATTR);

			assert.match(js_body_async, SCRIPT_ATTR_EXPR);
			js_body_async = parseInt(js_body_async.replace(SCRIPT_ATTR_EXPR, ""), 10);
			assert.strictEqual(js_body_async  & RT.ASYNC_ATTR, RT.ASYNC_ATTR);
			assert.strictEqual(js_body_async  & RT.DEFER_ATTR, 0);
			assert.strictEqual(js_body_async  & RT.LOCAT_ATTR, RT.LOCAT_ATTR);

			assert.match(js_body_defer, SCRIPT_ATTR_EXPR);
			js_body_defer = parseInt(js_body_defer.replace(SCRIPT_ATTR_EXPR, ""), 10);
			assert.strictEqual(js_body_defer  & RT.ASYNC_ATTR, 0);
			assert.strictEqual(js_body_defer  & RT.DEFER_ATTR, RT.DEFER_ATTR);
			assert.strictEqual(js_body_defer  & RT.LOCAT_ATTR, RT.LOCAT_ATTR);
		}
	});
});
