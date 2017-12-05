/**
\file mobile.js
Plugin to capture navigator.connection.type on browsers that support it
*/

(function() {
	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	var impl = {
		connection: null,
		param_map: {
			"type": "ct",
			"bandwidth": "bw",
			"metered": "mt",
			"effectiveType": "etype",
			"downlinkMax": "lm",
			"downlink": "dl",
			"rtt": "rtt",
			"saveData": "sd"
		},

		/**
		 * Get the connection information object if available.
		 *
		 * @returns {null|NavigatorNetworkInformation} The network information API data.
		 */
		getConnection: function() {
			if (this.connection) {
				return this.connection;
			}

			if (typeof navigator === "object") {
				this.connection = navigator.connection ||
					navigator.mozConnection ||
					navigator.webkitConnection ||
					navigator.msConnection;
			}

			return this.connection;
		},

		/**
		 * Add listener to update network information when it changes.
		 *
		 * @returns {void}
		 */
		subscribe: function() {
			var connection = this.getConnection();

			if (connection.addEventListener) {
				connection.addEventListener("change", function() {
					impl.setConnectionInformation();
					BOOMR.fireEvent("netinfo", connection);
				});
			}
		},

		/**
		 * Set connection information.
		 *
		 * Uses information from the Network Information API to add variable to the beacon. This data is set once the plugin
		 * is initiated and is only updated if the network information changes.
		 *
		 * @returns {void}
		 */
		setConnectionInformation: function() {
			var k, connection, type, param_map = this.param_map;

			connection = this.getConnection();

			for (k in param_map) {
				if (k in connection) {
					// Remove old parameter value from the beacon because new value might be falsey which won't overwrite old value
					BOOMR.removeVar("mob." + param_map[k]);

					type = typeof connection[k];
					if (type === "number" || type === "string" || type === "boolean") {
						BOOMR.addVar("mob." + param_map[k], connection[k]);
					}
				}
			}
		}
	};

	BOOMR.plugins.Mobile = {
		init: function() {
			var connection = impl.getConnection();

			// Only get information if we have a source for the information
			if (connection) {
				impl.setConnectionInformation();
				impl.subscribe();
			}

			return this;
		},

		is_complete: function() {
			return true;
		}
	};
}());
