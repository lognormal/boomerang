(function(w) {
BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var dc=document,
    s="script",
    dom=w.location.hostname,
    complete=false;

// Don't even bother creating the plugin if this is mhtml
if(!dom || dom == 'localhost' || dom.match(/\.\d+$/) || dom.match(/^mhtml/) || dom.match(/^file:\//)) {
	return;
}

var loaded=function() {
	if(complete) {
		return;
	}
	complete = true;
	BOOMR.sendBeacon();
};

var load=function() {
	var s0=dc.getElementsByTagName(s)[0],
	    s1=dc.createElement(s);

	s1.onload = loaded;
	s1.src="//lognormal.net/boomerang/cache-test.js";

	s0.parentNode.insertBefore(s1, s0);
	s0=s1=null;
};

BOOMR.plugins.CT = {
	init: function() {
		if(complete) {
			return this;
		}

		if(w == window) {
			BOOMR.subscribe("page_ready", load, null, null);
		}
		else {
			load();
		}

		return this;
	},

	is_complete: function() {
		return complete;
	}
};

}(BOOMR.window));

