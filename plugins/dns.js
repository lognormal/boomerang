/**
 * Plugin to measure DNS latency.
 *
 * This code is based on Carlos Bueno's guide to DNS on the
 * [YDN blog](http://developer.yahoo.net/blog/archives/2009/11/guide_to_dns.html)
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Setup
 *
 * Measuring DNS requires some server-side set up, as
 * [documented in detail](http://developer.yahoo.net/blog/archives/2009/11/guide_to_dns.html) by
 * Yahoo! engineer Carlos Bueno, so go read his post for everything you'll need to set this up.
 *
 * In brief, the points he covers are:
 *
 * 1. Set up a wildcard hostname, perferably one that does not share cookies with
 *   your main site. Give it a low TTL, say, 60 seconds, so you don't pollute downstream caches.
 * 2. Set up a webserver for the wildcard hostname that serves the images named `A.gif`
 *   and `B.gif` (from the `images/` subdirectory) as fast as possible.  Make sure
 *   that KeepAlive, Nagle, and any caching headers are turned off.
 * 3. Include the DNS plugin (see {@tutorial building})
 * 4. Tell the DNS plugin where to get its images from
 *   via {@link BOOMR.plugins.DNS.init DNS.base_url}
 *
 * Steps 1 and 2 are complicated, and if you don't have full control over your
 * DNS server, then it may be impossible for you to use this plugin.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `dns.t`: The worst-case DNS latency from the user's browser to your DNS server.
 *
 * @class BOOMR.plugins.DNS
 */
(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.DNS) {
		return;
	}

	var impl = {
		complete: false,
		base_url: "",
		t_start: null,
		t_dns: null,
		t_http: null,
		img: null,

		gen_url: "",

		start: function() {
			if (impl.gen_url) {	// already running
				return;
			}

			var random = BOOMR.utils.generateId(10);

			impl.gen_url = impl.base_url.replace(/\*/, random);

			impl.img = new Image();
			impl.img.onload = impl.A_loaded;

			impl.t_start = new Date().getTime();
			impl.img.src = impl.gen_url + "image-l.gif?t=" + random;
		},

		A_loaded: function() {
			var random = BOOMR.utils.generateId(10);

			impl.t_dns = new Date().getTime() - impl.t_start;

			impl.img = new Image();
			impl.img.onload = impl.B_loaded;

			impl.t_start = new Date().getTime();
			impl.img.src = impl.gen_url + "image-l.gif?t=" + random;
		},

		B_loaded: function() {
			impl.t_http = new Date().getTime() - impl.t_start;

			impl.img = null;
			impl.done();
		},

		done: function() {
			// DNS time is the time to load the image with uncached DNS
			// minus the time to load the image with cached DNS

			var dns = impl.t_dns - impl.t_http;

			BOOMR.addVar("dns.t", dns);
			impl.complete = true;
			impl.gen_url = "";
			BOOMR.sendBeacon();
		}
	};

	BOOMR.plugins.DNS = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {string} config.DNS.base_url The `base_url` parameter tells the DNS
		 * plugin where it can find its DNS testing images. This URL must contain
		 * a wildcard character (`*`) which will be replaced with a random string.
		 *
		 * The images will be appended to this string without any other modification.
		 *
		 * If you have any pages served over HTTPS, then this URL should be configured
		 * to work over HTTPS as well as HTTP.
		 *
		 * The protocol part of the URL will be automatically changed to fit the
		 * current document.
		 *
		 * @returns {@link BOOMR.plugins.DNS} The DNS plugin for chaining
		 * @example
		 * BOOMR.init({
		 *   DNS: {
		 *     base_url: "http://*.yoursite.com/images/"
		 *   }
		 * });
		 * @memberof BOOMR.plugins.DNS
		 */
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "DNS", ["base_url"]);

			if (config && config.wait) {
				return this;
			}

			if (!impl.base_url) {
				BOOMR.warn("DNS.base_url is not set.  Cannot run DNS test.", "dns");
				impl.complete = true;	// set to true so that is_complete doesn't
							// block other plugins
				return this;
			}

			// do not run test over https
			if (BOOMR.window.location.protocol === "https:") {
				impl.complete = true;
				return this;
			}

			BOOMR.subscribe("page_ready", impl.start, null, impl);

			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.DNS
		 */
		is_complete: function() {
			return impl.complete;
		}
	};

}());
