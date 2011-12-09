(function() {
var s0=document.getElementsByTagName("script")[0],
    s1=document.createElement("script"),
    d=document.URL.replace(/^https?:\/\/(.*?)\/.*$/, '$1');

s1.type="text/javascript";
s1.src="//lognormal.net/boomerang/config.js?key=%client_apikey%&d=" + encodeURIComponent(d);

s0.parentNode.insertBefore(s1, s0);
}());
