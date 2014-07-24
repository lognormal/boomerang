/**
\file domstats.js
Count specific dom nodes for Fasterize like how many images are really loaded?
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

  function count() {
    var tags = [];
    tags.push(('scripts|' + d.getElementsByTagName('script').length));
    tags.push('scriptssrc|' + d.querySelectorAll('script[src]').length);
    tags.push('stylesheets|' + d.querySelectorAll('link[rel=stylesheet]').length);

    // when images are lazyloaded using https://github.com/vvo/lazyload,
    // they have a data-src attribute, which is removed when img has loaded
    var imgsNumber = d.getElementsByTagName('img').length;
    tags.push('imgs|' + imgsNumber);
    tags.push('loadedimgs|' + (imgsNumber - d.querySelectorAll('img[data-frz-src]').length));


    BOOMR.addVar('optimized', !!BOOMR.window.fstrz);
    BOOMR.addVar('domstats', tags.join(','));

    complete = true;
    BOOMR.sendBeacon();
  }

  BOOMR.plugins.Domstats = {
    init: function() {
      // we will not count for IE < 8 http://caniuse.com/queryselector
      if (!d.querySelectorAll) {
        done();
      } else {
        BOOMR.subscribe("page_ready", count);
      }
      return this;
    },

    is_complete: iscomplete
  };

}(document));
