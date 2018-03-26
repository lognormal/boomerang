[ResourceTiming](http://www.w3.org/TR/resource-timing/) is a browser performance
API that gathers accurate performance metrics about all of the resources
fetched during the page load, such as images, CSS and JavaScript.  Boomerang can
capture this data automatically.

By default, the Resource Timing API only tracks the first 150 resources (per IFRAME).
While this limit can be manipulated by the developer in order to track more resources
via [`window.performance.setResourceTimingBufferSize()`](http://www.w3.org/TR/resource-timing/),
there are performance trade-offs (additional memory consumption) when doing this,
so Boomerang doesn't make these changes automatically.

If you are using one of the Boomerang SPA plugins, the browser might hit the
150 limit quickly, as the browser will not clear the resources for SPA
navigations.  Therefore, you may want to increase the buffer size or clear the
resources every time a beacon is sent.

The following code examples show how you can increase the limit, or clear the
resources after each Boomerang beacon.

### Set the Resource Timings Buffer

To increase the ResourceTiming buffer size above the default of 150, you can use
[`window.performance.setResourceTimingBufferSize(n)`](http://www.w3.org/TR/resource-timing/):

```javascript
(function(w){
  if (!w ||
    !("performance" in w) ||
    !w.performance ||
    !w.performance.setResourceTimingBufferSize) {
    return;
  }

  w.performance.setResourceTimingBufferSize(<size>);
})(window);
```

### Clear the Resource Timings Buffer

To clear the ResourceTimings buffer on each beacon, you can use
[`window.performance.clearResourceTimings()`](http://www.w3.org/TR/resource-timing/):

```javascript
(function(w){
  if (!w ||
    !("performance" in w) ||
    !w.performance ||
    !w.performance.clearResourceTimings) {
    return;
  }

  document.addEventListener("onBoomerangBeacon", w.performance.clearResourceTimings.bind(w.performance));
})(window);
```
