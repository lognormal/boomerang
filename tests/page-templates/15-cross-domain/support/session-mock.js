/**
 * Mock BOOMR plugin Running when BOOMR executes on IFrame to preset Cookie Data
 * This will fail if the test environment does not have a
 * full domain but works off localhost.
 */
(function(w){
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	/**
	 * @name BOOMR.plugins.MockSession.impl
	 * @desc
	 * Implementation object for the session mocking Plugin used in Boomerang End To End tests to reflect real
	 * world session changes and situations to validate our session code.
	 *
	 * Use this Plugin in your session testing E2E tests to pre-fill your session with information to mimic
	 * a use case you'd like to test
	 *
	 * Properties set in this object will be overridden by whatever you are writing in the `window.mockSession`
	 * object on the page you wish to override or mock.
	 *
	 * @property {String} ID Session ID mocked
	 * @property {Number} length Session length
	 * @property {TimeStamp} start Time when the session started
	 * @property {Number} loadTime Duration until page was loaded
	 * @property {Number} offByOne Off By one error number for a session
	 * @property {string} beacon_url Beacon URL destination
	 *
	 * @example
	 * // Session History content
	 * BOOMR.now() + "=" + BOOMR.session.length + ":" + impl.oboError + ":" + impl.loadTime
	 * // ie: `1467747649818=1:0:172` means:
	 * // - `1467747649818` When the session history was created (Tue Jul 05 2016 12:40:49 GMT-0700 (PDT))
	 * // - Session length of `1` or first page
	 * // - Off By One Errors of 0
	 * // - Boomerang Load Time on the page of `172`ms
	 */
	var impl = {
		ID: "mock-default",
		length: -1,
		start: 0,
		loadTime: 0,
		offByOne: 0,
		beacon_url: "/no-op"
	};

	function log(message) {
		BOOMR.debug(message, "MockSession");
	}

	BOOMR.plugins.MockSession = {
		init: function(config) {
			var rtObj;
			// This is plugin won't do much if RT plugin is not part of the build
			if (!BOOMR.plugins.RT) {
				return;
			}

			if (BOOMR.utils.getCookie("RT")) {
				rtObj = BOOMR.utils.getCookie("RT")
					.split("&")
					.map(function(val) {
						return val.split("=");
					}).reduce(function(acc, val) {

						if (acc.hasOwnProperty("length")) {
							var obj = {};
							obj[val[0]] = val[1];
							obj[acc[0]] = acc[1];
							return obj;
						}
						else {
							acc[val[0]] = val[1];
							return acc;
						}
					});
			}

			log("Current Cookie Content: " + BOOMR.utils.objectToString(rtObj));

			// We need to use window.sessionMock instead of the much
			// more comfortable MockSession as config item in
			// BOOMR_config since this needs to be running before
			// CrossDomain has run.
			impl = BOOMR.window.sessionMock;

			log("Session Mocked: " + BOOMR.utils.objectToString(impl));
			if (!BOOMR.session.domain) {
				BOOMR.session.domain = BOOMR.window.location.host;
			}
			if (BOOMR.utils.getCookie("RT")) {
				BOOMR.utils.removeCookie("RT");
			}
			BOOMR.session.start = impl.start;
			BOOMR.session.ID = impl.ID;
			BOOMR.session.length = impl.length;
			BOOMR.session.domain = w.document.domain;
			var cookieObject = {
				"dm": BOOMR.session.domain,
				"si": BOOMR.session.ID,
				"ss": (BOOMR.session.start).toString(36),
				"sl": (BOOMR.session.length).toString(36),
				"tt": impl.loadTime ? (impl.loadTime).toString(36) : (433).toString(36),
				"obo": impl.offByOne ? (impl.offByOne).toString(36) : 0,
				"bcn": impl.beacon_url ? impl.beacon_url : "/beacon",
				"z": 1
			};
			BOOMR.plugins.RT.updateCookie();

			var secondsOneDay = 24 * 60 * 60;
			BOOMR.utils.setCookie("RT", cookieObject, secondsOneDay);
		},

		is_complete: function() {
			return true;
		}
	};
}(this));
