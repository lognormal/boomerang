/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.checkOverrides", function() {
	var assert = chai.assert;

	it("Should have a function on the BOOMR object called checkOverrides", function(){
		assert.isFunction(BOOMR.checkOverrides);
	});

	it("Should return empty object if passed null as overrides and an empty config object", function(){
		var inputOverride = null,
		    inputWhitelist = {},
		    inputConfig = {};
		var expect = {};

		assert.deepEqual(BOOMR.checkOverrides(inputOverride, inputWhitelist, inputConfig), expect);
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

		assert.deepEqual(BOOMR.checkOverrides(inputOverride, inputWhitelist, inputConfig), expect);
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
		assert.deepEqual(BOOMR.checkOverrides(inputOverride, inputWhitelist, inputConfig), expect);
	});
});
