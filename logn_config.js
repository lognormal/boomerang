(function(w) {
var d=w.document,
    s="script",
    dom=d.URL.replace(/^https?:\/\//, '').replace(/[:?;\/].*$/, ''),
    complete = false;

// Don't even bother creating the plugin if this is mhtml
if(d.match(/^mhtml/) || d.match(/^file:\//)) {
	return;
}

var loaded=function() {
	BOOMR.plugins.RT.endTimer('t_configjs');
	complete=true;
	BOOMR.sendBeacon();
};

var load=function() {
	var s0=d.getElementsByTagName(s)[0],
	    s1=d.createElement(s),

	s1.onload=loaded;
	BOOMR.plugins.RT.startTimer('t_configjs');
	s1.src="//lognormal.net/boomerang/config.js?key=%client_apikey%&d=" + encodeURIComponent(d);

	s0.parentNode.insertBefore(s1, s0);
	s0=s1=null;
};

BOOMR.plugins.LOGN = {
	init: function() {
		if(complete) {
			return this;
		}

		BOOMR.subscribe("page_ready", load, null, null);

		return this;
	},

	is_complete: function() {
		return complete;
	}
};

}(window));
