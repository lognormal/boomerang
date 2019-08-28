/**
 * Plugin to capture
 * [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
 * on browsers that support it.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Beacon Parameters
 *
 * This plugin adds the following parameters to the beacon:
 *
 * * `mob.ct`: [`navigator.connection.type`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/type)
 * * `mob.bw`: [`navigator.connection.bandwidth`](https://developer.mozilla.org/en-US/docs/Web/API/Connection/bandwidth)
 * * `mob.mt`: [`navigator.connection.metered`](https://developer.mozilla.org/en-US/docs/Web/API/Connection/metered)
 * * `mob.lm`: [`navigator.connection.downlinkMax`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlinkMax)
 *
 * @class BOOMR.plugins.Mobile
 */
(function() {
	var connection, param_map = {
		"type": "ct",
		"bandwidth": "bw",
		"metered": "mt",
		"effectiveType": "etype",
		"downlinkMax": "lm",
		"downlink": "dl",
		"rtt": "rtt",
		"saveData": "sd"
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
			if (typeof connection[k] !== "undefined") {
				// Remove old parameter value from the beacon because new value might be falsy which won't overwrite old value
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
