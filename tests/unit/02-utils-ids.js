/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils ID functions", function() {
	var assert = chai.assert;

	var uuidVersion4RegEx = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	describe("BOOMR.utils.generateUUID()", function() {
		it("Should return a version-4 UUID", function() {
			assert.isTrue(BOOMR.utils.generateUUID().match(uuidVersion4RegEx) !== null);
		});

		it("Should return a version-4 UUID (1k loop)", function() {
			for (var i = 0; i < 1000; i++) {
				assert.isTrue(BOOMR.utils.generateUUID().match(uuidVersion4RegEx) !== null);
			}
		});

		it("Should return a new UUID each time (1k loop)", function() {
			var uuids = [];
			for (var i = 0; i < 1000; i++) {
				var uuid = BOOMR.utils.generateUUID();

				if (uuids[uuid]) {
					assert.fail("Found a previously-generated UUID: " + uuid);
				}

				uuids[uuid] = 1;
			}
		});
	});

	describe("BOOMR.utils.generateId()", function() {
		it("Should return a 40-character ID when no length is given", function() {
			var id = BOOMR.utils.generateId();
			assert.isDefined(id);
			assert.strictEqual(id.length, 40);
		});

		it("Should return a 8-character ID when asked for", function() {
			var id = BOOMR.utils.generateId(8);
			assert.isDefined(id);
			assert.strictEqual(id.length, 8);
		});

		it("Should always return the character length asked for", function() {
			for (var i = 1; i <= 40; i++) {
				var id = BOOMR.utils.generateId(i);
				assert.isDefined(id);
				assert.strictEqual(id.length, i);
			}
		});

		it("Should return 40 characters if asked for more", function() {
			var id = BOOMR.utils.generateId(50);
			assert.isDefined(id);
			assert.strictEqual(id.length, 40);
		});

		it("Should return a new ID each time (1k loop)", function() {
			var ids = [];
			for (var i = 0; i < 1000; i++) {
				var id = BOOMR.utils.generateId(40);

				if (ids[id]) {
					assert.fail("Found a previously-generated ID: " + id);
				}

				ids[id] = 1;
			}
		});
	});
});
