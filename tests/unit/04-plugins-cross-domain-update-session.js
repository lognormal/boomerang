/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.CrossDomain", function() {
	var assert = chai.assert;

	describe("exports", function() {
		it("Should have a CrossDomain object", function() {
			assert.isObject(BOOMR.plugins.CrossDomain);
		});

		it("Should have a is_complete() function", function() {
			assert.isFunction(BOOMR.plugins.CrossDomain.is_complete);
		});
	});

	describe("updateSession()", function() {
		// fixtures
		var twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
		var BOOMRSessionFixtures, transferredSessionFixtures;

		// run this at the top of each specific test to prevent BOOMR being undefined
		function setup() {
			BOOMRSessionFixtures = {
				startUndefined: {
					domain: "example.com",
					start: undefined,
					ID: "abc-def",
					length: 1
				},
				startJustNow: {
					domain: "example.com",
					start: BOOMR.now(),
					ID: "ghi-jkl",
					length: 1
				},
				start2HoursAgo: {
					domain: "example.com",
					start: (BOOMR.now() - (2 * 60 * 60 * 1000)),
					ID: "mno-pqr",
					length: 1
				}
			};

			transferredSessionFixtures = {
				startUndefined: {
					domain: "example.com",
					start: undefined,
					ID: "zzz-zzz",
					length: 1
				},
				startJustNow: {
					domain: "example.com",
					start: BOOMR.now(),
					ID: "zzz-zzz",
					length: 1
				},
				start2HoursAgo: {
					domain: "example.com",
					start: (BOOMR.now() - (2 * 60 * 60 * 1000)),
					ID: "zzz-zzz",
					length: 1
				},
				start48HoursAgo: {
					domain: "example.com",
					start: (BOOMR.now() - twoDaysInMs),
					ID: "zzz-zzz",
					length: 1
				}
			};
		}

		it("Should take transferred session start if BOOMR.session.start is undefined and transferred is 2hrs old", function() {
			setup();
			BOOMR.session = BOOMRSessionFixtures.startUndefined;
			BOOMR.plugins.CrossDomain.updateSession(transferredSessionFixtures.startJustNow);
			assert.equal(BOOMR.session.start, transferredSessionFixtures.startJustNow.start);
		});

		it("Should keep BOOMR.session if transferred session.start is undefined", function() {
			setup();
			BOOMR.session = BOOMRSessionFixtures.startJustNow;
			BOOMR.plugins.CrossDomain.updateSession(transferredSessionFixtures.startUndefined);
			assert.equal(BOOMR.session.start, BOOMRSessionFixtures.startJustNow.start);
		});

		it("Should take over the session ID", function() {
			setup();
			BOOMR.session = BOOMRSessionFixtures.startJustNow;
			BOOMR.plugins.CrossDomain.updateSession(transferredSessionFixtures.startUndefined);
			assert.equal(BOOMR.session.ID, BOOMRSessionFixtures.startJustNow.ID);
		});

		it("Should keep BOOMR.session.start if transferred session.start is older than 24h", function() {
			setup();
			BOOMR.session = BOOMRSessionFixtures.startJustNow;
			BOOMR.plugins.CrossDomain.updateSession(transferredSessionFixtures.start48HoursAgo);
			assert.deepEqual(BOOMRSessionFixtures.startJustNow, BOOMR.session);
		});
	});
});

