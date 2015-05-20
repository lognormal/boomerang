/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.pluginConfig()", function() {
	var assert = chai.assert;

	var pluginName = "myPlugin";

	it("Should return false if no config was set", function() {
		assert.isFalse(BOOMR.utils.pluginConfig({}, undefined, "", []));
		assert.isFalse(BOOMR.utils.pluginConfig({}, null, "", []));
		assert.isFalse(BOOMR.utils.pluginConfig({}, false, "", []));
	});

	it("Should return false if config was set but no matching plugin name was defined in that config", function() {
		var config = { otherPlugin: { existingKey: "value" } };
		assert.isFalse(BOOMR.utils.pluginConfig({}, config, pluginName, []));
		assert.isFalse(BOOMR.utils.pluginConfig({}, config, "", []));
	});

	it("Should return false if no configuration was set, no valid config-keys were defined, but a value to a key was requested", function() {
		assert.isFalse(BOOMR.utils.pluginConfig({}, {}, pluginName, ["notExistingKey"]));
	});

	it("Should return false if a configuration was set but no valid key from that configuration was requested", function() {
		var config = { myPlugin: { existingKey: "value" } };
		assert.isFalse(BOOMR.utils.pluginConfig({}, config, pluginName, ["notExistingKey"]));
	});

	it("Should return false if a key was requested that is inbounds to what is expected but was not set by the user", function() {
		var config = { myPlugin: { otherKey: "value" } };
		assert.isFalse(BOOMR.utils.pluginConfig({}, config, pluginName, ["existingKey"]));
	});

	it("Should return true if a key was requested that exists and was configured and matches expected return value", function() {
		var config = { myPlugin: { key: "value" } };
		assert.isTrue(BOOMR.utils.pluginConfig({}, config, pluginName, ["key"]));
	});

	it("Should should update the impl object with the config option, even if it didn't exist before", function() {
		var impl = {};
		var config = { myPlugin: { key: "value2" } };
		assert.isTrue(BOOMR.utils.pluginConfig(impl, config, pluginName, ["key"]));
		assert.strictEqual(impl.key, "value2");
	});

	it("Should should update the impl object with the config option, overwriting the existing value", function() {
		var impl = { key: "value1" };
		var config = { myPlugin: { key: "value2" } };
		assert.isTrue(BOOMR.utils.pluginConfig(impl, config, pluginName, ["key"]));
		assert.strictEqual(impl.key, "value2");
	});

	it("Should validate the old YUI Boomerang test", function() {
		// these were carried over from YUI tests
		var o = {};
		var config = { ABC: { one: 1, two: [2], three: "3rd", four: 4.1, five: false } };

		assert.isFalse(BOOMR.utils.pluginConfig(o, config, "DEF", []));
		assert.isFalse(BOOMR.utils.pluginConfig(o, config, "ABC", []));
		assert.isFalse(BOOMR.utils.pluginConfig(o, config, "DEF", ["one", "two"]));
		assert.isTrue(BOOMR.utils.pluginConfig(o, config, "ABC", ["one", "two"]));

		assert.strictEqual(1, o.one);
		assert.isArray(o.two);
		assert.equal(1, o.two.length);
		assert.equal(2, o.two[0]);
		assert.isUndefined(o.three);

		assert.isTrue(BOOMR.utils.pluginConfig(o, config, "ABC", ["five"]));

		assert.strictEqual(1, o.one);
		assert.isArray(o.two);
		assert.equal(1, o.two.length);
		assert.equal(2, o.two[0]);
		assert.isUndefined(o.three);
		assert.isDefined(o.five);
		assert.isFalse(o.five);
	});
});
