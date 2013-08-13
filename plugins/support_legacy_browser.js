/**
\file support_legacy_browser.js
Send the variable t_page for browsers that don't support navtiming.
*/

(function(w, d) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  function iscomplete() {
    return complete;
  }

  function ready() {
    BOOMR.plugins.RT.startTimer('t_page', w.BOOMR_lstart);
    complete = true;
    BOOMR.sendBeacon();
  }

  BOOMR.plugins.Legacy = {
    init: function() {
      BOOMR.subscribe("page_ready", ready);
      return this;
    },

    is_complete: iscomplete
  };

}(this, document));
