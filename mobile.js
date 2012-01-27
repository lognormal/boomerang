/**
\file mobile.js
Plugin to capture navigator.connection.type on browsers that support it
*/

BOOMR.plugins.MOBILE = {
	init: function() {
		var ct = 0;
		if(navigator && navigator.connection) {
			ct = navigator.connection.type
		}
		BOOMR.addVar("mob.ct", ct);
		return this;
	},

	is_complete: function() {
		return true;
	}
};

