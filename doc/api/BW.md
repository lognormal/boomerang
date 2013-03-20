[All Docs](../) | [Index](index.html)

Bandwidth/latency plugin API
============================

The bandwidth plugin measures the bandwidth and latency of the user's
network connection to your server. The bandwidth API is encapsulated
within the `BOOMR.plugins.BW` namespace.

Configuration {#config}
-------------

All bandwidth plugin configuration items are under the `BW` namespace.
The full configuration object is described in [Howto \#6 — Configuring
boomerang](../howtos/howto-6.html).

base\_url
:   **[required]** By default, this is set to the empty string, which
    has the effect of disabling the bandwidth plugin. Set the `base_url`
    parameter to the HTTP path of the directory that contains the
    bandwidth images to enable this test. This can be an absolute or a
    relative URL. If it's relative, remember that it's relative to the
    page that boomerang is included in and not to the javascript file.
    The trailing / is required.
cookie
:   **[optional]** The name of the cookie in which to store the measured
    bandwidth and latency of the user's network connection. The default
    name is `BA`. See [Howto \#3](howto-3.html) for more details on the
    bandwidth cookie.
cookie\_exp
:   **[optional]** The lifetime in seconds of the bandwidth cookie. The
    default is set to 7 days. This specifies how long it will be before
    we run the bandwidth test again for a user, assuming their IP
    address doesn't change within this time. You probably do not need to
    change this setting at all since the bandwidth of a given network
    connection typically does not change by an order of magnitude on a
    regular basis.\
     Note that if you're doing some kind of real-time streaming, then
    chances are that this bandwidth test isn't right for you, so setting
    this cookie to a shorter value isn't the right solution.
timeout
:   **[optional]** The timeout in seconds for the entire bandwidth test.
    The default is set to 15 seconds. The bandwidth test can run for a
    long time, and sometimes, due to network errors, it might never
    complete. The timeout forces the test to complete at that time. This
    is a hard limit. If the timeout fires, we stop further iterations of
    the test and attempt to calculate bandwidth with the data that we've
    collected at that point. Increasing the timeout can get you more
    data and increase the accuracy of the test, but at the same time
    increases the risk of the test not completing before the user leaves
    the page.
nruns
:   **[optional]** The number of times the bandwidth test should run.
    The default is set to 5. The first test is always a pilot to figure
    out the best way to proceed with the remaining tests. Increasing
    this number will increase the tests accuracy, but at the same time
    increases the risk that the test will timeout. It should take about
    2-4 seconds per run, so consider this value along with the `timeout`
    value above.

Methods
-------

init(oConfig)

Called by the [BOOMR.init()](BOOMR.html#init) method to configure the
bandwidth plugin.

### Parameters

oConfig
:   The configuration object passed in via `BOOMR.init()`. See the
    [Configuration section](#config) for details.

    ### Returns

    a reference to the `BOOMR.plugins.BW` object, so you can chain
    methods.

run()
:   Starts the bandwidth test. This method is called automatically when
    boomerang's [page\_ready](BOOMR.html#page_ready) event fires, so you
    won't need to call it yourself.

    ### Returns

    a reference to the `BOOMR.plugins.BW` object, so you can chain
    methods.

abort()
:   Stops the bandwidth test immediately and attempts to calculate
    bandwidth and latency from values that it has already gathered. This
    method is called automatically if the bandwidth test times out. It
    is better to set the `timeout` value appropriately when calling the
    [BOOMR.init()](BOOMR.html#init) method.

    ### Returns

    a reference to the `BOOMR.plugins.BW` object, so you can chain
    methods.

is\_complete()
:   Called by [BOOMR.sendBeacon()](BOOMR.html#sendBeacon) to determine
    if the bandwidth plugin has finished what it's doing or not.

    ### Returns

    -   `true` if the plugin has completed.
    -   `false` if the plugin has not completed.

Beacon Parameters {#beacon}
-----------------

This plugin adds the following parameters to the beacon:

bw
:   User's measured bandwidth in bytes per second
bw\_err
:   95% confidence interval margin of error in measuring user's
    bandwidth
lat
:   User's measured HTTP latency in milliseconds
lat\_err
:   95% confidence interval margin of error in measuring user's latency
bw\_time
:   Timestamp (seconds since the epoch) on the user's browser when the
    bandwidth and latency was measured
