(function() {

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.ConfigOverride) {
		return;
	}

	var impl = {
		/**
		 * checkOverrides - override current @param config with values from @param override if @param whitelist allows
		 */
		checkOverrides: function(override, whitelist, config) {
			for (var property in override) {
				if (!whitelist.hasOwnProperty(property) ||
				    (typeof whitelist[property] === "object") &&
				    !(typeof override[property] === "object")) {
					continue;
				}

				if (typeof override[property] === "object" && typeof whitelist[property] === "object") {
					config[property] = config[property] || {};
					impl.checkOverrides(override[property], whitelist[property], config[property]);
				}
				else {
					config[property] = override[property];
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
				impl.checkOverrides(BOOMR.window.BOOMR_config, impl.allowedConfigOverrides, config);
				BOOMR.addVar("c.o", 1);
			}
			return this;
		},
		is_complete: function() {
			return true;
		},
		checkOverrides: impl.checkOverrides
	};

}());
