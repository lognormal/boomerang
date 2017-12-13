/**
 * Captures session IDs and campaign information from third party analytic vendors
 * installed on the same page.
 *
 * Third party analytics vendors currently supported:
 *
 * * Google Analytics
 * * Adobe Analytics (formerly Omniture Sitecatalyst)
 * * IBM Digital Analytics (formerly Coremetrics)
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `tp.ga.clientid`: Google Analytics [clientID](https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id) (unique id per visitor)
 * * `tp.ga.utm_source`: Google Analytics [Campaign source](https://support.google.com/analytics/answer/1033863?hl=en)
 * * `tp.ga.utm_medium`: Google Analytics [Campaign medium](https://support.google.com/analytics/answer/1033863?hl=en)
 * * `tp.ga.utm_term`: Google Analytics [Campaign term](https://support.google.com/analytics/answer/1033863?hl=en)
 * * `tp.ga.utm_content`: Google Analytics [Campaign content](https://support.google.com/analytics/answer/1033863?hl=en)
 * * `tp.ga.utm_campaign`: Google Analytics [Campaign ID](https://support.google.com/analytics/answer/1033863?hl=en)
 * * `tp.aa.aid`: Adobe Analytics [Analytics ID (AID)](https://marketing.adobe.com/resources/help/en_US/reference/)
 * * `tp.aa.mid`: Adobe Analytics [Marketing ID (MID)](https://marketing.adobe.com/resources/help/en_US/reference/)
 * * `tp.aa.campaign`: Adobe Analytics [Campaign ID](https://marketing.adobe.com/resources/help/en_US/reference/)
 * * `tp.aa.purchaseid`: Adobe Analytics [Purchase ID](https://marketing.adobe.com/resources/help/en_US/reference/)
 * * `tp.ia.coreid`: IBM Analytics [Core ID (unique id per visitor)](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.mmc_vendor`: IBM Analytics [Campaign vendor](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.mmc_category`: IBM Analytics [Campaign category](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.mmc_placement`: IBM Analytics [Campaign placement](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.mmc_item`: IBM Analytics [Campaign item](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.sp_type`: IBM Analytics [Site promotion type](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.sp_promotion`: IBM Analytics [Site promotion](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.sp_link`: IBM Analytics [Site promotion link](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.re_version`: IBM Analytics [Real estate version](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.re_pagearea`: IBM Analytics [Real estate page area](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html)
 * * `tp.ia.re_link`: IBM Analytics [Real estate link](https://www.ibm.com/support/knowledgecenter/en/SSPG9M/Analytics/kc_welcome_analytics.html) *
 *
 * @class BOOMR.plugins.TPAnalytics
 */
