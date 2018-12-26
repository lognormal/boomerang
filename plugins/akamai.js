
/**
 * This plugin will house logic specific to Akamai infrastructure.
 *
 * This plugin responds to the dns_prefetch_enabled parameter in the Akamai section of the config response.
 * When dns_prefetch_enabled parameter is present in the config response, this plugin checks the BOOMR.plugins.AK
 * plugin to see if a host is specified for dns prefetch. If so, this plugin will append a Link element
 * to perform a DNS prefetch against he host specified in the AK plugin. This request would
 * only be done after the page load event so as to not interfere with the page's intended behavior.
 * This plugin also perform two additional XHR requests against Mapping v4 and v6 hosts if instructed to
 * do so in the config response.
 *
 * ## Beacon Parameters
 *
 * This plugin does not add any parameters to the beacon
 *
 * @class BOOMR.plugins.Akamai
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.Akamai) {
		return;
	}

	/**
	 * Marker for identifing if XHR was perform recently.
	 */
	var XHR_RETRY_LOCALSTORAGE_NAME = "akamaiXhrRetry";

	/* BEGIN_DEBUG */
	/**
	 * Debug logging
	 *
	 * @param {string} msg Message
	 */
	function debugLog(msg) {
		BOOMR.debug(msg, "Akamai");
	}
	/* END_DEBUG */

	var impl = {
		initialized: false,
		dns_prefetch_enabled: undefined,
		mapping_xhr_base_url: undefined,
		mapping_xhr_url_path: undefined,
		mapping_xhr_url_v4_prefix: undefined,
		mapping_xhr_url_v6_prefix: undefined,
		xhrRetryMarker: XHR_RETRY_LOCALSTORAGE_NAME,
		complete: false,

		/**
		 * There are two behavior being performed here. First, when the dns_prefetch_enabled config parameter
		 * is present, this adds a Link Rel DNS-prefetch element to the Head Element of the Boomerang iFrame
		 * if Boomerang is loaded in an iFrame. Otherwise this adds a Link Rel DNS-prefetch element
		 * directly under the Head Element of the page.
		 * Second, if the IPv4|IPv6 pieces are present in the config, this will result in potentially one XHR
		 * each being issued IPv4 and IPV6 hosts specified in the config parameter.
		 */
		done: function(edata, ename) {

			if (this.complete) {
				// We have already handled either a page_ready or a xhr_load event.
				return;
			}

			debugLog("Evaluating DNS prefetch requirements");
			if (impl.dns_prefetch_enabled) {
				// We got the dns_prefetch_enabled parameter from the config
				// response, so we will perform a DNS prefetch against the host, if any,
				// that is specified in the AK plugin. We are doing this
				// after page_ready state so that we don't block any needed actions
				// on the page and also page_ready guarantees that we only execute this
				// once.

				if (BOOMR.plugins.AK && BOOMR.plugins.AK.akDNSPreFetchDomain) {
					// akDNSPreFetchDomain is the Mapping host against which we are to
					// perform a DNS prefetch request.
					debugLog("Setting up DNS prefetch link tag, against domain: " + BOOMR.plugins.AK.akDNSPreFetchDomain);
					var linkRel = document.createElement("link");
					linkRel.setAttribute("id", "dnsprefetchlink");
					linkRel.setAttribute("rel", "dns-prefetch");
					linkRel.setAttribute("href", "//" + BOOMR.plugins.AK.akDNSPreFetchDomain);
					document.getElementsByTagName("head")[0].appendChild(linkRel);
				}
			}

			// Check if information for Mapping XHR calls are present. If so prepare
			// and issue XHR requests. Only issue XHR request if we havent issued in the
			// last 30 minutes.
			debugLog("Evaluating XHR call requirements if XMLHttpRequest feature is enabled");

			if (window.XMLHttpRequest &&
				!BOOMR.utils.getLocalStorage(impl.xhrRetryMarker) &&
				impl.mapping_xhr_base_url && impl.mapping_xhr_url_path &&
				(impl.mapping_xhr_url_v4_prefix || impl.mapping_xhr_url_v6_prefix)) {

				// Example endpoint for XHR request:
				// https://trial-eum-clientnsv4-s.akamaihd.net/eum/getdns.txt?c=pxxxxx

				if (impl.mapping_xhr_url_v4_prefix) {
					var mappingXhrV4RequestUrl = "https://" + impl.mapping_xhr_url_v4_prefix + "." + impl.mapping_xhr_base_url + impl.mapping_xhr_url_path + "?c=p" + BOOMR.pageId;
					debugLog("Will make a v4 XHR request to: " + mappingXhrV4RequestUrl);

					var mappingXhrReq = new XMLHttpRequest();
					mappingXhrReq.open("GET", mappingXhrV4RequestUrl, true);
					setTimeout(function() {
						mappingXhrReq.send();
					}, 200);
				}

				if (impl.mapping_xhr_url_v6_prefix) {
					var mappingXhrV6RequestUrl = "https://" + impl.mapping_xhr_url_v6_prefix + "." + impl.mapping_xhr_base_url + impl.mapping_xhr_url_path + "?c=p" + BOOMR.pageId;
					debugLog("Will make a v6 XHR request to: " + mappingXhrV6RequestUrl);

					var mappingXhrV6Req = new XMLHttpRequest();
					mappingXhrV6Req.open("GET", mappingXhrV6RequestUrl, true);
					setTimeout(function() {
						mappingXhrV6Req.send();
					}, 200);
				}

				// Mark the localStorage to let us know that we have already made the XHR call
				// and should wait atleast 30 mins (1800 seconds) before resending XHR requests.
				BOOMR.utils.setLocalStorage(impl.xhrRetryMarker, {}, 1800);
			}
			else {
				if (BOOMR.utils.getLocalStorage(impl.xhrRetryMarker)) {
					debugLog("Not resending XHR request as LocalStorage indicates request was sent recently");
				}
			}

			// There are two events (page_ready and xhr_load) that could trigger this call back. So
			// mark that we have completed handling for either of these events.
			this.complete = true;
		}
	};

	BOOMR.plugins.Akamai = {
		/**
		 * Initializes the plugin.
		 * @param {object} config Configuration
		 * @param {string} config.Akamai.dns_prefetch_enabled The `dns_prefetch_enabled` parameter
		 * tells the Akamai plugin should make a DNS Prefetch request.
		 *
		 * @returns {@link BOOMR.plugins.Akamai} The Akamai plugin for chaining
		 * @example
		 * BOOMR.init({
		 *   Akamai: {
		 *      dns_prefetch_enabled : "true"
		 *   }
		 * });
		 * @memberof BOOMR.plugins.Akamai
		 */
		init: function(config) {

			BOOMR.utils.pluginConfig(impl, config, "Akamai",
				["dns_prefetch_enabled", "mapping_xhr_base_url", "mapping_xhr_url_path", "mapping_xhr_url_v4_prefix", "mapping_xhr_url_v6_prefix"]);

			if (impl.initialized) {
				return this;
			}

			BOOMR.subscribe("page_ready", impl.done, "load", impl);
			BOOMR.subscribe("xhr_load", impl.done, "xhr", impl);
			impl.initialized = true;

			return this;
		},

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Akamai
		 */
		is_complete: function() {
			// we always return true since this plugin never adds anything to the beacon
			return true;
		}
	};

}());
