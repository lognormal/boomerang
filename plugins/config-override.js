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
				if (!whitelist.hasOwnProperty(property) ||
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
			PageParams: {
				pageGroups: true,
				customMetrics: true,
				customDimensions: true,
				customTimers: true,
				abTests: true
			},
			instrument_xhr: true,
			RT: {
				session_exp: true
			},
			BW: {
				base_url: true,
				enable: true
			},
			ResourceTiming: {
				enabled: true
			},
			secondaryBeacons: true,
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
		/* BEGIN UNIT_TEST_CODE */,
		safeConfigOverride: impl.safeConfigOverride
		/* END UNIT_TEST_CODE */
	};

}());
