(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.ConfigOverride) {
		return;
	}

	var impl = {
		/**
		 * safeConfigOverride - override current @param config with values from @param override if @param whitelist allows
		 */
		safeConfigOverride: function(override, whitelist, config) {
			for (var property in whitelist) {
				if (!override.hasOwnProperty(property) ||
				    !whitelist.hasOwnProperty(property) ||
				    (typeof whitelist[property] === "object") &&
				    !(typeof override[property] === "object")) {
					continue;
				}

				if (typeof override[property] === "object" && typeof whitelist[property] === "object") {
					config[property] = config[property] || {};
					impl.safeConfigOverride(override[property], whitelist[property], config[property]);
				}
				else {
					config[property] = override[property];
					// set c.o here so we are sure that we actually changed something
					BOOMR.addVar("c.o", "");
				}
			}
		},

		/**
		 * allowedConfigOverrides: list of configuration options allowed to be
		 * overwritten by user defined configuration via BOOMR_config.
		 *
		 * Object is build like the init() config object with the overwritable properties set to true.
		 * Other properties set by the override not set here.
		 */
		allowedConfigOverrides: {
			Angular: {
				enabled: true
			},
			Ember: {
				enabled: true
			},
			Backbone: {
				enabled: true
			},
			History: {
				enabled: true,
				auto: true,
				disableHardNav: true
			},
			PageParams: {
				pageGroups: true,
				customMetrics: true,
				customDimensions: true,
				customTimers: true,
				abTests: true,
				defaultDecimal: true,
				defaultThousands: true,
				xhr: true
			},
			CrossDomain: {
				cross_domain_url: true,
				sending: true,
				session_transfer_timeout: true
			},
			instrument_xhr: true,
			RT: {
				cookie: true,
				session_exp: true
			},
			BW: {
				base_url: true,
				enabled: true,
				test_https: true
			},
			ResourceTiming: {
				enabled: true,
				clearOnBeacon: true,
				trimUrls: true
			},
			AutoXHR: {
				alwaysSendXhr: true,
				filters: true
			},
			Errors: {
				enabled: true,
				onError: true,
				monitorGlobal: true,
				monitorNetwork: true,
				monitorConsole: true,
				monitorEvents: true,
				monitorTimeout: true,
				sendAfterOnload: true,
				maxErrors: true,
				sendInterval: true
			},
			TPAnalytics: {
				enabled: true
			},
			secondary_beacons: true,
			autorun: true
		}
	};

	BOOMR.plugins.ConfigOverride = {
		init: function(config) {
			if (BOOMR.window && BOOMR.window.BOOMR_config) {
				BOOMR.debug("Found BOOMR_config on global scope: " + BOOMR.utils.objectToString(BOOMR.window.BOOMR_config), "ConfigOverride");
				impl.safeConfigOverride(BOOMR.window.BOOMR_config, impl.allowedConfigOverrides, config);
			}
			return this;
		},
		is_complete: function() {
			return true;
		}
		/* BEGIN_DEBUG */,
		safeConfigOverride: impl.safeConfigOverride
		/* END_DEBUG */
	};

}());
