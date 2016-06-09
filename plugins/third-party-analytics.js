/*eslint dot-notation:0*/
/**
\file third-party-analytics.js

Captures session ids and campaign information from third party analytic vendors installed on the same page
*/

(function() {
	"use strict";

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.TPAnalytics) {
		return;
	}

	var impl = {
		addedVars: [],

		/**
		 * Google Analytics
		 * by default the clientid is stored in a cookie named "_ga" for 2 years
		 * there is a function named "ga" which is used to retreive it
		 * ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id
		 *
		 * @return {Object} captured metrics
		 */
		googleAnalytics: function() {
			var data = {};
			var w = BOOMR.window;
			var i, param, value;

			// list of query params that we want to capture
			// ref: https://support.google.com/analytics/answer/1033863
			var QUERY_PARAMS = ["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign"];

			// check for google's global "ga" function then get the clientId
			if (typeof w.ga === "function") {
				try {
					w.ga(function(tracker) {
						data["clientid"] = tracker.get("clientId");
					});
				}
				catch (err) {
					// "ga" wasn't google analytics?
					BOOMR.addError(err, "TPAnalytics googleAnalytics");
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
				// We'll try to fetch the "organization id" by using the global "s.visitor" object
				// "s" isn't reliably Adobe's SiteCatalyst object, the site owner might have renamed it
				if (typeof w.s === "object" && typeof w.s.visitor === "object"
					&& typeof w.s.visitor.getAnalyticsVisitorID === "function" && typeof w.s.visitor.getMarketingCloudVisitorID === "function") {
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
						BOOMR.addError(err, "TPAnalytics adobeAnalytics");
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
							BOOMR.addError(err, "TPAnalytics adobeAnalytics");
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

				// get adobe campaign id
				if (typeof w.s === "object" && typeof w.s.campaign === "string" && w.s.campaign) {
					data["campaign"] = w.s.campaign;
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
		 * on-site "cm_sp" (Site Promotions Analysis) and "cm_re" (Real Estate Analysis) query parameters aren't captured.
		 *
		 * @return {Object} captured metrics
		 */
		ibmAnalytics: function() {
			var data = {};
			var w = BOOMR.window;
			var mmc, m, i;

			// regex to parse the MMC "cm_mmc" query parameter into it's parts
			var MMC_FIELDS = ["mmc_vendor", "mmc_category", "mmc_placement", "mmc_item"];
			var MMC_REGEX = /([^&#]+)-_-([^&#]+)-_-([^&#]+)-_-([^&#]+)/;

			if (typeof w.cmRetrieveUserID === "function") {
				try {
					// in the current implementation of cmRetreiveUserID, the callback is called immediately (ie, not on a timer)
					w.cmRetrieveUserID(function(userid) {
						data["coreid"] = userid;
					});
				}
				catch (err) {
					// not coremetrics?
					BOOMR.addError(err, "TPAnalytics ibmAnalytics");
				}
			}

			// capture MMC campaign params in the url
			mmc = BOOMR.utils.getQueryParamValue("cm_mmc");
			if (mmc) {
				m = MMC_REGEX.exec(mmc);
				if (m && m.length > MMC_FIELDS.length) {
					for (i = 0; i < MMC_FIELDS.length; i++) {
						if (m[i + 1]) {
							// value might be "null" or "na" but send it anyways
							data[MMC_FIELDS[i]] = m[i + 1];
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
					BOOMR.addVar(beaconParam, data[key]);
					impl.addedVars.push(beaconParam);
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

	BOOMR.plugins.TPAnalytics = {
		init: function(config) {

			if (!impl.initialized) {
				BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
				BOOMR.subscribe("onbeacon", impl.onBeacon, null, impl);
				BOOMR.subscribe("prerender_to_visible", impl.pageReady, null, impl);
				impl.initialized = true;
			}

			return this;
		},

		is_complete: function() {
			return true;
		}
	};

}());
