## How does Boomerang work?

### 1. Measuring Navigations

We define Page Load Time (PLT) or Round Trip Time (RTT) as the time taken from
the user initiating a navigation to when that page is completely available for
the user to interact with.

Modern browsers support the [NavigationTiming]{@link http://www.w3.org/TR/navigation-timing/}
API, which provides high-resolution timestamps for each stage of the navigation.
Boomerang uses the NavigationTiming API when available to measure Page Load performance.

In older browsers that do not support the NavigationTiming API, Boomerang is able
to measure inter-site navigations by calculating the difference between when
the old page is about to be unloaded (`onbeforeunload`) to when the new page is
loaded (`onload`).

This is how Boomerang measures Page Load in older browsers:

* On the current page (before the navigation), attach a callback to the
    `window.onbeforeunload` event.
    * When `onbeforeunload` fires, log the timestamp and store it into a session
        cookie along with the URL of the current page.
* On the new page, attach a function to the `window.onload` event.
    * When `onload` fires, log the timestamp.
    * Look for the cookie where we set the start time and referrer
    * Check the URL stored in the cookie with the `document.referrer` of the
        current document.  If these two differ, it means that the user possibly
        visited a third party page in between the two pages from our site and the measurement
        is invalid, so we abort.
    *  If the above rules pass, we pull the time out of the cookie and remove the
        cookie.  We measure the difference in the two times and this is the
        Page Load time for the current page.

Note that in browsers that do not support NavigationTiming, Boomerang is unable
to measure the Page Load time of the first navigation to a domain, since it is
not running on the referrer page.  For example, if a visitor comes from a search
engine, the total Page Load time cannot be determined.

### 2. Measuring XMLHttpRequests

See {@link BOOMR.plugins.AutoXHR} for more details.

### 3. Measuring Single Page Apps

See {@link BOOMR.plugins.SPA} for more details.

### 4. Measuring Bandwidth & Latency

See {@link BOOMR.plugins.BW} for more details.

### 5. Measuring DNS

See {@link BOOMR.plugins.DNS} for more details.

### 6. Measuring Waterfall

See {@link BOOMR.plugins.ResourceTiming} for more details.

### 6. Measuring Other Arbitrary Events

See {@tutorial howto-measure-arbitrary-events} for more details.
