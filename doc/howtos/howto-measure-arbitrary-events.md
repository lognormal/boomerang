Boomerang has utility methods to assist in measuring the elapsed time of
any arbitrary event you want to measure.

Note: If you want to measure `XMLHttpRequests`, you should utilize the
{@link BOOMR.plugins.AutoXHR AutoXHR} plugin.

There are two ways of measuring events:

1. Call {@link BOOMR.requestStart BOOMR.requestStart()} to mark the beginning of the event, then
    call `.loaded()` to mark when it is complete
2. Call {@link BOOMR.responseEnd BOOMR.responseEnd()} with your own timestamps or elapsed time

Both of these methods will trigger a beacon with the Page Group
({@link BOOMR.plugins.RT h.pg}) set to the input name.

## Using `BOOMR.requestStart`

{@link BOOMR.requestStart} can be used to have Boomerang track a complete event.
When {@link BOOMR.requestStart} is called, Boomerang will mark the start time.

Once the event is complete, you can call `.loaded()` on the returned object to
mark the end timestamp.

Example:

```javascript
var timer = BOOMR.requestStart("my-timer");
setTimeout(function() {
  // will send a beacon with the page group of "my-timer"
  // and an elapsed time of approximately 1 second
  timer.loaded();
}, 1000);
```

## Using `BOOMR.responseEnd`

{@link BOOMR.responseEnd} can be used to immediately send a beacon based on the
given start time (and optional end time).

Example:

```javascript
var startTime = BOOMR.now();

setTimeout(function() {
  // immediately sends a beacon with the page group of "my-timer" and
  // measured from the startTime to now.
  BOOMR.responseEnd("my-timer", startTime);

  // you can also specify the end time, i.e. 500ms ago
  BOOMR.responseEnd("my-other-timer", startTime, {}, BOOMR.now() - 500);
}, 1000);
```
