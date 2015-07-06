/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.ConfigOverride.safeOverrideConfig", function() {
	var assert = chai.assert;

	// If BOOMR wasn't built with ConfigOverride included just skip() the tests here
	if (!BOOMR || !BOOMR.plugins.ConfigOverride.safeOverrideConfig) {
		this.skip();
	}

	it("Should have a function on the BOOMR object called safeOverrideConfig", function(){
		assert.isFunction(BOOMR.plugins.ConfigOverride.safeOverrideConfig);
	});

	it("Should return empty object if passed null as overrides and an empty config object", function(){
		var inputOverride = null,
		    inputWhitelist = {},
		    inputConfig = {};
		var expect = {};

		BOOMR.plugins.ConfigOverride.safeOverrideConfig(inputOverride, inputWhitelist, inputConfig);
		assert.deepEqual(inputConfig, expect);
	});

	it("Should replace only the whitelisted properties in a flat config override", function(){
		var inputOverride = {
			name: "2",
			id: 2,
			extra: 9999
		}, inputWhitelist = {
			name: true,
			id: true
		}, inputConfig = {
			name: "1",
			id: 1
		};

		var expect = {
			name: "2",
			id: 2
		};
		BOOMR.plugins.ConfigOverride.safeOverrideConfig(inputOverride, inputWhitelist, inputConfig);
		assert.deepEqual(inputConfig, expect);
	});

	it("Should replace deeply nested objects only to where we allow it", function(){
		var inputOverride = {
			name: "2",
			id: 2,
			attributes: {
				height: 2,
				length: 2,
				status: "off"
			},
			extra: 9999
		}, inputWhitelist = {
			name: true,
			id: true,
			attributes: true
		}, inputConfig = {
			name: "1",
			id: 1,
			attributes: {
				height: 1,
				length: 1,
				status: "on"
			}
		};

		var expect = {
			name: "2",
			id: 2,
			attributes: {
				height: 2,
				length: 2,
				status: "off"
			}
		};

		BOOMR.plugins.ConfigOverride.safeOverrideConfig(inputOverride, inputWhitelist, inputConfig);
		assert.deepEqual(inputConfig, expect);
	});
});