/*eslint dot-notation:0*/
(function() {
	"use strict";

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.TPAnalytics) {
		return;
	}

	/**
	 * Warning logging
	 *
	 * @param {string} msg Message
	 */
	function warn(msg) {
		BOOMR.warn(msg, "TPAnalytics");
	}

	var impl = {
		addedVars: [],

		// collect client IDs, default to false
		// overridable by config
		clientids: false,

		// list of params we won't beacon
		// overridable by config
		dropParams: [],

		/**
		 * Google Analytics
		 * For Universal Analytics there is a function named "ga" which is used to retreive the clientid
		 * ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/command-queue-reference
		 * By default the clientid is stored in a cookie named "_ga" for 2 years
		 * ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id
		 * For Classic GA, we'll parse the "__utma" cookie
		 *
		 * @return {Object} captured metrics
		 */
		googleAnalytics: function() {
			var data = {};
			var w = BOOMR.window;
			var i, param, value, cid, trackers;

			// list of query params that we want to capture
			// ref: https://support.google.com/analytics/answer/1033863
			var QUERY_PARAMS = ["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign"];

			if (impl.clientids) {
				// check for google's global "ga" function then get the clientId
				if (typeof w.ga === "function") {
					try {
						w.ga(function(tracker) {
							// tracker may be undefined if using GTM or named trackers
							if (tracker) {
								data["clientid"] = tracker.get("clientId");
							}
						});
						if (!data["clientid"] && typeof w.ga.getAll === "function") {
							// we may have named trackers, the clientid should be the same for all of them
							trackers = w.ga.getAll();
							if (trackers && trackers.length > 0) {
								data["clientid"] = trackers[0].get("clientId");
							}
						}
					}
					catch (err) {
						// "ga" wasn't google analytics?
						warn("googleAnalytics: " + err);
					}
				}
				// if we still don't have the clientid then fallback to cookie parsing
				if (!data["clientid"]) {
					// cookie parsing for "Universal" GA
					// _ga cookie format : GA1.2.XXXXXXXXXX.YYYYYYYYYY
					// where XXXXXXXXXX.YYYYYYYYYY is the clientid
					cid = BOOMR.utils.getCookie("_ga");
					if (cid) {
						cid = cid.split(".");
						if (cid && cid.length === 4) {
							data["clientid"] = cid[2] + "." + cid[3];
						}
					}
					else {
						// cookie parsing for "Classic" GA
						// __utma #########.XXXXXXXXXX.YYYYYYYYYY.##########.##########.#
						// where XXXXXXXXXX.YYYYYYYYYY is the clientid
						cid = BOOMR.utils.getCookie("__utma");
						if (cid) {
							cid = cid.split(".");
							if (cid && cid.length === 6) {
								data["clientid"] = cid[1] + "." + cid[2];
							}
						}
					}
				}
			}

			// capture paramters from the url that are relevant to google analytics
			for (i = 0; i < QUERY_PARAMS.length; i++) {
				param = QUERY_PARAMS[i];
				value = BOOMR.utils.getQueryParamValue(param);
				if (value) {
					data[param] = value;
				}
			}

			return data;
		},

		/**
		 * Adobe Analytics
		 *
		 * AID: Analytics ID
		 * MID: Marketing ID
		 * Adobe's Marketing Cloud ID service uses a cookie named AMVC_#####@AdobeOrg,
		 * where ##### is the site owner's "client id". It stores the valud of MID and optionally AID
		 * If the site is not using Marketing Cloud, Analytics uses a legacy cookie named s_vi (AID)
		 * If the s_vi cookie is unable to be set due to 3rd party cookie restrictions,
		 * there is a fallback to a 1st party cookie named s_fid (AID).
		 *
		 * ref: https://marketing.adobe.com/resources/help/en_US/mcvid/mcvid_cookies.html
		 * ref: https://marketing.adobe.com/resources/help/en_US/mcvid/mcvid_idvars.html
		 * ref: https://marketing.adobe.com/resources/help/en_US/mcvid/mcvid_getmcvid.html
		 * ref: https://marketing.adobe.com/resources/help/en_US/mcvid/mcvid_getanalyticsvisitorid.html
		 *
		 * eVars and props aren't captured
		 *
		 * @return {Object} captured metrics
		 */
		adobeAnalytics: function() {
			var data = {};
			var aid, mid, amcv, visitor, m;
			var w = BOOMR.window;

			// regex that extracts the "organization id" from the AMCV_ cookie
			var AMCV_REGEX = /AMCV_([A-Z0-9]+)%40AdobeOrg/;

			// regex that extracts the id from the s_vi cookie (data between | and [)
			var SVI_REGEX = /\|([^\[]+)/;

			// check a few global vars to see if any Adobe products are installed
			// Adobe/Omniture's Data Tag Management global "_satellite" function
			// or Adobe/Omniture's Test&Target global "mboxCreate" function
			// or Adobe's Marketing Cloud ID Service's (AMCV) global "Visitor" function
			if (typeof w._satellite !== "undefined" || typeof w.mboxCreate === "function" || typeof w.Visitor === "function" || typeof w.s === "object") {
				if (impl.clientids) {
					// We'll try to fetch the "organization id" by using the global "s.visitor" object
					// "s" isn't reliably Adobe's SiteCatalyst object, the site owner might have renamed it
					if (typeof w.s === "object" &&
					    typeof w.s.visitor === "object" &&
					    typeof w.s.visitor.getAnalyticsVisitorID === "function" &&
					    typeof w.s.visitor.getMarketingCloudVisitorID === "function") {
						try {
							mid = w.s.visitor.getMarketingCloudVisitorID();
							if (mid) {
								data["mid"] = mid;
							}
							aid = w.s.visitor.getAnalyticsVisitorID();
							if (aid) {
								data["aid"] = w.s.visitor.getAnalyticsVisitorID();
							}
						}
						catch (err) {
							warn("adobeAnalytics: " + err);
						}
					}
					else {
						// Try extracting the "organization id" from the AMCV_ cookie instead
						// the result of Vistor.getInstance should be the same as if we did have "s.visitor"
						amcv = AMCV_REGEX.exec(w.document.cookie);
						if (amcv && typeof w.Visitor === "function" && typeof w.Visitor.getInstance === "function") {
							// we might have more than one AMCV_ cookie but we just take the first match for now
							try {
								visitor = w.Visitor.getInstance(amcv[1] + "@AdobeOrg");
								if (visitor && typeof visitor.getAnalyticsVisitorID === "function" && typeof visitor.getMarketingCloudVisitorID === "function") {
									mid = visitor.getMarketingCloudVisitorID();
									if (mid) {
										data["mid"] = mid;
									}
									aid = visitor.getAnalyticsVisitorID();
									if (aid) {
										data["aid"] = visitor.getAnalyticsVisitorID();
									}
								}
							}
							catch (err) {
								warn("adobeAnalytics: " + err);
							}
						}
						else {
							// AMCV doesn't seem to be installed
							// the legacy session id is in a cookie named s_vi if the publisher is using a cname to collect metrics
							// ie. third party cookie but on the same root domain name
							aid = BOOMR.utils.getCookie("s_vi");
							if (aid) {
								// s_vi will be in a format like this "[CS]v1|2B8147DA850785C4-6000010E2006DC28[CE]"
								// we need to extract the text between the pipe and the [CE]
								m = SVI_REGEX.exec(aid);
								if (m && m.length > 0) {
									aid = m[1];
								}
								else {
									aid = "";
								}
							}
							else {
								// fallback session id is a first party cookie named s_fid
								// eg. 6B280792FE0CFE56-162DA99B1988A2F8
								aid = BOOMR.utils.getCookie("s_fid");
							}
							if (aid) {
								data["aid"] = aid;
							}
						}
					}
				}

				if (typeof w.s === "object") {
					// get adobe campaign id
					// ref: https://marketing.adobe.com/resources/help/en_US/sc/implement/campaign.html
					if (typeof w.s.campaign === "string" && w.s.campaign) {
						data["campaign"] = w.s.campaign;
					}
					// get adobe purchase id
					// ref: https://marketing.adobe.com/resources/help/en_US/sc/implement/purchaseID.html
					if (typeof w.s.purchaseID === "string" && w.s.purchaseID) {
						data["purchaseid"] = w.s.purchaseID;
					}
				}
			}

			return data;
		},

		/**
		 * IBM Digital Analytics (CoreMetrics)
		 * IBM provides a global cmRetrieveUserID function to get the "Core ID" ("Visitor ID")
		 * The value is stored in a cookie named "CoreID6". Expiration: 15 years from date set.
		 * ref: https://www.ibm.com/support/knowledgecenter/SSPG9M/Implementation/AccessingIBMVisitorCookie.html
		 *
		 * off-site campaign information for "Marketing Management Center" (MMC), if available, is stored in a query parameter named "cm_mmc"
		 * ref: https://www.ibm.com/support/knowledgecenter/SSPG9M/Analytics/MarketingReports/cm_mmcparameter.html
		 *
		 * on-site "Site Promotions Analysis", if available, is stored in a query paramter named "cm_sp"
		 * ref: https://www.ibm.com/support/knowledgecenter/SSPG9M/Implementation/impl_sitepromo.html
		 *
		 * on-site "Real Estate Analysis", if available, is stored in a query parameter named "cm_re"
		 * ref: https://www.ibm.com/support/knowledgecenter/SSPG9M/Implementation/impl_realestate.html
		 *
		 * @return {Object} captured metrics
		 */
		ibmAnalytics: function() {
			var data = {};
			var w = BOOMR.window;
			var param, m, i, k, regex, fieldnames;

			// regexs to parse the query parameters into their fields
			var metrics = {
				"cm_mmc": [/([^&#]+?)-_-([^&#]+?)-_-([^&#]+?)-_-([^&#]+)/, ["mmc_vendor", "mmc_category", "mmc_placement", "mmc_item"]],
				"cm_sp": [/([^&#]+?)-_-([^&#]+?)-_-([^&#]+)/, ["sp_type", "sp_promotion", "sp_link"]],
				"cm_re": [/([^&#]+?)-_-([^&#]+?)-_-([^&#]+)/, ["re_version", "re_pagearea", "re_link"]]
			};

			if (impl.clientids && typeof w.cmRetrieveUserID === "function") {
				try {
					// in the current implementation of cmRetreiveUserID, the callback is called immediately (ie, not on a timer)
					w.cmRetrieveUserID(function(userid) {
						data["coreid"] = userid;
					});
				}
				catch (err) {
					// not coremetrics or not properly setup
					warn("ibmAnalytics: " + err);
				}
			}

			// capture analytics data from url query params
			for (k in metrics) {
				if (metrics.hasOwnProperty(k)) {
					param = BOOMR.utils.getQueryParamValue(k);
					if (param) {
						regex = metrics[k][0];
						fieldnames = metrics[k][1];
						m = regex.exec(param);
						if (m && m.length > fieldnames.length) {
							for (i = 0; i < fieldnames.length; i++) {
								if (m[i + 1]) {
									// value might be "null" or "na" but send it anyways
									data[fieldnames[i]] = decodeURIComponent(m[i + 1]);
								}
							}
						}
					}
				}
			}

			return data;
		},

		pageReady: function() {
			this.addedVars = [];

			var vendor, data, key, beaconParam;
			var vendors = {
				"ga": this.googleAnalytics,
				"aa": this.adobeAnalytics,
				"ia": this.ibmAnalytics
			};

			for (vendor in vendors) {
				data = vendors[vendor]();
				for (var key in data) {
					var beaconParam = "tp." + vendor + "." + key;
					if (!BOOMR.utils.inArray(beaconParam, this.dropParams)) {
						BOOMR.addVar(beaconParam, data[key]);
						impl.addedVars.push(beaconParam);
					}
				}
			}
			if (this.addedVars.length > 0) {
				BOOMR.sendBeacon();
			}
		},

		onBeacon: function() {
			if (this.addedVars && this.addedVars.length > 0) {
				BOOMR.removeVar(this.addedVars);
				this.addedVars = [];
			}
		}
	};

	//
	// Exports
	//
	BOOMR.plugins.TPAnalytics = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {boolean} config.TPAnalytics.clientids Whether or not to include
		 * client IDs.
		 * @param {string[]} config.TPAnalytics.dropParams Parameters to not include
		 * on the beacon.
		 *
		 * @returns {@link BOOMR.plugins.TPAnalytics} The TPAnalytics plugin for chaining
		 * @example
		 * BOOMR.init({
		 *   TPAnalytics: {
		 *     clientids: false
		 *   }
		 * });
		 * @memberof BOOMR.plugins.TPAnalytics
		 */
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "TPAnalytics", ["clientids", "dropParams"]);

			if (!impl.initialized) {
				if (!BOOMR.utils.isArray(impl.dropParams)) {
					impl.dropParams = [];
				}
				BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
				BOOMR.subscribe("beacon", impl.onBeacon, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.pageReady, null, impl);
				impl.initialized = true;
			}

			return this;
		},

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.TPAnalytics
		 */
		is_complete: function() {
			return true;
		}
	};

}());
