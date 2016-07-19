/*
 Tag users with a unique GUID
*/
(function() {

	var impl = {
		expires:  604800,
		cookieName: "GUID",
		generate: function() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			}

			return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
		}
	};

	BOOMR.plugins.GUID = {
		init: function(config) {
			var properties = ["cookieName", "expires"];
			BOOMR.utils.pluginConfig(impl, config, "GUID", properties);
			BOOMR.info("Initializing plugin GUID " + impl.cookieName, "GUID");

			if (!BOOMR.utils.getCookie(impl.cookieName)) {
				BOOMR.info("Could not find a cookie for " + impl.cookieName, "GUID");

				var guid = impl.generate();

				if (!BOOMR.utils.setCookie(impl.cookieName, guid, impl.expires)) {
					BOOMR.subscribe("before_beacon", function() {
						BOOMR.utils.setCookie(impl.cookieName, guid, impl.expires);
					});
				}

				BOOMR.info("Setting GUID Cookie value to: " + guid + " expiring in: " + impl.expires + "s", "GUID");
			}
			else {
				BOOMR.info("Found a cookie named: " + impl.cookieName + " value: " + BOOMR.utils.getCookie(impl.cookieName), "GUID");
			}
			return this;
		},
		is_complete: function() {
			return true;
		}
	};
}(this));
