By default, Boomerang will wait for the
[window `load` event](https://developer.mozilla.org/en-US/docs/Web/Events/load)
before it sends a beacon, and the Page Load timestamp ({@link BOOMR.plugins.RT t_done})
will be measured until the end of that `load` event.

For some cases, you may want to have the Page Load time measure to a timestamp
other than the window `load` event.  For example, your application may load
additional libraries or images at `load`, and you want the Page Load time to
reflect that.

To have Boomerang ignore the window `load` event, you must do two things:

1. Set `autorun` to `false` in {@link BOOMR.init}
2. When you want to mark the Page Load time done, you need to call
    {@link BOOMR.page_ready}

Example code:

```javascript
BOOMR.init({
  beacon_url: "http://yoursite.com/beacon/",
  autorun: false
});

// ...
// at some later point, when the page is loaded:
BOOMR.page_ready();
```

Boomerang will send the Page Load beacon when {@link BOOMR.page_ready} is called.
