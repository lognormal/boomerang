/**
\file preload.js
 - look for the preload item in sessionStorage
 - send custom beacon for page preload count
 - set id var for page view count (added to boomerang beacon)
*/

(function(d) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  function done() {
    complete = true;
  }

  function iscomplete() {
    return complete;
  }

  function isSessionStorageSupported() {
    try {
      return 'sessionStorage' in BOOMR.window && BOOMR.window['sessionStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  function countPageView() {
    if (isSessionStorageSupported()) {
      var preloadItem = JSON.parse(sessionStorage.getItem('preload-' + location.href));
      if (preloadItem && preloadItem.status === 'preloaded') {
        BOOMR.addVar('p_id', preloadItem.uuid);
        BOOMR.addVar('p_method', preloadItem.method);
        BOOMR.addVar('p_status', 'view');

        preloadItem.status = 'done';
        sessionStorage.setItem('preload-' + location.href, JSON.stringify(preloadItem));
      }
    }

    complete = true;
    BOOMR.sendBeacon();
  }

  function countPagePreload() {
    if (isSessionStorageSupported()) {
      var preloadItem = JSON.parse(sessionStorage.getItem('preload-' + location.href));
      if (preloadItem && preloadItem.status === 'preloading') {
        // send custom beacon to count page preload
        var img = new Image();
        img.src = BOOMR.window.BOOMR_GLOBAL_CONFIG.beacon_url + '?p_id=' + preloadItem.uuid +
                        '&p_method=' + preloadItem.method +
                        '&p_status=preload' +
                        '&u=' + location.href +
                        '&r=' + preloadItem.referer +
                        '&cust=' + BOOMR.window.FRZ_GLOBAL_CUSTOMER_KEY;

        preloadItem.status = 'preloaded';
        sessionStorage.setItem('preload-' + location.href, JSON.stringify(preloadItem));
      }
    }
  }

  BOOMR.plugins.Preload = {
    init: function() {
      // we will not count for IE < 8 http://caniuse.com/queryselector
      if (!d.querySelectorAll) {
        done();
      } else {
        countPagePreload();
        BOOMR.subscribe("page_ready", countPageView);
      }
      return this;
    },

    is_complete: iscomplete
  };

}(BOOMR.window.document));
