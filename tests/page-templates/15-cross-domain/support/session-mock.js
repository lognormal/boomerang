/**
 * Mock BOOMR plugin Running when BOOMR executes on IFrame to preset Cookie Data
 * This will fail if the test environment does not have a
 * full domain but works off localhost.
 */
(function(w){
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	var impl = {
		ID: "mock-default",
		length: -1,
		start: 0
	};

	BOOMR.plugins.MockSession = {
		init: function(config) {
			// This is plugin won't do much if RT plugin is not part of the build
			if (!BOOMR.plugins.RT) {
				return;
			}
			// We need to use window.sessionMock instead of the much
			// more comfortable MockSession as config item in
			// BOOMR_config since this needs to be running before
			// CrossDomain has run.
			impl = BOOMR.window.sessionMock;

			BOOMR.utils.removeCookie("RT");
			var sessionStart = impl.start;
			BOOMR.session.ID = impl.ID;
			BOOMR.session.length = impl.length;
			BOOMR.session.domain = w.document.domain;
			var cookieObject = {
				"dm": BOOMR.session.domain,
				"si": BOOMR.session.ID,
				"ss": sessionStart,
				"sl": BOOMR.session.length,
				"tt": "443",
				"obo": 0,
				"sh": "",
				"bcn": "/blackhole"
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
