/**
 * \file cache_reload.js
 * Plugin that forces a cache reload of boomerang (assuming you have server side support)
 * Copyright (c) 2013, SOASTA, Inc. All rights reserved.
 */


(function() {

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};
if(BOOMR.plugins.CACHE_RELOAD) {
	return;
}

var impl = {
	url: ""
};

BOOMR.plugins.CACHE_RELOAD = {
	init: function(config) {
		BOOMR.utils.pluginConfig(impl, config, "CACHE_RELOAD", ["url"]);

		if(!impl.url) {
			return this;
		}

		// we use document and not BOOMR.window.document since
		// we can run inside the boomerang iframe if any
		var i=document.createElement("iframe");
		i.style.display="none";
		i.src=impl.url;
		document.body.appendChild(i);

		return this;
	},

	is_complete: function() {
		// we always return true since this plugin never adds anything to the beacon
		return true;
	}
};

}());

