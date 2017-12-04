/**
\file mobile.js
Plugin to capture navigator.connection.type on browsers that support it
*/

(function() {
	var connection, param_map = {
		"type": "ct",
		"bandwidth": "bw",
		"metered": "mt",
		"effectiveType": "etype",
		"downlinkMax": "lm",
		"downlink": "dl",
		"rtt": "rtt"
	};

	BOOMR = window.BOOMR || {};

	if (typeof BOOMR.addVar !== "function") {
		return;
	}

	if (typeof navigator === "object") {
		connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
	}

	if (!connection) {
		return;
	}

	function setVars() {
		var k;

		for (k in param_map) {
			if (k in connection) {
				// Remove old parameter value from the beacon because new value might be falsey which won't overwrite old value
				BOOMR.removeVar("mob." + param_map[k]);
				if (connection[k]) {
					BOOMR.addVar("mob." + param_map[k], connection[k]);
				}
			}
		}
	}

	// If connection information changes, we collect the latest values
	if (connection.addEventListener) {
		connection.addEventListener("change", function() {
			setVars();
			BOOMR.fireEvent("netinfo", connection);
		});
	}

	setVars();
}());
