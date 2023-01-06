(function(w){
  if (!w.XMLHttpRequest || !(new w.XMLHttpRequest()).addEventListener) {
    return;
  }

  var a = document.createElement("A"),
      xhrNative = w.XMLHttpRequest,
      resources = [],
      sendResource,
      readyStateMap = ["uninitialized", "open", "responseStart", "domInteractive", "responseEnd"];

  w.BOOMR = w.BOOMR || {};

  // xhr object is what the AutoXHR plugin will interact with once it's loaded
  BOOMR.xhr = {
    /**
     * Stops XHR collection and forwards any additional reporting to Boomerang
     *
     * @param {function} sendResourceCallback Callback for any ongoing monitoring
     *
     * @returns {object} Array of XHRs
     */
    stop: function(sendResourceCallback) {
      sendResource = sendResourceCallback;

      // swap back in the native XHR function
      w.XMLHttpRequest = xhrNative;

      delete BOOMR.xhr;

      // clear our queue after a moment
      setTimeout(function(){
        resources = [];
      }, 10);

      return resources;
    }
  };

  // Gathers a high-resolution timestamp (when available), or falls back to Date.getTime()
  var now = (function() {
    try {
      if ("performance" in w && w.performance.timing) {
        return function() {
          return Math.round(w.performance.now() + performance.timing.navigationStart);
        };
      }
    }
    catch (ignore) {
      // NOP
    }

    return Date.now || function() {
      return new Date().getTime();
    };
  })();

  // Overwrite the native XHR with our monitored object
  w.XMLHttpRequest = function() {
    var xhr = new xhrNative(),
        open = xhr.open;

    xhr.open = function(method, url, async) {
      // Normalize the URL
      a.href = url;

      var resource = {
        timing: {},
        url: a.href,
        method: method
      };

      // Callback when the XHR is finished
      function loadFinished() {
        if (!resource.timing.loadEventEnd) {
          resource.timing.loadEventEnd = now();

          if ("performance" in w && w.performance && typeof w.performance.getEntriesByName === "function") {
            var entries = w.performance.getEntriesByName(resource.url);

            var entry = entries && entries.length && entries[entries.length - 1];

            if (entry) {
              var navSt = w.performance.timing.navigationStart;

              if (entry.responseEnd !== 0) {
                resource.timing.responseEnd = Math.round(navSt + entry.responseEnd);
              }

              if (entry.responseStart !== 0) {
                resource.timing.responseStart = Math.round(navSt + entry.responseStart);
              }

              if (entry.startTime !== 0) {
                resource.timing.requestStart = Math.round(navSt + entry.startTime);
              }
            }
          }

          if (sendResource) {
            sendResource(resource);
          }
          else {
            resources.push(resource);
          }
        }
      }

      function addListener(ename, stat) {
        xhr.addEventListener(
          ename,
          function() {
            if (ename === "readystatechange") {
              resource.timing[readyStateMap[xhr.readyState]] = now();

              if (xhr.readyState === 4) {
                loadFinished();
              }
            }
            else {
              resource.status = (stat === undefined ? xhr.status : stat);
              loadFinished();
            }
          },
          false);
      }

      if (async === true) {
        addListener("readystatechange");
      }
      else {
        resource.synchronous = true;
      }

      addListener("load");
      addListener("timeout", -1001);
      addListener("error",   -998);
      addListener("abort",   -999);

      try {
        open.apply(xhr, arguments);

        var send = xhr.send;

        xhr.send = function() {
          resource.timing.requestStart = now();

          send.apply(xhr, arguments);
        };
      }
      catch (e) {
        resource.status = -997;

        loadFinished();
      }
    };

    return xhr;
  };
})(window);
