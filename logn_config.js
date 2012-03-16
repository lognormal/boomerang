(function(doc, s) {
var s0=doc.getElementsByTagName(s)[0],
    s1=doc.createElement(s),
    d=doc.URL.replace(/^https?:\/\//, '').replace(/[:?;\/].*$/, '');

if(d.match(/^mhtml/))
	return;

s1.onload=function() { BOOMR.plugins.RT.endTimer('t_configjs') };
BOOMR.plugins.RT.startTimer('t_configjs');
s1.src="//lognormal.net/boomerang/config.js?key=%client_apikey%&d=" + encodeURIComponent(d);

s0.parentNode.insertBefore(s1, s0);
}(document, "script"));
