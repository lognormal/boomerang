(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	var dc = document,
	    s = "script",
	    dom = location.hostname,
	    complete = false,
	    t_start, load;

	// Don't even bother creating the plugin if this is mhtml
	if (!dom || dom === "localhost" || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//)) {
		return;
	}

	load = function() {
		var s0 = dc.getElementsByTagName(s)[0],
		    s1 = dc.createElement(s);

		s1.onload = BOOMR.plugins.CT.loaded;
		s1.src = cached_url;
		t_start = new Date().getTime();
		BOOMR.addVar("cch.ce", t_start);

		s0.parentNode.insertBefore(s1, s0);
		s0 = s1 = null;

		// this is a timeout so we don't wait forever to send the beacon
		// if the server fails
		setTimeout(BOOMR.plugins.CT.loaded, 500);
	};

	BOOMR.plugins.CT = {
		init: function(config) {
			if (complete) {
				return this;
			}

			if (config && config.CT && config.CT.cached_url) {
				cached_url = config.CT.cached_url;
			}
			else {
				complete = true;
				return this;
			}

			if (BOOMR.window === window) {
				BOOMR.subscribe("page_ready", load, null, null);
			}
			else {
				load();
			}

			return this;
		},

		is_complete: function() {
			return complete;
		},

		loaded: function(t) {
			if (complete) {
				return;
			}
			if (!t) { t = -1; }
			// how long did it take for the call to return
			BOOMR.addVar({
				"cch.lt": new Date().getTime() - t_start,
				"cch.se": t
			});
			complete = true;
			BOOMR.sendBeacon();
		}

	};

}());
