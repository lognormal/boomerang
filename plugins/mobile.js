/**
\file mobile.js
Plugin to capture navigator.connection.type on browsers that support it
*/

(function() {
var connection;

	if(typeof navigator === "object") {
		connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || navigator.msConnection;
	}

	if(!connection) {
		return;
	}
	BOOMR.addVar("mob.ct", connection.type);
	BOOMR.addVar("mob.bw", connection.bandwidth);
	BOOMR.addVar("mob.mt", connection.metered);

}());
