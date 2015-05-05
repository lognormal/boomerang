/**
\file support_legacy_browser.js
Send the variable t_page for browsers that don't support navtiming.
Time mark for firstPaintTime calculated in RenderViewImpl::DidFlushPaint (src/content/renderer/render_view_impl.cc)
called from handler of IPC message ViewMsg_UpdateRect_ACK, RenderWidget::OnUpdateRectAck (src/content/renderer/render_widget.cc).
All incoming IPC messages are handled by the MessageLoop instance.
But sometimes this MessageLoop may be busy handling  the previous IPC messages and tasks.
This results in a delay between actual page rendering time and firstPaintTime value.
This delay is not constant and may differ, depending on the environment, loaded web-page content, system workload etc.
This delay can be seen at chrome://tracing page, especially for a Debug build.
*/

(function(w) {

  BOOMR = BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  var complete;

  var impl = {
    complete: false,
    done: function() {
      var firstPaint;
      // Chrome
      if (w.chrome && w.chrome.loadTimes) {
        var chromeTimes = w.chrome.loadTimes();

        //if the timing is not ready, wait 100ms more.
        if (chromeTimes.firstPaintTime === 0) {
          return setTimeout(impl.done.bind(this), 100);
        }

        // Convert to ms
        firstPaint = chromeTimes.firstPaintTime * 1000;
      }
      // IE
      else if (typeof w.performance.timing.msFirstPaint === 'number') {
        firstPaint = w.performance.timing.msFirstPaint;
      }

      if (firstPaint) {
        BOOMR.addVar({startRender : firstPaint - w.performance.timing.navigationStart});
      }

      this.complete = true;
      BOOMR.sendBeacon();
    }
  };

  BOOMR.plugins.StartRender = {
    init: function() {
      if (w.performance && w.performance.timing) {
        BOOMR.subscribe("page_ready", impl.done, null, impl);
      } else {
        BOOMR.debug("plugin StartRender is inactive");
        impl.complete = true;
      }
      return this;
    },

    is_complete: function() {
      return impl.complete;
    }
  };

}(BOOMR.window));
