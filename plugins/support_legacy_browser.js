/**
\file support_legacy_browser.js
Send the variable t_page for browsers that don't support navtiming.
*/

(function(w, d) {
  if (w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance) {
    //mandatory since calling startTimer("t_page") has the side-effect of calling endTimer("t_resp").
    //which lead to wrong ttfb when the performance timing is available
    return;
  }

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  function iscomplete() {
    return true;
  }

  BOOMR.plugins.Legacy = {
    init: function() {
      BOOMR.plugins.RT.startTimer('t_page', w.BOOMR_lstart);
      BOOMR.sendBeacon();
      return this;
    },

    is_complete: iscomplete
  };

}(BOOMR.window, BOOMR.window.document));
