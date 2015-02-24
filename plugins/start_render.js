/**
\file support_legacy_browser.js
Send the variable t_page for browsers that don't support navtiming.
*/

(function(w) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  var impl = {
    complete: false,
    done: function() {
      var firstPaintTime, firstPaint;
      // Chrome
      if (w.chrome && w.chrome.loadTimes) {
        var chromeTimes = w.chrome.loadTimes();

        //if the timing is not ready, wait 100ms more.
        if (chromeTimes.firstPaintTime === 0) {
          return setTimeout(impl.done.bind(this), 100);
        }

        // Convert to ms
        firstPaint = chromeTimes.firstPaintTime * 1000;
        var startTime = chromeTimes.startLoadTime * 1000;
        if ('requestTime' in chromeTimes && chromeTimes.requestTime !== 0) {
          startTime = chromeTimes.requestTime * 1000;
        }

        firstPaintTime = firstPaint - startTime;
      }
      // IE
      else if (typeof w.performance.timing.msFirstPaint === 'number') {
        firstPaint = w.performance.timing.msFirstPaint;

        // if (firstPaint === 0) {
        //   return setTimeout(impl.done.bind(this), 100);
        // }

        firstPaintTime = firstPaint - w.performance.timing.navigationStart;
      }

      if (firstPaintTime) {
        BOOMR.addVar({startRender : firstPaintTime});
      }

      this.complete = true;
      BOOMR.sendBeacon();
    }
  };

  BOOMR.plugins.StartRender = {
    init: function() {
      BOOMR.subscribe("page_ready", impl.done, null, impl);
      return this;
    },

    is_complete: function() {
      return impl.complete;
    }
  };

}(BOOMR.window));
