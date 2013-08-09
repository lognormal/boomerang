/*This plugin can be used as an immediate init plugin when you are loading
boomerang asynchronously:
<script>
BOOMR_GLOBAL_CONFIG = {
  beacon_url: "//my.super.beacon.server.com/beacon"
};
(function(d, s) {
  var
    js = d.createElement(s),
    sc = d.getElementsByTagName(s)[0];

  js.src="http://your-cdn.host.com/path/to/boomerang-<version>.js";
  sc.parentNode.insertBefore(js, sc);
}(document, "script"));
</script>*/

var config;
if (window.boomr_beacon_url) {
  config = {
    beacon_url: window.boomr_beacon_url
  };
} else if (window.BOOMR_GLOBAL_CONFIG) {
  config = window.BOOMR_GLOBAL_CONFIG;
}

if (config !== undefined) {
  BOOMR.init(config);
}
