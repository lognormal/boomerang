/*This plugin can be used as an immediate init plugin when you are loading
boomerang asynchronously: */

var config;
if (BOOMR.window.boomr_beacon_url) {
  config = {
    beacon_url: BOOMR.window.boomr_beacon_url
  };
} else if (BOOMR.window.BOOMR_GLOBAL_CONFIG) {
  config = BOOMR.window.BOOMR_GLOBAL_CONFIG;
}

if (config !== undefined) {
  BOOMR.init(config);
}
