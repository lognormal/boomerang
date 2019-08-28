/**
 * Tag users with a unique GUID.
 *
 * The `GUID` plugin adds a tracking cookie to the user that will be sent to the
 * beacon-server as cookie.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds no parameters to the beacon.
 *
 * (It sets the specified cookie)
 * @class BOOMR.plugins.GUID
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.GUID) {
		return;
	}

	var impl = {
		expires:  604800,
		cookieName: "GUID"
	};

	BOOMR.plugins.GUID = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {string} config.GUID.cookieName The name of the cookie to be set in the browser session
		 * @param {number} [config.GUID.expires] An expiry time for the cookie in seconds. By default 7 days.
		 *
		 * @returns {@link BOOMR.plugins.GUID} The GUID plugin for chaining
		 * @memberof BOOMR.plugins.GUID
		 */
		init: function(config) {
			var properties = ["cookieName", "expires"];
			BOOMR.utils.pluginConfig(impl, config, "GUID", properties);
			BOOMR.info("Initializing plugin GUID " + impl.cookieName, "GUID");

			if (!BOOMR.utils.getCookie(impl.cookieName)) {
				BOOMR.info("Could not find a cookie for " + impl.cookieName, "GUID");

				var guid = BOOMR.utils.generateUUID();

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

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.GUID
		 */
		is_complete: function() {
			return true;
		}
	};
}(this));
