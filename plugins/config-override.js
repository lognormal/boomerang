/**
 * This plugin is responsible for allowing in-page overrides of config.js[on] for
 * mPulse by setting a global `window.BOOMR_config` variable.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Example
 *
 * `BOOMR_config` should be set prior to boomerang.js loading.
 *
 * ```
 * window.BOOMR_config = {
 *   instrument_xhr: true
 * };
 * ```
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `c.o`: `BOOMR_config` was set on the page
 *
 * @class BOOMR.plugins.ConfigOverride
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.ConfigOverride) {
		return;
	}

	var impl = {
		/**
		 * Override current config with values from override if whitelist allows
		 *
		 * @param {object} override Global config override
		 * @param {object} whitelist Whitelist of allowed overrides
		 * @param {object} config Configuration
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
		 * List of configuration options allowed to be overwritten by user
		 * defined configuration via `BOOMR_config`.
		 *
		 * Object is build like the `init()` config object with the overwritable
		 * properties set to true.
		 *
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
				enabled: true,
				pageGroups: true,
				customMetrics: true,
				customDimensions: true,
				customTimers: true,
				abTests: true,
				defaultDecimal: true,
				defaultThousands: true,
				xhr: true,
				pci: true,
				pciBlacklist: true
			},
			CrossDomain: {
				cross_domain_url: true,
				sending: true,
				session_transfer_timeout: true
			},
			IFrameDelay: {
				enabled: true,
				monitoredCount: true,
				registerParent: true
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
				trimUrls: true,
				serverTiming: true,
				monitorClearResourceTimings: true
			},
			AutoXHR: {
				alwaysSendXhr: true,
				filters: true,
				monitorFetch: true
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
			Continuity: {
				enabled: true,
				monitorLongTasks: true,
				monitorPageBusy: true,
				monitorFrameRate: true,
				monitorInteractions: true,
				monitorStats: true,
				afterOnload: true,
				afterOnloadMaxLength: true,
				afterOnloadMinWait: 5000,
				waitAfterOnload: true,
				ttiWaitForFrameworkReady: true,
				ttiWaitForHeroImages: true,
				sendLog: true,
				logMaxEntries: 100,
				sendTimeline: true
			},
			UserTiming: {
				enabled: true
			},
			/* SOASTA PRIVATE START */
			LOGN: {
				storeConfig: true
			},
			/* SOASTA PRIVATE END */
			autorun: true
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.ConfigOverride = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 *
		 * @returns {@link BOOMR.plugins.ConfigOverride} The ConfigOverride plugin for chaining
		 * @memberof BOOMR.plugins.ConfigOverride
		 */
		init: function(config) {
			if (BOOMR.window && BOOMR.window.BOOMR_config) {
				BOOMR.debug("Found BOOMR_config on global scope: " +
					BOOMR.utils.objectToString(BOOMR.window.BOOMR_config),
					"ConfigOverride");

				impl.safeConfigOverride(BOOMR.window.BOOMR_config, impl.allowedConfigOverrides, config);
			}
			return this;
		},

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.ConfigOverride
		 */
		is_complete: function() {
			return true;
		}

		/* BEGIN_DEBUG */,
		safeConfigOverride: impl.safeConfigOverride
		/* END_DEBUG */
	};

}());
