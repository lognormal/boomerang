/**
\file jserrors.js
Count js errors for current page
*/

(function(w) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete, jserrors = 0;

  function done() {
    BOOMR.addVar('jserrors', jserrors);
    complete = true;
    BOOMR.sendBeacon();
  }

  function iscomplete() {
    return complete;
  }

  function newError() {
    jserrors++;
  }

  BOOMR.plugins.JsErrors = {
    init: function() {
      BOOMR.utils.addListener(w, 'error', newError);
      BOOMR.subscribe("page_ready", done);

      return this;
    },

    is_complete: iscomplete
  };

}(BOOMR.window));
