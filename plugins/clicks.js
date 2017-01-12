/**
\file clicks.js
A plugin beaconing clicked elements back to the server
*/

// w is the window object
(function(w) {

	var d = w.document;

	// First make sure BOOMR is actually defined.  It's possible that your plugin is
	// loaded before boomerang, in which case you'll need this.
	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	// A private object to encapsulate all your implementation details
	// This is optional, but the way we recommend you do it.
	var impl = {
		start_time: "",
		click_url: "",
		onbeforeunload: false,
		retention: [],
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

	BOOMR.plugins.clicks = {
		init: function(config) {
			var properties = ["click_url",	  // URL to beacon
					 "onbeforeunload"]; // Send the beacon when page is closed?

			// This block is only needed if you actually have user configurable properties
			BOOMR.utils.pluginConfig(impl, config, "clicks", properties);

			// Other initialisation code here
			w.addEventListener("click", impl.handleEvent, true);
			w.addEventListener("beforeunload", impl.unload, true);
			return this;
		},

		// Any other public methods would be defined here

		is_complete: function() {
			// This method should determine if the plugin has completed doing what it
			/// needs to do and return true if so or false otherwise
			impl.start_time = Date.now();
			return true;
		}
	};

}(window));
