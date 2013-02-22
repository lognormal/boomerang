/**
\file mobile.js
Plugin to capture navigator.connection.type on browsers that support it
*/

BOOMR.addVar("mob.ct", (typeof navigator === 'object' && navigator.connection) ? navigator.connection.type : 0);
