/**
 * The `Clicks` plugin tracks all mouse clicks on a page and beacons them to a dedicated endpoint on your server.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * The following parameters are sent when a click event is triggered.
 *
 * * `element`: The `nodeName` of the element that has been clicked (ie. `A`, `BUTTON`, `NAV`, etc.)
 * * `id`: The `id` of the element if specified
 * * `class`: The `class` attribute of the element
 * * `document_height`: The height of the `document`
 * * `document_width`: The width of the `document`
 * * `viewport_height`: The height of the viewport when the `click` event was triggered
 * * `viewport_width`: The width of the viewport when the `click` event was triggered
 *
 * @class BOOMR.plugins.Clicks
 */
// w is the window object
(function(w) {
	var d = w.document;

	// Ensure Boomerang is defined
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.clicks) {
		return;
	}

	var impl = {
		// local vars
		click_url: "",
		onbeforeunload: false,
		retention: [],

		// functions
		handleEvent: function(event) {
			if (typeof impl.click_url === "undefined") {
				BOOMR.error("No Beacon URL defined will not send beacon");
				return;
			}

			var target = null;
			if (event.target) { target = event.target; }
			else if (event.srcElement) { target = event.srcElement; }
			var document_res = impl.getDocumentSize();
			var viewport = impl.getViewport();
			var data = {
				element: target.nodeName,
				id: target.id,
				"class": target.classList,
				x: event.x,
				y: event.y,
				document_height: document_res.height,
				document_width: document_res.width,
				viewport_height: viewport.height,
				viewport_width: viewport.width
			};

			if (typeof impl.onbeforeunload === "undefined" || impl.onbeforeunload === false) {
				BOOMR.info("No preference set for when to send clickstats, will default to send immediately");
				impl.sendData(data);
			}
			else {
				impl.retention.push(data);
			}
		},
		sendData: function(data) {
			var keys = Object.keys(data);
			var urlenc = "";
			for (var i in keys) {
				urlenc += keys[i] + "=" + data[keys[i]] + "&";
			}
			BOOMR.info("Url-encoded string: " + urlenc);
			var url = impl.click_url + "?" + urlenc;
			var img = new Image();
			img.src = url;
			img.remove();
		},
		unload: function() {
			impl.retention.forEach(function(data){
				impl.sendData(data);
			});
		},
		getDocumentSize: function() {
			return {
				height: Math.max(
					d.body.scrollHeight, d.documentElement.scrollHeight,
					d.body.offsetHeight, d.documentElement.offsetHeight,
					d.body.clientHeight, d.documentElement.clientHeight
				),
				width: Math.max(
					d.body.scrollWidth, d.documentElement.scrollWidth,
					d.body.offsetWidth, d.documentElement.offsetWidth,
					d.body.clientWidth, d.documentElement.clientWidth
				)
			};
		},
		getViewport: function() {
			var viewPortWidth;
			var viewPortHeight;

			// the more standards compliant browsers (mozilla/netscape/opera/IE7)
			// use window.innerWidth and window.innerHeight
			if (typeof window.innerWidth !== "undefined") {
				viewPortWidth = window.innerWidth;
				viewPortHeight = window.innerHeight;
			}

			// IE6 in standards compliant mode (i.e. with a valid doctype as the
			// first line in the document)
			else if (typeof document.documentElement !== "undefined" &&
			    typeof document.documentElement.clientWidth !== "undefined" &&
			    document.documentElement.clientWidth !== 0) {
				viewPortWidth = document.documentElement.clientWidth;
				viewPortHeight = document.documentElement.clientHeight;
			}

			// older versions of IE
			else {
				viewPortWidth = document.getElementsByTagName("body")[0].clientWidth;
				viewPortHeight = document.getElementsByTagName("body")[0].clientHeight;
			}
			return {width: viewPortWidth, height: viewPortHeight};
		}
	};

	BOOMR.plugins.Clicks = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {string} config.Clicks.click_url The URL the click events will be beaconed to.
		 * @param {boolean} [config.Clicks.onbeforeunload] A boolean value for when to send click events.  If this is `true`, clicks will be sent when the page is unloaded.  Otherwise, click events are sent immediately as they occur.
		 *
		 * @returns {@link BOOMR.plugins.Clicks} The Clicks plugin for chaining
		 * @memberof BOOMR.plugins.Clicks
		 */
		init: function(config) {
			var properties = [
				"click_url",     // URL to beacon
				"onbeforeunload" // Send the beacon when page is closed?
			];

			BOOMR.utils.pluginConfig(impl, config, "Clicks", properties);

			// Other initialisation code here
			w.addEventListener("click", impl.handleEvent, true);
			w.addEventListener("beforeunload", impl.unload, true);

			return this;
		},

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Clicks
		 */
		is_complete: function() {
			return true;
		}
	};
}(window));
