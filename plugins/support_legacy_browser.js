/**
\file support_legacy_browser.js
Send the variable t_page for browsers that don't support navtiming.
*/

(function(w, d) {

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
