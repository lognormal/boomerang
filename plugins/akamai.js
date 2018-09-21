
/**
 * This plugin will house logic specific to Akamai infrastructure.
 *
 * This plugin responds to the dns_prefetch_url parameter in the Akamai section of the config response.
 * When dns_prefetch_url parameter is present in the config response, this plugin will append a Link
 * element to perform a DNS prefetch against he host specified in the config request. This request would
 * only be done after the page load event so as to not interfere with the page's intended behavior.
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
	 * Debug logging
	 *
	 * @param {string} msg Message
	 */
	function log(msg) {
		BOOMR.debug(msg, "Akamai");
	}

	var impl = {
		initialized: false,
		dns_prefetch_url: undefined,
		mapping_xhr_base_url: undefined,
		mapping_xhr_url_path: undefined,
		mapping_xhr_url_v4_prefix: undefined,
		mapping_xhr_url_v6_prefix: undefined,

		/**
		 * Adds a Link Rel DNS-prefetch element to the Head of the Boomerang iFrame
		 * if the dns_prefetch_url config parameter is present.
		 */
		pageReady: function() {

			log("Evaluating DNS prefetch requirements");
			if (impl.dns_prefetch_url) {
				// We got the dns_prefetch_url parameter from the config
				// response, so let's insert it now into the page. We are doing this
				// after page_ready state so that we don't block any needed actions
				// on the page and also page_ready guarantees that we only execute this
				// once.
				log("Setting up DNS prefetch in Boomerang iFrame");
				var linkRel = document.createElement("link");
				linkRel.setAttribute("id", "dnsprefetchlink");
				linkRel.setAttribute("rel", "dns-prefetch");
				linkRel.setAttribute("href", impl.dns_prefetch_url);
				document.getElementsByTagName("head")[0].appendChild(linkRel);
			}

			// Check if information for Mapping XHR calls are present. If so prepare
			// and issue XHR requests.
			log("Evaluating XHR call requirements if XMLHttpRequest feature is enabled");
			if (window.XMLHttpRequest && impl.mapping_xhr_base_url && impl.mapping_xhr_url_path &&
				(impl.mapping_xhr_url_v4_prefix || impl.mapping_xhr_url_v6_prefix)) {

				// Example endpoint for XHR request:
				// https://trial-eum-clientnsv4-s.akamaihd.net/eum/getdns.txt?c=pxxxxx

				if (impl.mapping_xhr_url_v4_prefix) {
					var mappingXhrV4RequestUrl = "https://" + impl.mapping_xhr_url_v4_prefix + "." + impl.mapping_xhr_base_url + impl.mapping_xhr_url_path + "?c=p" + BOOMR.pageId;
					log("Will make a v4 XHR request to: " + mappingXhrV4RequestUrl);

					var mappingXhrReq = new XMLHttpRequest();
					mappingXhrReq.open("GET", mappingXhrV4RequestUrl, true);
					setTimeout(function() {
						mappingXhrReq.send();
					}, 200);
				}

				if (impl.mapping_xhr_url_v6_prefix &&
					BOOMR.getVar("ak.ipv") === "6") {
					var mappingXhrV6RequestUrl = "https://" + impl.mapping_xhr_url_v6_prefix + "." + impl.mapping_xhr_base_url + impl.mapping_xhr_url_path + "?c=p" + BOOMR.pageId;
					log("Will make a v6 XHR request to: " + mappingXhrV6RequestUrl);

					var mappingXhrV6Req = new XMLHttpRequest();
					mappingXhrV6Req.open("GET", mappingXhrV6RequestUrl, true);
					setTimeout(function() {
						mappingXhrV6Req.send();
					}, 200);
				}
			}
		}
	};

	BOOMR.plugins.Akamai = {
		/**
		 * Initializes the plugin.
		 * @param {object} config Configuration
		 * @param {string} config.Akamai.dns_prefetch_url The `dns_prefetch_url` parameter
		 * tells the Akamai plugin what hostname, if any, the plugin should make a DNS Prefetch
		 * request to.
		 *
		 * @returns {@link BOOMR.plugins.Akamai} The Akamai plugin for chaining
		 * @example
		 * BOOMR.init({
		 *   Akamai: {
		 *      dns_prefetch_url : "//hostnametodnsprefetch.com"
		 *
		 *   }
		 * });
		 * @memberof BOOMR.plugins.Akamai
		 */
		init: function(config) {

			BOOMR.utils.pluginConfig(impl, config, "Akamai",
				["dns_prefetch_url", "mapping_xhr_base_url", "mapping_xhr_url_path", "mapping_xhr_url_v4_prefix", "mapping_xhr_url_v6_prefix"]);

			if (impl.initialized) {
				return this;
			}

			BOOMR.subscribe("page_ready", impl.pageReady, null, impl);
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
