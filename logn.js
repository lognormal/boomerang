(function(w) {
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	key: "",
	sig: "",
	grp: ""
};

BOOMR.plugins.LOGN = {
	init: function(config) {
		BOOMR.utils.pluginConfig(impl, config, "LOGN", ["key", "sig", "grp"]);

		if(!impl.key) {
			BOOMR.warn("LOGN.key is not set.  Beacons may not be accepted.", "logn");
		}

		BOOMR.addVar({
			"h.key": impl.key,
			"h.cr":  impl.sig,
			"h.pg":  impl.grp
		});
	},

	is_complete: function() {
		return true;
	}
};

}(window));
