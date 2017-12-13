By default, Boomerang includes several timers on each beacon, such as:

* Total Page Load time ({@link BOOMR.plugins.RT t_done})
* Back-End time ({@link BOOMR.plugins.RT t_resp})
* Front-End time ({@link BOOMR.plugins.RT t_page})

You can also add additional timers to a beacon via
{@link BOOMR.plugins.RT.startTimer} and {@link BOOMR.plugins.RT.setTimer}.

These timers can be used to track sub-components on the page or other arbitrary
events.

The timer name given to {@link BOOMR.plugins.RT.startTimer} or
{@link BOOMR.plugins.RT.setTimer} and elapsed time of the timer is added to
the {@link BOOMR.plugins.RT t_other} beacon parameter.

If there are multiple additional timers, they are appended to each other, separated
by commas.

Example beacon data:

```
t_other=header|1234,ads|500
```

Example usage:

```html
<html>
  <head>
    <script>
    // measure how long it took for this JavaScript to start
    BOOMR.plugins.RT.setTimer("t_js", BOOMR.now() - performance.timing.navigationStart);

    // start tracking how long it takes to execute things in the HEAD
    BOOMR.plugins.RT.startTimer("t_head");
    </script>
    <title>Page Title</title>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
    <!-- ... -->
    <script>
    // stop tracking how long it takes to execute things in the HEAD
    BOOMR.plugins.RT.endTimer("t_head");
    </script>
  </head>
  <!-- ... -->
```
