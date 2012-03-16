/**
\file mobile.js
Plugin to capture navigator.connection.type on browsers that support it
*/

(function() {
	var ct = 0;
	if(typeof navigator != 'undefined' && navigator.connection) {
		ct = navigator.connection.type
	}
	BOOMR.addVar("mob.ct", ct);
}());
