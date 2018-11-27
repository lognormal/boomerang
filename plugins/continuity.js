/**
 * The Continuity plugin measures performance and user experience metrics beyond
 * just the traditional Page Load timings.
 *
 * ## Approach
 *
 * The goal of the Continuity plugin is to capture the important aspects of your
 * visitor's overall _user experience_ during page load and beyond.  For example, the
 * plugin measures when the site appeared _Visually Ready_, and when it was _Interactive_.
 *
 * In addition, the Continuity plugin captures in-page interactions (such as keys,
 * clicks and scrolls), and monitors how the site performed when responding to
 * these inputs.
 *
 * Finally, the Continuity plugin is utilizing cutting-edge browser
 * performance APIs like [LongTasks](https://w3c.github.io/longtasks/) to get
 * important insights into how the browser is performing.
 *
 * Here are some of the metrics that the Continuity plugin captures:
 *
 * * Timers:
 *     * **Time to Visually Ready**: When did the user feel like they could interact
 *         with the site?  When did it look ready? (see below for details)
 *     * **Time to Interactive**: After the page was Visually Ready, when was the
 *         first time the user could have interacted with the site, and had a
 *         good (performant) experience? (see below for details)
 *     * **Time to First Interaction**: When was the first time the user tried to
 *         interact (key, click or scroll) with the site?
 *     * **First Input Delay**: For the first interaction on the page, how
 *         responsive was it?
 * * Interaction metrics:
 *     * **Interactions**: Keys, mouse movements, clicks, and scrolls (counts and
 *         an event log)
 *     * **Delayed Interactions**: How often was the user's interaction delayed
 *         more than 50ms?
 *     * **Rage Clicks**: Did the user repeatedly clicked on the same element/region?
 * * Page performance metrics:
 *     * **Frame Rate data**: FPS during page load, minimum FPS, number of long frames
 *     * **Long Task data**: Number of Long Tasks, how much time they took, attribution
 *         to what caused them
 *     * **Page Busy**: Measurement of the page's busyness
 *
 * This data is captured during the page load, as well as when the user later
 * interacts with the site (if configured via
 * {@link BOOMR.plugins.Continuity.init `afterOnload`}).
 * These metrics are reported at regular intervals, so you can see how they
 * change over time.
 *
 * If configured, the Continuity plugin can send additional beacons after a page
 * interaction happens (via {@link BOOMR.plugins.Continuity.init `monitorInteractions`}).
 *
 * ## Configuration
 *
 * The `Continuity` plugin has a variety of options to configure what it does (and
 * what it doesn't do):
 *
 * ### Monitoring Long Tasks
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorLongTasks`} is turned on,
 * the Continuity plugin will monitor [Long Tasks](https://w3c.github.io/longtasks/)
 * (if the browser supports it).
 *
 * Long Tasks represent work being done on the browser's UI thread that monopolize
 * the UI thread and block other critical tasks from being executed (such as reacting
 * to user input).  Long Tasks can be caused by anything from JavaScript
 * execution, to parsing, to layout.  The browser fires `LongTask` events
 * (via the `PerformanceObserver`) when a task takes over 50 milliseconds to execute.
 *
 * Long Tasks are important to measure as a Long Task will block all other user input
 * (e.g. clicks, keys and scrolls).
 *
 * Long Tasks are powerful because they can give _attribution_ about what component
 * caused the task, i.e. the source JavaScript file.
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorLongTasks`} is enabled:
 *
 * * A `PerformanceObserver` will be turned on to capture all Long Tasks that happen
 *     on the page.
 * * Long Tasks will be used to calculate _Time to Interactive_
 * * A log (`c.lt`), timeline (`c.t.lt`) and other Long Task metrics (`c.lt.*`) will
 *     be added to the beacon (see Beacon Parameters details below)
 *
 * The log `c.lt` is a JSON (or JSURL) object of compressed `LongTask` data.  See
 * the source code for what each attribute maps to.
 *
 * Long Tasks are currently a cutting-edge browser feature and will not be available
 * in older browsers.
 *
 * Enabling Long Tasks should not have a performance impact on the page load experience,
 * as collecting of the tasks are via the lightweight `PerformanceObserver` interface.
 *
 * ### Monitoring Page Busy
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorPageBusy`} is turned on,
 * the Continuity plugin will measure Page Busy.
 *
 * Page Busy is a way of measuring how much work was being done on the page (how "busy"
 * it was).  Page Busy is calculated via `setInterval()` polling: a timeout is scheduled
 * on the page at a regular interval, and _busyness_ is detected if that timeout does
 * not fire at the time it was expected to.
 *
 * Page Busy is a percentage -- 100% means that the browser was entirely busy doing other
 * things, while 0% means the browser was idle.
 *
 * Page Busy is _just an estimate_, as it uses sampling.  As an example, if you have
 * a high number of small tasks that execute frequently, Page Busy might run at
 * a frequency that it either detects 100% (busy) or 0% (idle).
 *
 * Page Busy is not the most efficient way of measuring what the browser is doing,
 * but since it is calculated via `setInterval()`, it is supported in all browsers.
 * The Continuity plugin currently measures Page Busy by polling every 32 milliseconds.
 *
 * Page Busy can be an indicator of how likely the user will have a good experience
 * when they interact with it. If Page Busy is 100%, the user may see the page lag
 * behind their input.
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorPageBusy`} is enabled:
 *
 * * The Page Busy monitor will be active (polling every 32 milliseconds) (unless
 *     Long Tasks is supported and enabled)
 * * Page Busy will be used to calculate _Time to Interactive_
 * * A timeline (`c.t.busy`) and the overall Page Busy % (`c.b`) will be added to the
 *     beacon (see Beacon Parameters details below)
 *
 * Enabling Page Busy monitoring should not have a noticeable effect on the page load
 * experience.  The 32-millisecond polling is lightweight and should barely register
 * on JavaScript CPU profiles.
 *
 * ### Monitoring Frame Rate
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorFrameRate`} is turned on,
 * the Continuity plugin will measure the Frame Rate of the page via
 * [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).
 *
 * `requestAnimationFrame` is a browser API that can be used to schedule animations
 * that run at the device's refresh rate.  It can also be used to measure how many
 * frames were actually delivered to the screen, which can be an indicator of how
 * good the user's experience is.
 *
 * `requestAnimationFrame` is available in
 * [all modern browsers](https://caniuse.com/#feat=requestanimationframe).
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorFrameRate`} is enabled:
 *
 * * `requestAnimationFrame` will be used to measure Frame Rate
 * * Frame Rate will be used to calculate _Time to Interactive_
 * * A timeline (`c.t.fps`) and many Frame Rate metrics (`c.f.*`) will be added to the
 *     beacon (see Beacon Parameters details below)
 *
 * Enabling Frame Rate monitoring should not have a noticeable effect on the page load
 * experience.  The frame callback may happen up to the device's refresh rate (which
 * is often 60 FPS), and the work done in the callback should be barely visible
 * in JavaScript CPU profiles (often less than 5ms over a page load).
 *
 * ### Monitoring Interactions
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorInteractions`} is turned on,
 * the Continuity plugin will measure user interactions during the page load and beyond.
 *
 * Interactions include:
 *
 * * Mouse Clicks: Where the user clicked on the screen
 *     * Rage Clicks: Clicks to the same area repeatedly
 * * Mouse Movement: Rough mouse movement will be tracked, but these interactions will
 *    not send a beacon on their own, nor be used for _Time to First Interaction_
 *    calculations.
 * * Keyboard Presses: Individual key codes are not captured
 * * Scrolls: How frequently and far the user scrolled
 *     * Distinct Scrolls: Scrolls that happened over 2 seconds since the last scroll
 * * Page Visibility changes
 * * Orientation changes
 *
 * These interactions are monitored and instrumented throughout the page load.  By using
 * the event's `timeStamp`, we can detect how long it took for the physical event (e.g.
 * mouse click) to execute the JavaScript listening handler (in the Continuity plugin).
 * If there is a delay, this is tracked as an _Interaction Delay_.  Interaction Delays
 * can be an indicator that the user is having a degraded experience.
 *
 * The very first interaction delay will be added to the beacon as the
 * _First Input Delay_ - this is tracked as the user's first experience
 * with your site is important.
 *
 * In addition, if {@link BOOMR.plugins.Continuity.init `afterOnLoad`} is enabled,
 * these interactions (except Mouse Movements) can also trigger an `interaction`
 * beacon after the Page Load.  {@link BOOMR.plugins.Continuity.init `afterOnLoadMaxLength`}
 * can be used to control how many milliseconds after Page Load interactions will be
 * measured for.
 *
 * After a post-Load interaction occurs, the plugin will wait for
 * {@link BOOMR.plugins.Continuity.init `afterOnLoadMinWait`} milliseconds before
 * sending the `interaction` beacon.  If another interaction happens within that
 * timeframe, the plugin will wait another {@link BOOMR.plugins.Continuity.init `afterOnLoadMinWait`}
 * milliseconds.  This is to ensure that groups of interactions will be batched
 * together.  The plugin will wait up to 60 seconds to batch groups of interactions
 * together, at which point a beacon will be sent immediately.
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorInteractions`} is enabled:
 *
 * * Passive event handlers will be added to monitor clicks, keys, etc.
 * * A log and many interaction metrics (`c.f.*`) will be added to the
 *     beacon (see Beacon Parameters details below)
 *
 * For `interaction` beacons, the following will be set:
 *
 * * `rt.tstart` will be the timestamp of the first interaction
 * * `rt.end` will be the timestamp of the last interaction
 * * `rt.start = 'manual'`
 * * `http.initiator = 'interaction'`
 *
 * Enabling interaction monitoring will add lightweight passive event handlers
 * to `scroll`, `click`, `mousemove` and `keydown` events.  These event handlers
 * should not delay the user's interaction, and are used to measure delays and
 * keep a log of interaction events.
 *
 * ### Monitoring Page Statistics
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorStats`} is turned on,
 * the Continuity plugin will measure statistics about the page and browser over time.
 *
 * These statistics include:
 *
 * * Memory Usage: `usedJSHeapSize` (Chrome-only)
 * * [Battery Level](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API)
 * * DOM Size: Number of bytes of HTML in the root frame
 * * DOM Length: Number of DOM nodes in the root frame
 * * Mutations: How often and how much the page is changing
 *
 * If {@link BOOMR.plugins.Continuity.init `monitorStats`} is enabled:
 *
 * * Events and polls will be setup to monitor the above statistics
 * * A timeline (`c.t.*`) of these statistics will be added to the beacon (see
 *     details below)
 *
 * Enabling Page Statistic monitoring adds a poll to the page every second, gathering
 * the above statistics.  These statistics should take less than 5ms JavaScript CPU
 * on a desktop browser each poll, but this monitoring is probably the most
 * expensive of the Continuity plugin monitors.
 *
 * ## New Timers
 *
 * There are 4 new timers from the Continuity plugin that center around user
 * interactions:
 *
 * * **Time to Visually Ready** (VR)
 * * **Time to Interactive** (TTI)
 * * **Time to First Interaction** (TTFI)
 * * **First Input Delay** (FID)
 *
 * _Time to Interactive_ (TTI), at it's core, is a measurement (timestamp) of when the
 * page was interact-able. In other words, at what point does the user both believe
 * the page could be interacted with, and if they happened to try to interact with
 * it then, would they have a good experience?
 *
 * To calculate Time to Interactive, we need to figure out two things:
 *
 * * Does the page appear to the visitor to be interactable?
 *     * We'll use one or more Visually Ready Signals to determine this
 * * If so, what's the first time a user could interact with the page and have a good
 *     experience?
 *     * We'll use several Time to Interactive Signals to determine this
 *
 * ### Visually Ready
 *
 * For the first question, "does the page appear to be interactable?", we need to
 * determine when the page would _look_ to the user like they _could_ interact with it.
 *
 * It's only after this point that TTI could happen. Think of Visually Ready (VR) as
 * the anchor point of TTI -- it's the earliest possible timestamp in the page's
 * lifecycle that TTI could happen.
 *
 * We have a few signals that might be appropriate to use as Visually Ready:
 * * First Paint (if available)
 *     * We should wait at least for the first paint on the page
 *     * i.e. IE's [`msFirstPaint`](https://msdn.microsoft.com/en-us/library/ff974719)
 *         or Chrome's `firstPaintTime`
 *     * These might just be paints of white, so they're not the only signal we should use
 * * First Contentful Paint (if available)
 *     * Via [PaintTiming](https://www.w3.org/TR/paint-timing/)
 * * [domContentLoadedEventEnd](https://msdn.microsoft.com/en-us/library/ff974719)
 *     * "The DOMContentLoaded event is fired when the initial HTML document has been
 *         completely loaded and parsed, without waiting for stylesheets, images,
 *         and subframes to finish loading"
 *     * This happens after `domInteractive`
 *     * Available in NavigationTiming browsers via a timestamp and all other
 *         browser if we're on the page in time to listen for readyState change events
 * * Hero Images (if defined)
 *     * Instead of tracking all Above-the-Fold images, it could be useful to know
 *         which specific images are important to the site owner
 *     * Defined via a simple CSS selector (e.g. `.hero-images`)
 *     * Can be measured via ResourceTiming
 *     * Will add Hero Images Ready `c.tti.hi` to the beacon
 * * "My Framework is Ready" (if defined)
 *     * A catch-all for other things that we can't automatically track
 *     * This would be an event or callback from the page author saying their page is ready
 *     * They could fire this for whatever is important to them, i.e. when their page's
 *         click handlers have all registered
 *     * Will add Framework Ready `c.tti.fr` to the beacon
 *
 * Once the last of all of the above have happened, Visually Ready has occurred.
 *
 * Visually Ready will add `c.tti.vr` to the beacon.
 *
 * #### Controlling Visually Ready via Framework Ready
 *
 * There are two additional options for controlling when Visually Ready happens:
 * via Framework Ready or Hero Images.
 *
 * If you want to wait for your framework to be ready (e.g. your SPA has loaded or
 * a button has a click handler registered), you can add an
 * option {@link BOOMR.plugins.Continuity.init `ttiWaitForFrameworkReady`}.
 *
 * Once enabled, TTI won't be calculated until the following is called:
 *
 * ```
 * // my framework is ready
 * if (BOOMR && BOOMR.plugins && BOOMR.plugins.Continuity) {
 *     BOOMR.plugins.Continuity.frameworkReady();
 * }
 * ```
 *
 * #### Controlling Visually Ready via Hero Images
 *
 * If you want to wait for your hero/main images to be loaded before Visually Ready
 * is measured, you can give the plugin a CSS selector via
 * {@link BOOMR.plugins.Continuity.init `ttiWaitForHeroImages`}.
 * If set, Visually Ready will be delayed until all IMGs that match that selector
 * have loaded, e.g.:
 *
 * ```
 * window.BOOMR_config = {
 *   Continuity: {
 *     enabled: true,
 *     ttiWaitForHeroImages: ".hero-image"
 *   }
 * };
 * ```
 *
 * Note this only works in ResourceTiming-supported browsers (and won't be used in
 * older browsers).
 *
 * If no images match the CSS selector at Page Load, this setting will be ignored
 * (the plugin will not wait for a match).
 *
 * ### Time to Interactive
 *
 * After the page is Visually Ready for the user, if they were to try to interact
 * with the page (click, scroll, type), when would they have a good experience (i.e.
 * the page responded in a satisfactory amount of time)?
 *
 * We can use some of the signals below, when available:
 *
 * * Frame Rate (FPS)
 *     * Available in all modern browsers: by using `requestAnimationFrame` we can
 *         get a sense of the overall frame rate (FPS)
 *     * To ensure a "smooth" page load experience, ideally the page should never drop
 *         below 20 FPS.
 *     * 20 FPS gives about 50ms of activity to block the main thread at any one time
 * * Long Tasks
 *     * Via the PerformanceObserver, a Long Tasks fires any time the main thread
 *         was blocked by a task that took over 50ms such as JavaScript, layout, etc
 *     * Great indicator both that the page would not have been interact-able and
 *         in some cases, attribution as to why
 * * Page Busy via `setInterval`
 *     * By measuring how long it takes for a regularly-scheduled callback to fire,
 *         we can detect other tasks that got in the way
 *     * Can give an estimate for Page Busy Percentage (%)
 *     * Available in every browser
 * * Delayed interactions
 *     * If the user interacted with the page and there was a delay in responding
 *         to the input
 *
 * The {@link BOOMR.plugins.Continuity.init `waitAfterOnload`} option will delay
 * the beacon for up to that many milliseconds if Time to Interactive doesn't
 * happen by the browser's `load` event.  You shouldn't set it too high, or
 * the likelihood that the page load beacon will be lost increases (because of
 * the user navigating away first, or closing their browser). If
 * {@link BOOMR.plugins.Continuity.init `waitAfterOnload`} is reached and TTI
 * hasn't happened yet, the beacon will be sent immediately (missing the TTI timer).
 *
 * If you set {@link BOOMR.plugins.Continuity.init `waitAfterOnload`} to `0`
 * (or it's not set), Boomerang will send the beacon at the regular page load
 * event.  If TTI didn't yet happen, it won't be reported.
 *
 * If you want to set {@link BOOMR.plugins.Continuity.init `waitAfterOnload`},
 * we'd recommend a value between `1000` and `5000` (1 and 5 seconds).
 *
 * Time to Interaction will add `c.tti` to the beacon.  It will also add `c.tti.m`,
 * which is the higest-accuracy method available for TTI calculation: `lt` (Long Tasks),
 * `raf` (FPS), or `b` (Page Busy).
 *
 * #### Algorithm
 *
 * Putting these two timers together, here's how we measure Visually Ready and
 * Time to Interactive:
 *
 * 1. Determine the highest Visually Ready timestamp (VRTS):
 *     * First Contentful Paint (if available)
 *     * First Paint (if available)
 *     * `domContentLoadedEventEnd`
 *     * Hero Images are loaded (if configured)
 *     * Framework Ready (if configured)
 *
 * 2. After VRTS, calculate Time to Interactive by finding the first period of
 *     500ms where all of the following are true:
 *     * There were no Long Tasks
 *     * The FPS was always above 20 (if available)
 *     * Page Busy was less than 10% (if the above aren't available)
 *
 * ### Time to First Interaction
 *
 * Time to First Interaction (TTFI) is the first time a user interacted with the
 * page.  This may happen during or after the page's `load` event.
 *
 * Time to First Interaction will add `c.ttfi` to the beacon.
 *
 * If the user does not interact with the page by the beacon, there will be no
 * `c.ttfi` on the beacon.
 *
 * ### First Input Delay
 *
 * If the user interacted with the page by the time the beacon was sent, the
 * Continuity plugin will also measure how long it took for the JavaScript
 * event handler to fire.
 *
 * This can give you an indication of the page being otherwise busy and unresponsive
 * to the user if the callback is delayed.
 *
 * This time (measured in milliseconds) is added to the beacon as `c.fid`.
 *
 * ## Timelines
 *
 * If {@link BOOMR.plugins.Continuity.init `sendTimeline`} is enabled, many of
 * the above options will add bucketed "timelines" to the beacon.
 *
 * The Continuity plugin keeps track of statistics, interactions and metrics over time
 * by keeping track of these counts at a granularity of 100-millisecond intervals.
 *
 * As an example, if you are measuring Long Tasks, its timeline will have entries
 * whenever a Long Task occurs.
 *
 * Not every timeline will have data for every interval.  As an example, the click
 * timeline will be sparse except for the periods where there was a click.  Statistics
 * like DOM Size are captured only once every second.  The Continuity plugin is
 * optimized to use as little memory as possible for these cases.
 *
 * ### Compressed Timeline Format
 *
 * If {@link BOOMR.plugins.Continuity.init `sendTimeline`} is enabled, the
 * Continuity plugin will add several timelines as `c.t.[name]` to the beacon
 * in a compressed format.
 *
 * An example timeline may look like this:
 *
 * ```
 * c.t.fps      = 03*a*657576576566766507575*8*65
 * c.t.domsz    = 11o3,1o4
 * c.t.mousepct = 2*5*0053*4*00050718
 * ```
 *
 * The format of the compressed timeline is as follows:
 *
 * `[Compression Type - 1 character][Data - everything else]`
 *
 * * Compression Type is a single character that denotes how each timeline's bucket
 *     numbers are compressed:
 *     * `0` (for smaller numbers):
 *         * Each number takes a single character, encoded in Base-64
 *         * If a number is >= 64, the number is converted to Base-36 and wrapped in
 *             `.` characters
 *     * `1` (for larger numbers)
 *         * Each number is separated by `,`s
 *         * Each number is encoded in Base-36
 *     * `2` (for percentages)
 *         * Each number takes two characters, encoded in Base-10
 *         * If a number is <= 0, it is `00`
 *         * If a number is >= 100, it is `__`
 *
 * In addition, for repeated numbers, the format is as follows:
 *
 * `*[Repeat Count]*[Number]`
 *
 * Where:
 *
 * * Repeat Count is encoded Base-36
 * * Number is encoded per the rules above
 *
 * From the above example, the data would be decompressed to:
 *
 * ```
 * c.t.fps =
 *     [3, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 7, 5, 7, 6, 5, 7, 6, 5, 6, 6, 7, 6, 6,
 *     5, 0, 7, 5, 7, 5, 6, 6, 6, 6, 6, 6, 6, 6, 5];
 *
 * c.t.domsz = [2163, 2164];
 *
 * c.t.mousepct = [0, 0, 0, 0, 0, 53, 0, 0, 0, 0, 5, 7, 18];
 * ```
 *
 * The timeline can be decompressed via
 * {@link BOOMR.plugins.Continuity.decompressBucketLog `decompressBucketLog`}
 * (for debug builds).
 *
 * The Continuity Epoch (`c.e`) and Continuity Last Beacon (`c.lb`) are timestamps
 * (Base-36) that indicate what timestamp the first bucket represents.  If both are
 * given, the Last Beacon timestamp should be used.
 *
 * For example:
 *
 * ```
 * c.e=j5twmlbv       // 1501611350395
 * c.lb=j5twmlyk      // 1501611351212
 * c.t.domsz=11o3,1o4 // 2163, 2164 using method 1
 * ```
 *
 * In the above example, the first value of `2163` (`1o3` Base-36) happened
 * at `1501611351212`.  The second value of `2164` (`1o4` Base-36) happened
 * at `1501611351212 + 100 = 1501611351312`.
 *
 * For all of the available timelines, see the Beacon Parameters list below.
 *
 * ## Logs
 *
 * If {@link BOOMR.plugins.Continuity.init `sendLog`} is enabled, the Continuity
 * plugin will add a log to the beacon as `c.l`.
 *
 * The following events will generate a Log entry with the listed parameters:
 *
 * * Scrolls (type `0`):
 *     * `y`: Y pixels
 * * Clicks (type `1`):
 *     * `x`: X pixels
 *     * `y`: Y pixels
 * * Mouse Movement (type `2`):
 *     * Data is captured at minimum 10 pixel granularity
 *     * `x`: X pixels
 *     * `y`: Y pixels
 * * Keyboard presses (type `3`):
 *     * (no data is captured)
 * * Visibility Changes (type `4`):
 *     * `s`
 *         * `0`: `visible`
 *         * `1`: `hidden`
 *         * `2`: `prerender`
 *         * `3`: `unloaded`
 * * Orientation Changes (type `5`):
 *     * `a`: Angle
 *
 * The log is put on the beacon in a compressed format.  Here is an example log:
 *
 * ```
 * c.l=214y,xk9,y8p|142c,xk5,y8v|34kh
 * ```
 *
 * The format of the compressed timeline is as follows:
 *
 * ```
 * [Type][Timestamp],[Param1 type][Param 1 value],[... Param2 ...]|[... Event2 ...]
 * ```
 *
 * * Type is a single character indicating what type of event it is, per above
 * * Timestamp (`navigationStart` epoch in milliseconds) is Base-36 encoded
 * * Each parameter follows, separated by commas:
 *     * The first character indicates the type of parameter
 *     * The subsequent characters are the value of the parameter, Base-36 encoded
 *
 * From the above example, the data would be decompressed to:
 *
 * ```
 * [
 *     {
 *         "type": "mouse",
 *         "time": 1474,
 *         "x": 729,
 *         "y": 313
 *     },
 *     {
 *         "type": "click",
 *         "time": 5268,
 *         "x": 725,
 *         "y": 319
 *     },
 *     {
 *         "type": "key",
 *         "time": 5921,
 *     }
 * ]
 * ```
 *
 * The plugin will keep track of the last
 * {@link BOOMR.plugins.Continuity.init `logMaxEntries`} entries in the log
 * (default 100).
 *
 * The timeline can be decompressed via
 * {@link BOOMR.plugins.Continuity.decompressBucketLog `decompressLog`} (for
 * debug builds).
 *
 * ## Overhead
 *
 * When enabled, the Continuity plugin adds new layers of instrumentation to
 * each page load.  It also keeps some of this instrumentation enabled
 * after the `load` event, if configured.  By default, these instrumentation
 * "monitors" will be turned on:
 *
 * * Long Tasks via `PerformanceObserver`
 * * Frame Rate (FPS) via `requestAnimationFrame`
 * * Page Busy via `setInterval` polling (if Long Tasks aren't supported)
 * * Monitoring of interactions such as mouse clicks, movement, keys, and scrolls
 * * Page statistics like DOM size/length, memory usage, and mutations
 *
 * Each of these monitors is designed to be as lightweight as possible, but
 * enabling instrumentation will always incur non-zero CPU time.  Please read
 * the above sections for overhead information on each monitor.
 *
 * With the Continuity plugin enabled, during page load, you may see the plugin's
 * total CPU usage over the entire length of that page load reach 10-35ms, depending on
 * the hardware and makeup of the host-site. In general, for most modern websites,
 * this means Boomerang should still only account for a few percentage points of
 * overall page CPU usage with the Continuity plugin enabled.
 *
 * The majority of this CPU usage increase is from Page Statistics reporting and
 * FPS monitoring.  You can disable either of these monitors individually if desired
 * ({@link BOOMR.plugins.Continuity.init `monitorStats`} and
 * {@link BOOMR.plugins.Continuity.init `monitorFrameRate`}).
 *
 * During idle periods (after page load), the Continuity plugin will continue
 * monitoring the above items if {@link BOOMR.plugins.Continuity.init `afterOnload`}
 * is enabled.  This may increase Boomerang JavaScript CPU usage as well.  Again,
 * the majority of this CPU usage increase is from Page Statistic reporting and
 * Frame Rate monitoring, and can be disabled.
 *
 * When Long Tasks aren't supported by the browser, Page Busy monitoring via
 * `setInterval` should only 1-2ms CPU during and after page load.
 *
 * ## Beacon Parameters
 *
 * The following parameters will be added to the beacon:
 *
 * * `c.b`: Page Busy percentage (Base-10)
 * * `c.c.r`: Rage click count (Base-10)
 * * `c.c`: Click count (Base-10)
 * * `c.e`: Continuity Epoch timestamp (when everything started measuring) (Base-36)
 * * `c.f.d`: Frame Rate duration (how long it has been measuring) (milliseconds) (Base-10)
 * * `c.f.l`: Number of Long Frames (>= 50ms) (Base-10)
 * * `c.f.m`: Minimum Frame Rate (Base-10) per `COLLECTION_INTERVAL`
 * * `c.f.s`: Frame Rate measurement start timestamp (Base-36)
 * * `c.f`: Average Frame Rate over the Frame Rate Duration (Base-10)
 * * `c.fid`: First Input Delay (milliseconds) (Base-10)
 * * `c.i.a`: Average interaction delay (milliseconds) (Base-10)
 * * `c.i.dc`: Delayed interaction count (Base-10)
 * * `c.i.dt`: Delayed interaction time (milliseconds) (Base-10)
 * * `c.k.e`: Keyboard ESC count (Base-10)
 * * `c.k`: Keyboard event count (Base-10)
 * * `c.l`: Log (compressed)
 * * `c.lb`: Last Beacon timestamp (Base-36)
 * * `c.lt.n`: Number of Long Tasks (Base-10)
 * * `c.lt.tt`: Total duration of Long Tasks (milliseconds) (Base-10)
 * * `c.lt`: Long Task data (compressed)
 * * `c.m.n`: Mouse movement pixels (Base-10)
 * * `c.m.p`: Mouse movement percentage (Base-10)
 * * `c.s.d`: Distinct scrolls (scrolls that happen 2 seconds after the last) (Base-10)
 * * `c.s.p`: Scroll percentage (Base-10)
 * * `c.s.y`: Scroll y (pixels) (Base-10)
 * * `c.s`: Scroll count (Base-10)
 * * `c.t.click`: Click timeline (compressed)
 * * `c.t.domln`: DOM Length timeline (compressed)
 * * `c.t.domsz`: DOM Size timeline (compressed)
 * * `c.t.fps`: Frame Rate timeline (compressed)
 * * `c.t.inter`: Interactions timeline (compressed)
 * * `c.t.interdly`: Delayed Interactions timeline (compressed)
 * * `c.t.key`: Keyboard press timeline (compressed)
 * * `c.t.longtask`: LongTask timeline (compressed)
 * * `c.t.mem`: Memory usage timeline (compressed)
 * * `c.t.mouse`: Mouse movements timeline (compressed)
 * * `c.t.mousepct`: Mouse movement percentage (of full screen) timeline (compressed)
 * * `c.t.scroll`: Scroll timeline (compressed)
 * * `c.t.scrollpct`:Scroll percentage (of full page) timeline (compressed)
 * * `c.t.mut`: DOM Mutations timeline (compressed)
 * * `c.ttfi`: Time to First Interaction (milliseconds) (Base-10)
 * * `c.tti.fr`: Framework Ready (milliseconds) (Base-10)
 * * `c.tti.hi`: Hero Images ready (milliseconds) (Base-10)
 * * `c.tti.m`: Time to Interactive Method (`lt`, `raf`, `b`)
 * * `c.tti.vr`: Visually Ready (milliseconds) (Base-10)
 * * `c.tti`: Time to Interactive (milliseconds) (Base-10)
 *
 * @class BOOMR.plugins.Continuity
 */
(function() {
	BOOMR = window.BOOMR || {};

	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.Continuity) {
		return;
	}

	//
	// Constants available to all Continuity classes
	//
	/**
	 * Timeline collection interval
	 */
	var COLLECTION_INTERVAL = 100;

	/**
	 * Maximum length (ms) that events will be recorded, if not
	 * a SPA.
	 */
	var DEFAULT_AFTER_ONLOAD_MAX_LENGTH = 60000;

	/**
	 * Time to Interactive polling period (after onload, how often we'll
	 * check to see if TTI fired yet)
	 */
	var TIME_TO_INTERACTIVE_WAIT_POLL_PERIOD = 500;

	/**
	 * Compression Modes
	 */

	/**
	 * Most numbers are expected to be 0-63, though larger numbers are
	 * allowed.
	 */
	var COMPRESS_MODE_SMALL_NUMBERS = 0;

	/**
	 * Most numbers are expected to be larger than 63.
	 */
	var COMPRESS_MODE_LARGE_NUMBERS = 1;

	/**
	 * Numbers are from 0 to 100
	 */
	var COMPRESS_MODE_PERCENT = 2;

	/**
	 * Log types
	 */
	var LOG_TYPE_SCROLL = 0;
	var LOG_TYPE_CLICK = 1;
	var LOG_TYPE_MOUSE = 2;
	var LOG_TYPE_KEY = 3;
	var LOG_TYPE_VIS = 4;
	var LOG_TYPE_ORIENTATION = 5;

	/**
	 * Base64 number encoding
	 */
	var BASE64_NUMBER = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

	/**
	 * Large number delimiter (.)
	 *
	 * For COMPRESS_MODE_SMALL_NUMBERS, numbers larger than 63 are wrapped in this
	 * character.
	 */
	var LARGE_NUMBER_WRAP = ".";

	// Performance object
	var p = BOOMR.getPerformance();

	// Metrics that will be exported
	var externalMetrics = {};

	/**
	 * Epoch - when to base all relative times from.
	 *
	 * If the browser supports NavigationTiming, this is navigationStart.
	 *
	 * If not, just use 'now'.
	 */
	var epoch = p && p.timing && p.timing.navigationStart ?
		p.timing.navigationStart : BOOMR.now();

	/**
	 * Debug logging
	 *
	 * @param {string} msg Message
	 */
	function debug(msg) {
		BOOMR.debug(msg, "Continuity");
	}

	/**
	 * Compress JSON to a string for a URL parameter in the best way possible.
	 *
	 * If UserTimingCompression is available (which has JSURL), use that.  The
	 * data will start with the character `~`
	 *
	 * Otherwise, use JSON.stringify.  The data will start with the character `{`.
	 *
	 * @param {object} obj Data
	 *
	 * @returns {string} Compressed data
	 */
	function compressJson(data) {
		var utc = window.UserTimingCompression || BOOMR.window.UserTimingCompression;

		if (utc) {
			return utc.jsUrl(data);
		}
		else if (window.JSON) {
			return JSON.stringify(data);
		}
		else {
			// JSON isn't available
			return "";
		}
	}

	/**
	 * Gets a compressed bucket log.
	 *
	 * Each bucket is represented by a single character (the value of the
	 * bucket base 64), unless:
	 *
	 * 1. There are 4 or more duplicates in a row. Then the format is:
	 *   *[count of dupes]*[number base 64]
	 * 2. The value is greater than 63, then the format is:
	 *   _[number base 36]_
	 *
	 * @param {number} type Compression type
	 * @param {boolean} backfill Backfill
	 * @param {object} dataSet Data
	 * @param {number} sinceBucket Lowest bucket
	 * @param {number} endBucket Highest bucket
	 *
	 * @returns {string} Compressed log
	 */
	function compressBucketLog(type, backfill, dataSet, sinceBucket, endBucket) {
		var out = "", val = 0, i, j, dupes, valStr, nextVal, wroteSomething;

		if (!dataSet || !BOOMR.utils.Compression) {
			return "";
		}

		// if we know there's no data, return an empty string
		if (dataSet.length === 0) {
			return "";
		}

		if (backfill) {
			if (typeof dataSet[sinceBucket] === "undefined") {
				dataSet[sinceBucket] = 0;
			}

			// pre-fill buckets
			for (i = sinceBucket + 1; i <= endBucket; i++) {
				if (typeof dataSet[i] === "undefined") {
					dataSet[i] = dataSet[i - 1];
				}
			}
		}

		for (i = sinceBucket; i <= endBucket; i++) {
			val = (typeof dataSet[i] === "number" && !isNaN(dataSet[i])) ?
			    dataSet[i] : 0;

			//
			// Compression modes
			//
			if (type === COMPRESS_MODE_SMALL_NUMBERS) {
				// Small numbers can be max 63 for our single-digit encoding
				if (val <= 63) {
					valStr = BASE64_NUMBER.charAt(val);
				}
				else {
					// large numbers get wrapped in .s
					valStr = LARGE_NUMBER_WRAP + val.toString(36) + LARGE_NUMBER_WRAP;
				}
			}
			else if (type === COMPRESS_MODE_LARGE_NUMBERS) {
				// large numbers just get Base36 encoding by default
				valStr = val.toString(36);
			}
			else if (type === COMPRESS_MODE_PERCENT) {
				//
				// Percentage characters take two digits always, with
				// 100 = __
				//
				if (val < 99) {
					// 0-pad
					valStr = val <= 9 ? ("0" + Math.max(val, 0)) : val;
				}
				else {
					// 100 or higher
					valStr = "__";
				}
			}

			// compress sequences of the same number 4 or more times
			if ((i + 3) <= endBucket &&
			    (dataSet[i + 1] === val || (val === 0 && dataSet[i + 1] === undefined)) &&
			    (dataSet[i + 2] === val || (val === 0 && dataSet[i + 2] === undefined)) &&
			    (dataSet[i + 3] === val || (val === 0 && dataSet[i + 3] === undefined))) {
				dupes = 1;

				// loop until we're past the end bucket or we find a non-dupe
				while (i < endBucket) {
					if (dataSet[i + 1] === val || (val === 0 && dataSet[i + 1] === undefined)) {
						dupes++;
					}
					else {
						break;
					}

					i++;
				}

				nextVal = "*" + dupes.toString(36) + "*" + valStr;
			}
			else {
				nextVal = valStr;
			}

			// add this value if it isn't just 0s at the end
			if (val !== 0 || i !== endBucket) {
				//
				// Small numbers fit into a single character (or are delimited
				// by _s), so can just be appended to each other.
				//
				// Percentage always takes two characters.
				//
				if (type === COMPRESS_MODE_LARGE_NUMBERS) {
					//
					// Large numbers need to be separated by commas
					//
					if (wroteSomething) {
						out += ",";
					}
				}

				wroteSomething = true;
				out += nextVal;
			}
		}

		return wroteSomething ? (type.toString() + out) : "";
	}

	/* BEGIN_DEBUG */
	/**
	 * Decompresses a compressed bucket log.
	 *
	 * See {@link compressBucketLog} for details
	 *
	 * @param {string} data Data
	 * @param {number} [minBucket] Minimum bucket
	 *
	 * @returns {object} Decompressed log
	 */
	function decompressBucketLog(data, minBucket) {
		var out = [], i, j, idx = minBucket || 0, endChar, repeat, num, type;

		if (!data || data.length === 0) {
			return [];
		}

		// strip the type out
		type = parseInt(data.charAt(0), 10);
		data = data.substring(1);

		// decompress string
		repeat = 1;

		for (i = 0; i < data.length; i++) {
			if (data.charAt(i) === "*") {
				// this is a repeating number

				// move past the "*"
				i++;

				// up to the next * is the repeating count (base 36)
				endChar = data.indexOf("*", i);
				repeat = parseInt(data.substring(i, endChar), 36);

				// after is the number
				i = endChar;
				continue;
			}
			else if (data.charAt(i) === LARGE_NUMBER_WRAP) {
				// this is a number larger than 63

				// move past the wrap character
				i++;

				// up to the next wrap character is the number (base 36)
				endChar = data.indexOf(LARGE_NUMBER_WRAP, i);
				num = parseInt(data.substring(i, endChar), 36);

				// move to this end char
				i = endChar;
			}
			else {
				if (type === COMPRESS_MODE_SMALL_NUMBERS) {
					// this digit is a number from 0 to 63
					num = decompressBucketLogNumber(data.charAt(i));
				}
				else if (type === COMPRESS_MODE_LARGE_NUMBERS) {
					// look for this digit to end at a comma

					endChar = data.indexOf(",", i);

					if (endChar !== -1) {
						// another index exists later, read up to that
						num = parseInt(data.substring(i, endChar), 36);

						// move to this end char
						i = endChar;
					}
					else {
						// this is the last number
						num = parseInt(data.substring(i), 36);

						// we're done
						i = data.length;
					}
				}
				else if (type === COMPRESS_MODE_PERCENT) {
					// check if this is 100
					if (data.substr(i, 2) === "__") {
						num = 100;
					}
					else {
						num = parseInt(data.substr(i, 2), 10);
					}

					// take two characters
					i++;
				}
			}

			out[idx] = num;
			for (j = 1; j < repeat; j++) {
				idx++;
				out[idx] = num;
			}

			idx++;
			repeat = 1;
		}

		return out;
	}

	/**
	 * Decompresses a bucket log Base64 number (0 - 63)
	 *
	 * @param {string} input Character
	 *
	 * @returns {number} Base64 number
	 */
	function decompressBucketLogNumber(input) {
		if (!input || !input.charCodeAt) {
			return 0;
		}

		// convert to ASCII character code
		var chr = input.charCodeAt(0);

		if (chr >= 48 && chr <= 57) {
			// 0 - 9
			return chr - 48;
		}
		else if (chr >= 97 && chr <= 122) {
			// a - z
			return (chr - 97) + 10;
		}
		else if (chr >= 65 && chr <= 90) {
			// A - Z
			return (chr - 65) + 36;
		}
		else if (chr === 95) {
			// -
			return 62;
		}
		else if (chr === 45) {
			// _
			return 63;
		}
		else {
			// unknown
			return 0;
		}
	}

	/**
	 * Decompresses the log into events
	 *
	 * @param {string} data Compressed log
	 *
	 * @returns {object} Decompressed log
	 */
	function decompressLog(data) {
		var val = "", i, j, eventData, events, out = [], evt;

		// each event is separate by a |
		events = data.split("|");

		for (i = 0; i < events.length; i++) {
			eventData = events[i].split(",");

			evt = {
				type: parseInt(eventData[0].charAt(0), 10),
				time: parseInt(eventData[0].substring(1), 36)
			};

			// add all attributes
			for (j = 1; j < eventData.length; j++) {
				evt[eventData[j].charAt(0)] = eventData[j].substring(1);
			}

			out.push(evt);
		}

		return out;
	}
	/* END_DEBUG */

	/**
	 * Timeline data
	 *
	 * Responsible for:
	 *
	 * * Keeping track of counts of events that happen over time (in
	 *   COLLECTION_INTERVAL intervals).
	 * * Keeps a log of raw events.
	 * * Calculates Time to Interactive (TTI) and Visually Ready.
	 *
	 * @class BOOMR.plugins.Continuity.Timeline
	 */
	var Timeline = function(startTime) {
		//
		// Constants
		//
		/**
		 * Number of "idle" intervals (of COLLECTION_INTERVAL ms) before
		 * Time to Interactive is called.
		 *
		 * 5 * 100 = 500ms (of no long tasks > 50ms and FPS >= 20)
		 */
		var TIME_TO_INTERACTIVE_IDLE_INTERVALS = 5;

		/**
		 * For Time to Interactive, minimum FPS.
		 *
		 * ~20 FPS or max ~50ms blocked
		 */
		var TIME_TO_INTERACTIVE_MIN_FPS = 20;

		/**
		 * For Time to Interactive, minimum FPS per COLLECTION_INTERVAL.
		 */
		var TIME_TO_INTERACTIVE_MIN_FPS_PER_INTERVAL =
			TIME_TO_INTERACTIVE_MIN_FPS / (1000 / COLLECTION_INTERVAL);

		/**
		 * For Time to Interactive, max Page Busy (if LongTasks aren't supported)
		 *
		 * ~50%
		 */
		var TIME_TO_INTERACTIVE_MAX_PAGE_BUSY = 50;

		//
		// Local Members
		//

		// timeline data
		var data = {};

		// timeline data options
		var dataOptions = {};

		// timeline log
		var dataLog = [];

		// time-to-interactive timestamp
		var tti = 0;

		// visually ready timestamp
		var visuallyReady = 0;

		// hero images timestamp
		var heroImagesReady = 0;

		// check for pre-Boomerang FPS log
		if (BOOMR.fpsLog && BOOMR.fpsLog.length) {
			// start at the first frame instead of now
			startTime = BOOMR.fpsLog[0] + epoch;

			// NOTE: FrameRateMonitor will remove fpsLog
		}

		//
		// Functions
		//
		/**
		 * Registers a monitor
		 *
		 * @param {string} type Type
		 * @param {number} [compressMode] Compression mode
		 * @param {boolean} [backfillLast] Whether or not to backfill missing entries
		 * with the most recent value.
		 */
		function register(type, compressMode, backfillLast) {
			if (!data[type]) {
				data[type] = [];
			}

			dataOptions[type] = {
				compressMode: compressMode ? compressMode : COMPRESS_MODE_SMALL_NUMBERS,
				backfillLast: backfillLast
			};
		}

		/**
		 * Gets the current time bucket
		 *
		 * @returns {number} Current time bucket
		 */
		function getTimeBucket() {
			return Math.floor((BOOMR.now() - startTime) / COLLECTION_INTERVAL);
		}

		/**
		 * Sets data for the specified type.
		 *
		 * The type should be registered first via {@link register}.
		 *
		 * @param {string} type Type
		 * @param {number} [value] Value
		 * @param {number} [bucket] Time bucket
		 */
		function set(type, value, bucket) {
			if (typeof bucket === "undefined") {
				bucket = getTimeBucket();
			}

			if (!data[type]) {
				return;
			}

			data[type][bucket] = value;
		}

		/**
		 * Increments data for the specified type
		 *
		 * The type should be registered first via {@link register}.
		 *
		 * @param {string} type Type
		 * @param {number} [value] Value
		 * @param {number} [bucket] Time bucket
		 */
		function increment(type, value, bucket) {
			if (typeof bucket === "undefined") {
				bucket = getTimeBucket();
			}

			if (typeof value === "undefined") {
				value = 1;
			}

			if (!data[type]) {
				return;
			}

			if (!data[type][bucket]) {
				data[type][bucket] = 0;
			}

			data[type][bucket] += value;
		}

		/**
		 * Log an event
		 *
		 * @param {string} type Type
		 * @param {number} [bucket] Time bucket
		 * @param {array} [val] Event data
		 */
		function log(type, bucket, val) {
			if (typeof bucket === "undefined") {
				bucket = getTimeBucket();
			}

			dataLog.push({
				type: type,
				time: bucket,
				val: val
			});

			// trim to logMaxEntries
			if (dataLog.length > impl.logMaxEntries) {
				Array.prototype.splice.call(
					dataLog,
					0,
					(dataLog.length - impl.logMaxEntries)
				);
			}
		}

		/**
		 * Gets stats for a type since the specified start time.
		 *
		 * @param {string} type Type
		 * @param {number} since Start time
		 *
		 * @returns {object} Stats for the type
		 */
		function getStats(type, since) {
			var count = 0,
			    total = 0,
			    min = Infinity,
			    max = 0,
			    val,
			    sinceBucket = Math.floor((since - startTime) / COLLECTION_INTERVAL);

			if (!data[type]) {
				return 0;
			}

			for (var bucket in data[type]) {
				bucket = parseInt(bucket, 10);

				if (bucket >= sinceBucket) {
					if (data[type].hasOwnProperty(bucket)) {
						val = data[type][bucket];

						// calculate count, total and minimum
						count++;
						total += val;

						min = Math.min(min, val);
						max = Math.max(max, val);
					}
				}
			}

			// return the stats
			return {
				total: total,
				count: count,
				min: min,
				max: max
			};
		}

		/**
		 * Given a CSS selector, determine the load time of any IMGs matching
		 * that selector and/or IMGs underneath it.
		 *
		 * @param {string} selector CSS selector
		 *
		 * @returns {number} Last image load time
		 */
		function determineImageLoadTime(selector) {
			var combinedSelector, elements, latestTs = 0, i, j, src, entries;

			// check to see if we have querySelectorAll available
			if (!BOOMR.window ||
			    !BOOMR.window.document ||
			    typeof BOOMR.window.document.querySelectorAll !== "function") {
				// can't use querySelectorAll
				return 0;
			}

			// check to see if we have ResourceTiming available
			if (!p ||
			    typeof p.getEntriesByType !== "function") {
				// can't use ResourceTiming
				return 0;
			}

			// find any images matching this selector or underneath this selector
			combinedSelector = selector + ", " + selector + " * img, " + selector + " * image";

			// use QSA to find all matching
			elements = BOOMR.window.document.querySelectorAll(combinedSelector);
			if (elements && elements.length) {
				for (i = 0; i < elements.length; i++) {
					src = elements[i].currentSrc ||
						elements[i].src ||
						(typeof elements[i].getAttribute === "function" && elements[i].getAttribute("xlink:href"));

					if (src) {
						entries = p.getEntriesByName(src);
						if (entries && entries.length) {
							for (j = 0; j < entries.length; j++) {
								latestTs = Math.max(latestTs, entries[j].responseEnd);
							}
						}
					}
				}
			}

			return latestTs ? Math.floor(latestTs + epoch) : 0;
		}

		/**
		 * Determine Visually Ready time.  This is the last of:
		 * 1. First Contentful Paint (if available)
		 * 2. First Paint (if available)
		 * 3. domContentLoadedEventEnd
		 * 4. Hero Images are loaded (if configured)
		 * 5. Framework Ready (if configured)
		 *
		 * @returns {number|undefined} Timestamp, if everything is ready, or
		 *    `undefined` if not
		 */
		function determineVisuallyReady() {
			var latestTs = 0;

			// start with Framework Ready (if configured)
			if (impl.ttiWaitForFrameworkReady) {
				if (!impl.frameworkReady) {
					return;
				}

				latestTs = impl.frameworkReady;
			}

			// use First Contentful Paint (if available) or
			if (BOOMR.plugins.PaintTiming &&
			    BOOMR.plugins.PaintTiming.is_supported() &&
			    p &&
			    p.timeOrigin) {
				var fp = BOOMR.plugins.PaintTiming.getTimingFor("first-contentful-paint");
				if (!fp) {
					// or get First Paint directly from PaintTiming
					fp = BOOMR.plugins.PaintTiming.getTimingFor("first-paint");
				}

				if (fp) {
					latestTs = Math.max(latestTs, Math.round(fp + p.timeOrigin));
				}
			}
			else if (p && p.timing && p.timing.msFirstPaint) {
				// use IE's First Paint (if available) or
				latestTs = Math.max(latestTs, p.timing.msFirstPaint);
			}
			else if (BOOMR.window &&
			    BOOMR.window.chrome &&
			    typeof BOOMR.window.chrome.loadTimes === "function") {
				// use Chrome's firstPaintTime (if available)
				var loadTimes = BOOMR.window.chrome.loadTimes();
				if (loadTimes && loadTimes.firstPaintTime) {
					latestTs = Math.max(latestTs, loadTimes.firstPaintTime * 1000);
				}
			}

			// Use domContentLoadedEventEnd (if available)
			if (p && p.timing && p.timing.domContentLoadedEventEnd) {
				latestTs = Math.max(latestTs, p.timing.domContentLoadedEventEnd);
			}

			// look up any Hero Images (if configured)
			if (impl.ttiWaitForHeroImages) {
				heroImagesReady = determineImageLoadTime(impl.ttiWaitForHeroImages);

				if (heroImagesReady) {
					latestTs = Math.max(latestTs, heroImagesReady);
				}
			}

			return latestTs;
		}

		/**
		 * Adds the compressed data log to the beacon
		 */
		function addCompressedLogToBeacon() {
			var val = "";

			for (var i = 0; i < dataLog.length; i++) {
				var evt = dataLog[i];

				if (i !== 0) {
					// add a separator between events
					val += "|";
				}

				// add the type
				val += evt.type;

				// add the time: offset from epoch, base36
				val += Math.round(evt.time - epoch).toString(36);

				// add each parameter
				for (var param in evt.val) {
					if (evt.val.hasOwnProperty(param)) {
						val += "," + param;

						if (typeof evt.val[param] === "number") {
							// base36
							val += evt.val[param].toString(36);
						}
						else {
							val += evt.val[param];
						}
					}
				}
			}

			if (val !== "") {
				impl.addToBeacon("c.l", val);
			}
		}

		/**
		 * Gets the bucket log for our data
		 *
		 * @param {string} type Type
		 * @param {number} sinceBucket Lowest bucket
		 *
		 * @returns {string} Compressed log of our data
		 */
		function getCompressedBucketLogFor(type, since) {
			return compressBucketLog(
				dataOptions[type].compressMode,
				dataOptions[type].backfillLast,
				data[type],
				since !== 0 ? Math.floor((since - startTime) / COLLECTION_INTERVAL) : 0,
				getTimeBucket());
		}

		/**
		 * Adds the timeline to the beacon compressed.
		 *
		 * @param {number} [since] Since timestamp
		 */
		function addCompressedTimelineToBeacon(since) {
			var type, compressedLog;

			for (type in data) {
				if (data.hasOwnProperty((type))) {
					// get the compressed data
					compressedLog = getCompressedBucketLogFor(type, since);

					// add to the beacon
					if (compressedLog !== "") {
						impl.addToBeacon("c.t." + type, compressedLog);
					}
				}
			}
		}

		/**
		 * Analyzes metrics such as Time To Interactive
		 *
		 * @param {number} timeOfLastBeacon Time we last sent a beacon
		 */
		function analyze(timeOfLastBeacon) {
			var endBucket = getTimeBucket(),
			    j = 0,
			    idleIntervals = 0;

			// add log
			if (impl.sendLog && typeof timeOfLastBeacon !== "undefined") {
				addCompressedLogToBeacon();
			}

			// add timeline
			if (impl.sendTimeline && typeof timeOfLastBeacon !== "undefined") {
				addCompressedTimelineToBeacon(timeOfLastBeacon);
			}

			if (tti) {
				return;
			}

			// need to get Visually Ready first
			if (!visuallyReady) {
				visuallyReady = determineVisuallyReady();
				if (!visuallyReady) {
					return;
				}
			}

			// add Visually Ready to the beacon
			impl.addToBeacon("c.tti.vr", externalMetrics.timeToVisuallyReady());

			// add Framework Ready to the beacon
			impl.addToBeacon("c.tti.fr", externalMetrics.timeToFrameworkReady());

			// add Framework Ready to the beacon
			impl.addToBeacon("c.tti.hi", externalMetrics.timeToHeroImagesReady());

			// Calculate TTI
			if (!data.longtask && !data.fps && !data.busy) {
				// can't calculate TTI
				return;
			}

			// determine the first bucket we'd use
			var startBucket = Math.floor((visuallyReady - startTime) / COLLECTION_INTERVAL);

			for (j = startBucket; j <= endBucket; j++) {
				if (data.longtask && data.longtask[j]) {
					// had a long task during this interval
					idleIntervals = 0;
					continue;
				}

				if (data.fps && (!data.fps[j] || data.fps[j] < TIME_TO_INTERACTIVE_MIN_FPS_PER_INTERVAL)) {
					// No FPS or less than 20 FPS during this interval
					idleIntervals = 0;
					continue;
				}

				if (data.busy && (data.busy[j] > TIME_TO_INTERACTIVE_MAX_PAGE_BUSY)) {
					// Too busy
					idleIntervals = 0;
					continue;
				}

				if (data.interdly && data.interdly[j]) {
					// a delayed interaction happened
					idleIntervals = 0;
					continue;
				}

				// this was an idle interval
				idleIntervals++;

				// if we've found enough idle intervals, mark TTI as the beginning
				// of this idle period
				if (idleIntervals >= TIME_TO_INTERACTIVE_IDLE_INTERVALS) {
					tti = startTime + ((j - TIME_TO_INTERACTIVE_IDLE_INTERVALS) * COLLECTION_INTERVAL);

					// ensure we don't set TTI before TTVR
					tti = Math.max(tti, visuallyReady);
					break;
				}
			}

			// we were able to calculate a TTI
			if (tti > 0) {
				impl.addToBeacon("c.tti", externalMetrics.timeToInteractive());
			}
		}

		//
		// External metrics
		//

		/**
		 * Time to Interactive
		 */
		externalMetrics.timeToInteractive = function() {
			if (tti) {
				// milliseconds since nav start
				return tti - epoch;
			}

			// no data
			return;
		};

		/**
		 * Time to Visually Ready
		 */
		externalMetrics.timeToVisuallyReady = function() {
			if (visuallyReady) {
				// milliseconds since nav start
				return visuallyReady - epoch;
			}

			// no data
			return;
		};

		/**
		 * Time to Hero Images Ready
		 */
		externalMetrics.timeToHeroImagesReady = function() {
			if (impl.ttiWaitForHeroImages && heroImagesReady) {
				return heroImagesReady - epoch;
			}

			// not configured or not set
			return;
		};

		/**
		 * Time to Framework Ready
		 */
		externalMetrics.timeToFrameworkReady = function() {
			if (impl.ttiWaitForFrameworkReady && impl.frameworkReady) {
				return impl.frameworkReady - epoch;
			}

			// not configured or not set
			return;
		};

		externalMetrics.log = function() {
			return dataLog;
		};

		/**
		 * Disables the monitor
		 */
		function stop() {
			data = {};
			dataLog = [];
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			// clear the buckets
			for (var type in data) {
				if (data.hasOwnProperty(type)) {
					data[type] = [];
				}
			}

			// reset the data log
			dataLog = [];
		}

		return {
			register: register,
			set: set,
			log: log,
			increment: increment,
			getTimeBucket: getTimeBucket,
			getStats: getStats,
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors LongTasks
	 *
	 * @class BOOMR.plugins.Continuity.LongTaskMonitor
	 */
	var LongTaskMonitor = function(w, t) {
		if (!w.PerformanceObserver || !w.PerformanceLongTaskTiming) {
			return;
		}

		//
		// Constants
		//
		/**
		 * LongTask attribution types
		 */
		var ATTRIBUTION_TYPES = {
			"unknown": 0,
			"self": 1,
			"same-origin-ancestor": 2,
			"same-origin-descendant": 3,
			"same-origin": 4,
			"cross-origin-ancestor": 5,
			"cross-origin-descendant": 6,
			"cross-origin-unreachable": 7,
			"multiple-contexts": 8
		};

		/**
		 * LongTask culprit attribution names
		 */
		var CULPRIT_ATTRIBUTION_NAMES = {
			"unknown": 0,
			"script": 1,
			"layout": 2
		};

		/**
		 * LongTask culprit types
		 */
		var CULPRIT_TYPES = {
			"unknown": 0,
			"iframe": 1,
			"embed": 2,
			"object": 3
		};

		//
		// Local Members
		//

		// PerformanceObserver
		var perfObserver = new w.PerformanceObserver(onPerformanceObserver);

		try {
			perfObserver.observe({ entryTypes: ["longtask"] });
		}
		catch (e) {
			// longtask not supported
			return;
		}

		// register this type
		t.register("longtask", COMPRESS_MODE_SMALL_NUMBERS);

		// Long Tasks array
		var longTasks = [];

		// whether or not we're enabled
		var enabled = true;

		// total time of long tasks
		var longTasksTime = 0;

		/**
		 * Callback for the PerformanceObserver
		 */
		function onPerformanceObserver(list) {
			var entries, i;

			if (!enabled) {
				return;
			}

			// just capture all of the data for now, we'll analyze at the beacon
			entries = list.getEntries();
			Array.prototype.push.apply(longTasks, entries);

			// add total time and count of long tasks
			for (i = 0; i < entries.length; i++) {
				longTasksTime += entries[i].duration;
			}

			// add to the timeline
			t.increment("longtask", entries.length);
		}

		/**
		 * Gets the current list of tasks
		 *
		 * @returns {PerformanceEntry[]} Tasks
		 */
		function getTasks() {
			return longTasks;
		}

		/**
		 * Clears the Long Tasks
		 */
		function clearTasks() {
			longTasks = [];

			longTasksTime = 0;
		}

		/**
		 * Analyzes LongTasks
		 */
		function analyze(startTime) {
			var i, j, task, obj, objs = [], attrs = [], attr;

			if (longTasks.length === 0) {
				return;
			}

			for (i = 0; i < longTasks.length; i++) {
				task = longTasks[i];

				// compress the object a bit
				obj = {
					s: Math.round(task.startTime).toString(36),
					d: Math.round(task.duration).toString(36),
					n: ATTRIBUTION_TYPES[task.name] ? ATTRIBUTION_TYPES[task.name] : 0
				};

				attrs = [];

				for (j = 0; j < task.attribution.length; j++) {
					attr = task.attribution[j];

					// skip script/iframe with no attribution
					if (attr.name === "script" &&
					    attr.containerType === "iframe" &&
					    !attr.containerName &&
						!attr.containerId && !attr.containerSrc) {
						continue;
					}

					// only use containerName if not the same as containerId
					var containerName = attr.containerName ? attr.containerName : undefined;
					var containerId = attr.containerId ? attr.containerId : undefined;
					if (containerName === containerId) {
						containerName = undefined;
					}

					// only use containerSrc if containerId is undefined
					var containerSrc = containerId === undefined ? attr.containerSrc : undefined;

					attrs.push({
						a: CULPRIT_ATTRIBUTION_NAMES[attr.name] ? CULPRIT_ATTRIBUTION_NAMES[attr.name] : 0,
						t: CULPRIT_TYPES[attr.containerType] ? CULPRIT_TYPES[attr.containerType] : 0,
						n: containerName,
						i: containerId,
						s: containerSrc
					});
				}

				if (attrs.length > 0) {
					obj.a = attrs;
				}

				objs.push(obj);
			}

			// add data to beacon
			impl.addToBeacon("c.lt.n", externalMetrics.longTasksCount(), true);
			impl.addToBeacon("c.lt.tt", externalMetrics.longTasksTime());

			impl.addToBeacon("c.lt", compressJson(objs));
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;

			perfObserver.disconnect();

			clearTasks();
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			clearTasks();
		}

		//
		// External metrics
		//

		/**
		 * Total time of LongTasks (ms)
		 */
		externalMetrics.longTasksTime = function() {
			return longTasksTime;
		};

		/**
		 * Number of LongTasks
		 */
		externalMetrics.longTasksCount = function() {
			return longTasks.length;
		};

		return {
			getTasks: getTasks,
			clearTasks: clearTasks,
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors Page Busy if LongTasks isn't supported
	 *
	 * @class BOOMR.plugins.Continuity.PageBusyMonitor
	 */
	var PageBusyMonitor = function(w, t) {
		// register this type
		t.register("busy", COMPRESS_MODE_PERCENT);

		//
		// Constants
		//

		/**
		 * How frequently to poll (ms).
		 *
		 * IE and Edge clamp polling to the nearest 16ms.  With 32ms, we
		 * will see approximately 3 polls per 100ms.
		 */
		var POLLING_INTERVAL = 32;

		/**
		 * How much deviation from the expected time to allow (ms)
		 */
		var ALLOWED_DEVIATION_MS = 4;

		/**
		 * How often to report on Page Busy (ms)
		 */
		var REPORT_INTERVAL = 100;

		/**
		 * How many polls there were per-report
		 */
		var POLLS_PER_REPORT =
		    Math.floor(REPORT_INTERVAL / POLLING_INTERVAL);

		/**
		 * How many missed polls should we go backwards? (10 seconds worth)
		 */
		var MAX_MISSED_REPORTS = 100;

		//
		// Local Members
		//

		// last time we ran
		var last = BOOMR.now();

		// total callbacks
		var total = 0;

		// late callbacks
		var late = 0;

		// overall total and late callbacks (reset on beacon)
		var overallTotal = 0;
		var overallLate = 0;

		// whether or not we're enabled
		var enabled = true;

		// intervals
		var pollInterval = false;
		var reportInterval = false;

		/**
		 * Polling interval
		 */
		function onPoll() {
			var now = BOOMR.now();
			var delta = now - last;
			last = now;

			// if we're more than 2x the polling interval
			// + deviation, we missed at least one period completely
			if (delta > ((POLLING_INTERVAL * 2) + ALLOWED_DEVIATION_MS)) {
				var missedPolls = Math.floor((delta - POLLING_INTERVAL) / POLLING_INTERVAL);

				total += missedPolls;
				late += missedPolls;
				delta -= (missedPolls * POLLING_INTERVAL);
			}

			// total intervals increased by one
			total++;

			// late intervals increased by one if we're more than the interval + deviation
			if (delta > (POLLING_INTERVAL + ALLOWED_DEVIATION_MS)) {
				late++;
			}
		}

		/**
		 * Each reporting interval, log page busy
		 */
		function onReport() {
			var reportTime = t.getTimeBucket();
			var curTime = reportTime;
			var missedReports = 0;

			if (total === 0) {
				return;
			}

			// if we had more polls than we expect in each
			// collection period (we allow one extra for wiggle room), we
			// must not have been able to report, so assume those periods were 100%
			while (total > (POLLS_PER_REPORT + 1) &&
			       missedReports <= MAX_MISSED_REPORTS) {
				t.set("busy", 100, --curTime);

				// reset the period by one
				total -= POLLS_PER_REPORT;
				late   = Math.max(late - POLLS_PER_REPORT, 0);

				// this was a busy period
				overallTotal += POLLS_PER_REPORT;
				overallLate += POLLS_PER_REPORT;

				missedReports++;
			}

			// update the total stats
			overallTotal += total;
			overallLate += late;

			t.set("busy", Math.round(late / total * 100), reportTime);

			// reset stats
			total = 0;
			late = 0;
		}

		/**
		 * Analyzes Page Busy
		 */
		function analyze(startTime) {
			// add data to beacon
			impl.addToBeacon("c.b", externalMetrics.pageBusy());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;

			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = false;
			}

			if (reportInterval) {
				clearInterval(reportInterval);
				reportInterval = false;
			}
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			overallTotal = 0;
			overallLate = 0;
		}

		//
		// External metrics
		//

		/**
		 * Total Page Busy time
		 */
		externalMetrics.pageBusy = function() {
			if (overallTotal === 0) {
				return 0;
			}

			return Math.round(overallLate / overallTotal * 100);
		};

		//
		// Setup
		//
		pollInterval = setInterval(onPoll, POLLING_INTERVAL);
		reportInterval = setInterval(onReport, REPORT_INTERVAL);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors framerate (FPS)
	 *
	 * @class BOOMR.plugins.Continuity.FrameRateMonitor
	 */
	var FrameRateMonitor = function(w, t) {
		// register this type
		t.register("fps", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		// long frame maximum milliseconds
		var LONG_FRAME_MAX = 50;

		//
		// Local Members
		//

		// total frames seen
		var totalFrames = 0;

		// long frames
		var longFrames = 0;

		// time we started monitoring
		var frameStartTime;

		// last frame we saw
		var lastFrame;

		// whether or not we're enabled
		var enabled = true;

		// check for pre-Boomerang FPS log
		if (BOOMR.fpsLog && BOOMR.fpsLog.length) {
			lastFrame = frameStartTime = BOOMR.fpsLog[0] + epoch;

			// transition any FPS log events to our timeline
			for (var i = 0; i < BOOMR.fpsLog.length; i++) {
				var ts = epoch + BOOMR.fpsLog[i];

				// update the frame count for this time interval
				t.increment("fps", 1, Math.floor((ts - frameStartTime) / COLLECTION_INTERVAL));

				// calculate how long this frame took
				if (ts - lastFrame >= LONG_FRAME_MAX) {
					longFrames++;
				}

				// last frame timestamp
				lastFrame = ts;
			}

			totalFrames = BOOMR.fpsLog.length;

			delete BOOMR.fpsLog;
		}
		else {
			frameStartTime = BOOMR.now();
		}

		/**
		 * requestAnimationFrame callback
		 */
		function frame(now) {
			if (!enabled) {
				return;
			}

			// calculate how long this frame took
			if (now - lastFrame >= LONG_FRAME_MAX) {
				longFrames++;
			}

			// last frame timestamp
			lastFrame = now;

			// keep track of total frames we've seen
			totalFrames++;

			// increment the FPS
			t.increment("fps");

			// request the next frame
			w.requestAnimationFrame(frame);
		}

		/**
		 * Analyzes FPS
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.f", externalMetrics.fps());
			impl.addToBeacon("c.f.d", externalMetrics.fpsDuration());
			impl.addToBeacon("c.f.m", externalMetrics.fpsMinimum());
			impl.addToBeacon("c.f.l", externalMetrics.fpsLongFrames());
			impl.addToBeacon("c.f.s", externalMetrics.fpsStart());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;
			frameStartTime = 0;
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			if (enabled) {
				// restart to now
				frameStartTime = BOOMR.now();
			}

			totalFrames = 0;
			longFrames = 0;
		}

		// start the first frame
		w.requestAnimationFrame(frame);

		//
		// External metrics
		//

		/**
		 * Frame Rate since fpsStart
		 */
		externalMetrics.fps = function() {
			var dur = externalMetrics.fpsDuration();
			if (dur) {
				return Math.floor(totalFrames / (dur / 1000));
			}
		};

		/**
		 * How long FPS was being tracked for
		 */
		externalMetrics.fpsDuration = function() {
			if (frameStartTime) {
				return BOOMR.now() - frameStartTime;
			}
		};

		/**
		 * Minimum FPS during the period
		 */
		externalMetrics.fpsMinimum = function() {
			var dur = externalMetrics.fpsDuration();
			if (dur) {
				var min = t.getStats("fps", frameStartTime).min;
				return min !== Infinity ? min : undefined;
			}
		};

		/**
		 * Number of long frames (over 18ms)
		 */
		externalMetrics.fpsLongFrames = function() {
			return longFrames;
		};

		/**
		 * When FPS tracking started (base 36)
		 */
		externalMetrics.fpsStart = function() {
			return frameStartTime ? frameStartTime.toString(36) : 0;
		};

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors scrolling
	 *
	 * @class BOOMR.plugins.Continuity.ScrollMonitor
	 */
	var ScrollMonitor = function(w, t, i) {
		if (!w || !w.document || !w.document.body || !w.document.documentElement) {
			// something's wrong with the DOM, abort
			return;
		}

		//
		// Constants
		//

		// number of milliseconds between each distinct scroll
		var DISTINCT_SCROLL_SECONDS = 2000;

		// number of pixels to change before logging a scroll event
		var MIN_SCROLL_Y_CHANGE_FOR_LOG = 20;

		//
		// Local Members
		//

		// last scroll Y
		var lastY = 0;

		// last scroll Y logged
		var lastYLogged = 0;

		// scroll % this period
		var intervalScrollPct = 0;

		// scroll % total
		var totalScrollPct = 0;

		// number of scroll events
		var scrollCount = 0;

		// total scroll pixels
		var scrollPixels = 0;

		// number of distinct scrolls (scroll which happened
		// over DISTINCT_SCROLL_SECONDS seconds apart)
		var distinctScrollCount = 0;

		// last time we scrolled
		var lastScroll = 0;

		// collection interval id
		var collectionInterval = false;

		// body and html element
		var body = w.document.body;
		var html = w.document.documentElement;

		// register this type
		t.register("scroll", COMPRESS_MODE_SMALL_NUMBERS);
		t.register("scrollpct", COMPRESS_MODE_PERCENT);

		// height of the document
		var documentHeight = Math.max(
			body.scrollHeight,
			body.offsetHeight,
			html.clientHeight,
			html.scrollHeight,
			html.offsetHeight) - BOOMR.utils.windowHeight();

		/**
		 * Fired when a scroll event happens
		 *
		 * @param {Event} e Scroll event
		 */
		function onScroll(e) {
			var now = BOOMR.now();

			scrollCount++;

			// see if this is a unique scroll
			if (now - lastScroll > DISTINCT_SCROLL_SECONDS) {
				distinctScrollCount++;
			}

			lastScroll = now;

			// determine how many pixels were scrolled
			var curY = BOOMR.utils.scroll().y;
			var diffY = Math.abs(lastY - curY);

			scrollPixels += diffY;

			// update the timeline
			t.increment("scroll", diffY);

			// only log the event if we're over the threshold
			if (lastYLogged === 0 || Math.abs(lastYLogged - curY) > MIN_SCROLL_Y_CHANGE_FOR_LOG) {
				// add to the log
				t.log(LOG_TYPE_SCROLL, now, {
					y: curY
				});

				lastYLogged = curY;
			}

			// update the interaction monitor
			i.interact("scroll", now, e);

			// calculate percentage of document scrolled
			intervalScrollPct += Math.round(diffY / documentHeight * 100);
			totalScrollPct += Math.round(diffY / documentHeight * 100);

			lastY = curY;
		}

		/**
		 * Reports on the number of scrolls seen
		 */
		function reportScroll() {
			var pct = Math.min(intervalScrollPct, 100);

			if (pct !== 0) {
				t.set("scrollpct", pct);
			}

			// reset count
			intervalScrollPct = 0;
		}

		/**
		 * Analyzes Scrolling events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.s", externalMetrics.scrollCount());
			impl.addToBeacon("c.s.p", externalMetrics.scrollPct());
			impl.addToBeacon("c.s.y", externalMetrics.scrollPixels());
			impl.addToBeacon("c.s.d", externalMetrics.scrollDistinct());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			if (collectionInterval) {
				clearInterval(collectionInterval);

				collectionInterval = false;
			}

			BOOMR.utils.removeListener(w, "scroll", onScroll);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			totalScrollPct = 0;
			scrollCount = 0;
			scrollPixels = 0;
			distinctScrollCount = 0;
		}

		//
		// External metrics
		//

		/**
		 * Percentage of the screen that was scrolled.
		 *
		 * All the way to the bottom = 100%
		 */
		externalMetrics.scrollPct = function() {
			return totalScrollPct;
		};

		/**
		 * Number of scrolls
		 */
		externalMetrics.scrollCount = function() {
			return scrollCount;
		};

		/**
		 * Number of scrolls (more than two seconds apart)
		 */
		externalMetrics.scrollDistinct = function() {
			return distinctScrollCount;
		};

		/**
		 * Number of pixels scrolled
		 */
		externalMetrics.scrollPixels = function() {
			return scrollPixels;
		};

		// startup
		BOOMR.utils.addListener(w, "scroll", onScroll, true);

		collectionInterval = setInterval(reportScroll, COLLECTION_INTERVAL);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors mouse clicks
	 *
	 * @class BOOMR.plugins.Continuity.ClickMonitor
	 */
	var ClickMonitor = function(w, t, i) {
		// register this type
		t.register("click", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		// number of pixels area for Rage Clicks
		var PIXEL_AREA = 10;

		// number of clicks in the same area to trigger a Rage Click
		var RAGE_CLICK_THRESHOLD = 3;

		//
		// Local Members
		//

		// number of click events
		var clickCount = 0;

		// number of clicks in the same PIXEL_AREA area
		var sameClicks = 0;

		// number of Rage Clicks
		var rageClicks = 0;

		// last coordinates
		var x = 0;
		var y = 0;

		// last click target
		var lastTarget = null;

		/**
		 * Fired when a `click` event happens.
		 *
		 * @param {Event} e Event
		 */
		function onClick(e) {
			var now = BOOMR.now();

			var newX = e.clientX;
			var newY = e.clientY;

			// track total number of clicks
			clickCount++;

			// calculate number of pixels moved
			var pixels = Math.round(
				Math.sqrt(Math.pow(y - newY, 2) +
				Math.pow(x - newX, 2)));

			// track Rage Clicks
			if (lastTarget === e.target || pixels <= PIXEL_AREA) {
				sameClicks++;

				if ((sameClicks + 1) >= RAGE_CLICK_THRESHOLD) {
					rageClicks++;

					// notify any listeners
					BOOMR.fireEvent("rage_click", e);
				}
			}
			else {
				sameClicks = 0;
			}

			// track last click coordinates and element
			x = newX;
			y = newY;
			lastTarget = e.target;

			// update the timeline
			t.increment("click");

			// add to the log
			t.log(LOG_TYPE_CLICK, now, {
				x: newX,
				y: newY
			});

			// update the interaction monitor
			i.interact("click", now, e);
		}

		/**
		 * Analyzes Click events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.c", externalMetrics.clicksCount());
			impl.addToBeacon("c.c.r", externalMetrics.clicksRage());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			BOOMR.utils.removeListener(w.document, "click", onClick);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			clickCount = 0;
			sameClicks = 0;
			rageClicks = 0;
		}

		//
		// External metrics
		//
		externalMetrics.clicksCount = function() {
			return clickCount;
		};

		externalMetrics.clicksRage = function() {
			return rageClicks;
		};

		//
		// Startup
		//
		BOOMR.utils.addListener(w.document, "click", onClick, true);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors keyboard events
	 *
	 * @class BOOMR.plugins.Continuity.KeyMonitor
	 */
	var KeyMonitor = function(w, t, i) {
		// register this type
		t.register("key", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Local members
		//

		// key presses
		var keyCount = 0;

		// esc key presses
		var escKeyCount = 0;

		/**
		 * Fired on key down
		 *
		 * @param {Event} e keydown event
		 */
		function onKeyDown(e) {
			var now = BOOMR.now();

			keyCount++;

			if (e.keyCode === 27) {
				escKeyCount++;
			}

			// update the timeline
			t.increment("key");

			// add to the log (don't track the actual keys)
			t.log(LOG_TYPE_KEY, now);

			// update the interaction monitor
			i.interact("key", now, e);
		}

		/**
		 * Analyzes Key events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.k", externalMetrics.keyCount());
			impl.addToBeacon("c.k.e", externalMetrics.keyEscapes());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			BOOMR.utils.removeListener(w.document, "keydown", onKeyDown);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			keyCount = 0;
			escKeyCount = 0;
		}

		//
		// External metrics
		//
		externalMetrics.keyCount = function() {
			return keyCount;
		};

		externalMetrics.keyEscapes = function() {
			return escKeyCount;
		};

		// start
		BOOMR.utils.addListener(w.document, "keydown", onKeyDown, true);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors mouse movement
	 *
	 * @class BOOMR.plugins.Continuity.MouseMonitor
	 */
	var MouseMonitor = function(w, t, i) {
		// register the mouse movements and overall percentage moved
		t.register("mouse", COMPRESS_MODE_SMALL_NUMBERS);
		t.register("mousepct", COMPRESS_MODE_PERCENT);

		//
		// Constants
		//

		/**
		 * Minimum number of pixels that change from last before logging
		 */
		var MIN_LOG_PIXEL_CHANGE = 10;

		/**
		 * Mouse log interval
		 */
		var REPORT_LOG_INTERVAL = 250;

		//
		// Local members
		//

		// last movement coordinates
		var lastX = 0;
		var lastY = 0;

		// last reported X/Y
		var lastLogX = 0;
		var lastLogY = 0;

		// mouse move screen percent this interval
		var intervalMousePct = 0;

		// total mouse move percent
		var totalMousePct = 0;

		// total mouse move pixels
		var totalMousePixels = 0;

		// interval ids
		var reportMousePctInterval = false;
		var reportMouseLogInterval = false;

		// screen pixel count
		var screenPixels = Math.round(Math.sqrt(
			Math.pow(BOOMR.utils.windowHeight(), 2) +
			Math.pow(BOOMR.utils.windowWidth(), 2)));

		/**
		 * Fired when a `mousemove` event happens.
		 *
		 * @param {Event} e Event
		 */
		function onMouseMove(e) {
			var now = BOOMR.now();

			var newX = e.clientX;
			var newY = e.clientY;

			// calculate number of pixels moved
			var pixels = Math.round(Math.sqrt(Math.pow(lastY - newY, 2) +
			                        Math.pow(lastX - newX, 2)));

			// calculate percentage of screen moved (upper-left to lower-right = 100%)
			var newPct = Math.round(pixels / screenPixels * 100);
			intervalMousePct += newPct;
			totalMousePct += newPct;
			totalMousePixels += pixels;

			lastX = newX;
			lastY = newY;

			// Note: don't mark a mouse movement as an interaction (i.interact)

			t.increment("mouse", pixels);
		}

		/**
		 * Reports on the mouse percentage change
		 */
		function reportMousePct() {
			var pct = Math.min(intervalMousePct, 100);

			if (pct !== 0) {
				t.set("mousepct", pct);
			}

			// reset count
			intervalMousePct = 0;
		}

		/**
		 * Updates the log if the mouse has moved enough
		 */
		function reportMouseLog() {
			// Only log if X,Y have changed and have changed over the specified
			// minimum theshold.
			if (lastLogX !== lastX ||
			    lastLogY !== lastY) {
				var pixels = Math.round(Math.sqrt(Math.pow(lastLogY - lastY, 2) +
										Math.pow(lastLogX - lastX, 2)));

				if (pixels >= MIN_LOG_PIXEL_CHANGE) {
					// add to the log
					t.log(LOG_TYPE_MOUSE, BOOMR.now(), {
						x: lastX,
						y: lastY
					});

					lastLogX = lastX;
					lastLogY = lastY;
				}
			}
		}

		/**
		 * Analyzes Mouse events
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.m.p", externalMetrics.mousePct());
			impl.addToBeacon("c.m.n", externalMetrics.mousePixels());
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			if (reportMousePctInterval) {
				clearInterval(reportMousePctInterval);

				reportMousePctInterval = false;
			}

			if (reportMouseLogInterval) {
				clearInterval(reportMouseLogInterval);

				reportMouseLogInterval = false;
			}

			BOOMR.utils.removeListener(w.document, "mousemove", onMouseMove);
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			totalMousePct = 0;
			totalMousePixels = 0;
		}

		//
		// External metrics
		//

		/**
		 * Percentage the mouse moved
		 */
		externalMetrics.mousePct = function() {
			return totalMousePct;
		};

		/**
		 * Pixels the mouse moved
		 */
		externalMetrics.mousePixels = function() {
			return totalMousePixels;
		};

		reportMousePctInterval = setInterval(reportMousePct, COLLECTION_INTERVAL);
		reportMouseLogInterval = setInterval(reportMouseLog, REPORT_LOG_INTERVAL);

		// start
		BOOMR.utils.addListener(w.document, "mousemove", onMouseMove, true);

		return {
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Interaction monitor
	 *
	 * @class BOOMR.plugins.Continuity.InteractionMonitor
	 */
	var InteractionMonitor = function(w, t, afterOnloadMinWait) {
		// register this type
		t.register("inter", COMPRESS_MODE_SMALL_NUMBERS);
		t.register("interdly", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		/**
		 * Interaction maximum delay (ms)
		 */
		var INTERACTION_MAX_DELAY = 50;

		/**
		 * How long after an interaction to wait before sending a beacon (ms).
		 */
		var INTERACTION_MIN_WAIT_FOR_BEACON = afterOnloadMinWait;

		/**
		 * Maximum amount of time after the first interaction before sending
		 * a beacon (ms).
		 */
		var INTERACTION_MAX_WAIT_FOR_BEACON = 30000;

		//
		// Local Members
		//

		// Time of first interaction
		var timeToFirstInteraction = 0;

		// First Input Delay
		var firstInputDelay = null;

		// Interaction count
		var interactions = 0;

		// Interaction delay total
		var interactionsDelay = 0;

		// Delayed interactions
		var delayedInteractions = 0;

		// Delayed interaction time
		var delayedInteractionTime = 0;

		// whether or not we're enabled
		var enabled = true;

		// interaction beacon start time
		var beaconStartTime = 0;

		// interaction beacon end time
		var beaconEndTime = 0;

		// interaction beacon timers
		var beaconMinTimeout = false;
		var beaconMaxTimeout = false;

		// whether or not a SPA nav is happening
		var isSpaNav = false;

		/**
		 * Logs an interaction
		 *
		 * @param {string} type Interaction type
		 * @param {number} now Time of callback
		 * @param {Event} e Event
		 */
		function interact(type, now, e) {
			now = now || BOOMR.now();

			if (!enabled) {
				return;
			}

			interactions++;

			if (!timeToFirstInteraction) {
				timeToFirstInteraction = now;
			}

			// check for interaction delay
			var delay = 0;
			if (e && e.timeStamp) {
				if (e.timeStamp > 1400000000000) {
					delay = now - e.timeStamp;
				}
				else {
					// if timeStamp is a DOMHighResTimeStamp, convert BOOMR.now() to same
					delay = (now - epoch) - e.timeStamp;
				}

				interactionsDelay += delay;

				// log first input delay
				if (firstInputDelay === null) {
					firstInputDelay = Math.round(delay);
				}

				// log as a delayed interaction
				if (delay > INTERACTION_MAX_DELAY) {
					t.increment("interdly");

					delayedInteractions++;
					delayedInteractionTime += delay;
				}
			}

			// increment the FPS
			t.increment("inter");

			//
			// If we're doing after-page-load monitoring, start a timer to report
			// on this interaction.  We will wait up to INTERACTION_MIN_WAIT_FOR_BEACON
			// ms before sending the beacon, sliding the window if there are
			// more interactions, up to a max of INTERACTION_MAX_WAIT_FOR_BEACON ms.
			//
			if (!isSpaNav && impl.afterOnloadMonitoring) {
				// mark now as the latest interaction
				beaconEndTime = BOOMR.now();

				if (!beaconStartTime) {
					debug("Interaction detected, sending a beacon after " +
						INTERACTION_MIN_WAIT_FOR_BEACON + " ms");

					// first interaction for this beacon
					beaconStartTime = beaconEndTime;

					// set a timer for the max timeout
					beaconMaxTimeout = setTimeout(sendInteractionBeacon,
						INTERACTION_MAX_WAIT_FOR_BEACON);
				}

				// if there was a timer for the min timeout, clear it first
				if (beaconMinTimeout) {
					debug("Clearing previous interaction timeout");

					clearTimeout(beaconMinTimeout);
					beaconMinTimeout = false;
				}

				// set a timer for the min timeout
				beaconMinTimeout = setTimeout(sendInteractionBeacon,
					INTERACTION_MIN_WAIT_FOR_BEACON);
			}
		}

		/**
		 * Fired on spa_init
		 */
		function onSpaInit() {
			// note we're in a SPA nav right now
			isSpaNav = true;

			// clear any interaction beacon timers
			clearBeaconTimers();
		}

		/**
		 * Clears interaction beacon timers.
		 */
		function clearBeaconTimers() {
			if (beaconMinTimeout) {
				clearTimeout(beaconMinTimeout);
				beaconMinTimeout = false;
			}

			if (beaconMaxTimeout) {
				clearTimeout(beaconMaxTimeout);
				beaconMaxTimeout = false;
			}
		}

		/**
		 * Fired when an interaction beacon timed-out
		 */
		function sendInteractionBeacon() {
			debug("Sending interaction beacon");

			clearBeaconTimers();

			// notify anyone listening for an interaction event
			BOOMR.fireEvent("interaction");

			// add data to the beacon
			impl.addToBeacon("rt.tstart", beaconStartTime);
			impl.addToBeacon("rt.end", beaconEndTime);
			impl.addToBeacon("rt.start", "manual");
			impl.addToBeacon("http.initiator", "interaction");

			BOOMR.sendBeacon();
		}

		/**
		 * Analyzes Interactions
		 */
		function analyze(startTime) {
			impl.addToBeacon("c.ttfi", externalMetrics.timeToFirstInteraction());
			impl.addToBeacon("c.i.dc", externalMetrics.interactionDelayed());
			impl.addToBeacon("c.i.dt", externalMetrics.interactionDelayedTime());
			impl.addToBeacon("c.i.a", externalMetrics.interactionAvgDelay());

			if (firstInputDelay !== null) {
				impl.addToBeacon("c.fid", externalMetrics.firstInputDelay(), true);
			}
		}

		/**
		 * Disables the monitor
		 */
		function stop() {
			enabled = false;
		}

		/**
		 * Resets on beacon
		 */
		function onBeacon() {
			delayedInteractionTime = 0;
			delayedInteractions = 0;
			interactions = 0;
			interactionsDelay = 0;

			beaconStartTime = 0;
			beaconEndTime = 0;

			// no longer in a SPA nav
			isSpaNav = false;

			// if we had queued an interaction beacon, but something else is
			// firing instead, use that data
			clearBeaconTimers();
		}

		//
		// External metrics
		//
		externalMetrics.interactionDelayed = function() {
			return delayedInteractions;
		};

		externalMetrics.interactionDelayedTime = function() {
			return Math.round(delayedInteractionTime);
		};

		externalMetrics.interactionAvgDelay = function() {
			if (interactions > 0) {
				return Math.round(interactionsDelay / interactions);
			}
		};

		externalMetrics.timeToFirstInteraction = function() {
			if (timeToFirstInteraction) {
				// milliseconds since nav start
				return timeToFirstInteraction - epoch;
			}

			// no data
			return;
		};

		externalMetrics.firstInputDelay = function() {
			if (firstInputDelay !== null) {
				return firstInputDelay;
			}

			// no data
			return;
		};

		//
		// Setup
		//

		// clear interaction beacon timer if a SPA is starting
		BOOMR.subscribe("spa_init", onSpaInit, null, impl);

		return {
			interact: interact,
			analyze: analyze,
			stop: stop,
			onBeacon: onBeacon
		};
	};

	/**
	 * Monitors for visibility state changes
	 *
	 * @class BOOMR.plugins.Continuity.VisibilityMonitor
	 */
	var VisibilityMonitor = function(w, t, i) {
		// register this type
		t.register("vis", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		/**
		 * Maps visibilityState from a string to a number
		 */
		var VIS_MAP = {
			"visible": 0,
			"hidden": 1,
			"prerender": 2,
			"unloaded": 3
		};

		//
		// Locals
		//
		var enabled = true;

		BOOMR.subscribe("visibility_changed", function(e) {
			var now = BOOMR.now();

			if (!enabled) {
				return;
			}

			// update the timeline
			t.increment("vis");

			// add to the log (don't track the actual keys)
			t.log(LOG_TYPE_VIS, now, {
				s: VIS_MAP[BOOMR.visibilityState()]
			});

			// update the interaction monitor
			i.interact("vis", now, e);
		});

		/**
		 * Stops this monitor
		 */
		function stop() {
			enabled = false;
		}

		return {
			stop: stop
		};
	};

	/**
	 * Monitors for orientation changes
	 *
	 * @class BOOMR.plugins.Continuity.OrientationMonitor
	 */
	var OrientationMonitor = function(w, t, i) {
		// register this type
		t.register("orn", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Locals
		//
		var enabled = true;

		/**
		 * Fired when the orientation changes
		 *
		 * @param {Event} e Event
		 */
		function onOrientationChange(e) {
			var now = BOOMR.now(), angle = window.orientation;

			if (!enabled) {
				return;
			}

			// update the timeline
			t.increment("orn");

			var orientation = window.screen && (screen.msOrientation || (screen.orientation || screen.mozOrientation || {}));

			// override with Screen Orientation API if available
			if (orientation && typeof orientation.angle === "number") {
				angle = screen.orientation.angle;
			}

			if (typeof angle === "number") {
				// add to the log (don't track the actual keys)
				t.log(LOG_TYPE_ORIENTATION, now, {
					a: angle
				});
			}

			// update the interaction monitor
			i.interact("orn", now, e);
		}

		/**
		 * Stops this monitor
		 */
		function stop() {
			enabled = false;

			BOOMR.utils.removeListener(w, "orientationchange", onOrientationChange);
		}

		//
		// Setup
		//
		BOOMR.utils.addListener(w, "orientationchange", onOrientationChange, true);

		return {
			stop: stop
		};
	};

	/**
	 * Monitors for misc stats such as memory usage, battery level, etc.
	 *
	 * Note: Not reporting on ResourceTiming entries or Errors since those
	 * will be captured by the respective plugins.
	 *
	 * @class BOOMR.plugins.Continuity.StatsMonitor
	 */
	var StatsMonitor = function(w, t) {
		// register types
		t.register("mem", COMPRESS_MODE_LARGE_NUMBERS, true);
		t.register("bat", COMPRESS_MODE_PERCENT, true);
		t.register("domsz", COMPRESS_MODE_LARGE_NUMBERS, true);
		t.register("domln", COMPRESS_MODE_LARGE_NUMBERS, true);
		t.register("mut", COMPRESS_MODE_SMALL_NUMBERS);

		//
		// Constants
		//

		/**
		 * Report stats every second
		 */
		var REPORT_INTERVAL = 1000;

		//
		// Locals
		//
		var d = w.document;

		/**
		 * Whether or not we're enabled
		 */
		var enabled = true;

		/**
		 * Report interval ID
		 */
		var reportInterval = false;

		/**
		 * navigator.getBattery() object
		 */
		var battery = null;

		/**
		 * Number of mutations since last reset
		 */
		var mutationCount = 0;

		/**
		 * DOM length
		 */
		var domLength = 0;

		/**
		 * Live HTMLCollection of found elements
		 *
		 * Keep this live collection around as it's cheaper to call
		 * .length on it over time than re-running getElementsByTagName()
		 * each time
		 */
		var domAllNodes = d.getElementsByTagName("*");

		/**
		 * MutationObserver
		 */
		var observer;

		/**
		 * Fired on an interval to report stats such as memory usage
		 */
		function reportStats() {
			//
			// Memory
			//
			var mem = p &&
			    p.memory &&
			    p.memory.usedJSHeapSize;

			if (mem) {
				t.set("mem", mem);
			}

			//
			// DOM sizes (bytes) and length (node count)
			//
			domLength = domAllNodes.length;

			t.set("domsz", d.documentElement.innerHTML.length);
			t.set("domln", domLength);

			//
			// DOM mutations
			//
			if (mutationCount > 0) {
				// report as % of DOM size
				var deltaPct = Math.min(Math.round(mutationCount / domLength * 100), 100);

				t.set("mut", deltaPct);

				mutationCount = 0;
			}
		}

		/**
		 * Fired when the battery level changes
		 */
		function onBatteryLevelChange() {
			if (!enabled || !battery) {
				return;
			}

			t.set("bat", battery.level);
		}

		/**
		 * Fired on MutationObserver callback
		 */
		function onMutationObserver(mutations) {
			mutations.forEach(function(mutation) {
				// only listen for childList changes
				if (mutation.type !== "childList") {
					return;
				}

				for (var i = 0; i < mutation.addedNodes.length; i++) {
					var node = mutation.addedNodes[i];

					// add mutations for this node and all sub-nodes
					mutationCount++;
					mutationCount += node.getElementsByTagName ?
						node.getElementsByTagName("*").length : 0;
				}
			});
		}

		/**
		 * Stops this monitor
		 */
		function stop() {
			enabled = false;

			// stop reporting on metrics
			if (reportInterval) {
				clearInterval(reportInterval);
				reportInterval = false;
			}

			// disconnect MO
			if (observer) {
				observer.disconnect();
			}

			// stop listening for battery info
			if (battery && battery.onlevelchange) {
				battery.onlevelchange = null;
			}

			domAllNodes = null;
		}

		//
		// Setup
		//

		// misc stats
		reportInterval = setInterval(reportStats, REPORT_INTERVAL);

		// Battery
		if (w.navigator && typeof w.navigator.getBattery === "function") {
			w.navigator.getBattery().then(function(b) {
				battery = b;

				if (battery.onlevelchange) {
					battery.onlevelchange = onBatteryLevelChange;
				}
			});
		}

		// MutationObserver
		if (BOOMR.utils.isMutationObserverSupported()) {
			observer = new w.MutationObserver(onMutationObserver);

			// configure the observer
			observer.observe(d, { childList: true, subtree: true });
		}

		return {
			stop: stop
		};
	};

	//
	// Continuity implementation
	//
	impl = {
		//
		// Config
		//
		/**
		 * Whether or not to monitor longTasks
		 */
		monitorLongTasks: true,

		/**
		 * Whether or not to monitor Page Busy
		 */
		monitorPageBusy: true,

		/**
		 * Whether or not to monitor FPS
		 */
		monitorFrameRate: true,

		/**
		 * Whether or not to monitor interactions
		 */
		monitorInteractions: true,

		/**
		 * Whether or not to monitor page stats
		 */
		monitorStats: true,

		/**
		 * Whether to monitor for interactions after onload
		 */
		afterOnload: false,

		/**
		 * Max recording length after onload (if not a SPA) (ms)
		 */
		afterOnloadMaxLength: DEFAULT_AFTER_ONLOAD_MAX_LENGTH,

		/**
		 * Minium number of ms after an interaction to wait before sending
		 * an interaction beacon
		 */
		afterOnloadMinWait: 5000,

		/**
		 * Number of milliseconds after onload to wait for TTI, or,
		 * false if not configured.
		 */
		waitAfterOnload: false,

		/**
		 * Whether or not to wait for a call to
		 * frameworkReady() before starting TTI calculations
		 */
		ttiWaitForFrameworkReady: false,

		/**
		 * If set, wait for the specified CSS selector of hero images to have
		 * loaded before starting TTI calculations
		 */
		ttiWaitForHeroImages: false,

		/**
		 * Whether or not to send a detailed log of all events.
		 */
		sendLog: true,

		/**
		 * Whether or not to send a compressed timeline of events
		 */
		sendTimeline: true,

		/**
		 * Maximum number of long entries to keep
		 */
		logMaxEntries: 100,

		//
		// State
		//
		/**
		 * Whether or not we're initialized
		 */
		initialized: false,

		/**
		 * Whether we're ready to send a beacon
		 */
		complete: false,

		/**
		 * Whether or not this is an SPA app
		 */
		isSpa: false,

		/**
		 * Whether Page Ready has fired or not
		 */
		firedPageReady: false,

		/**
		 * Whether or not we're currently monitoring for interactions
		 * after the Page Load beacon
		 */
		afterOnloadMonitoring: false,

		/**
		 * Framework Ready time, if configured
		 */
		frameworkReady: null,

		/**
		 * Timeline
		 */
		timeline: null,

		/**
		 * TTI method used (highest accuracy):
		 * * `lt` (LongTasks)
		 * * `raf` (requestAnimationFrame)
		 * * `b` (Page Busy polling)
		 */
		ttiMethod: null,

		/**
		 * LongTaskMonitor
		 */
		longTaskMonitor: null,

		/**
		 * PageBusyMonitor
		 */
		pageBusyMonitor: null,

		/**
		 * FrameRateMonitor
		 */
		frameRateMonitor: null,

		/**
		 * InteractionMonitor
		 */
		interactionMonitor: null,

		/**
		 * ScrollMontior
		 */
		scrollMonitor: null,

		/**
		 * ClickMonitor
		 */
		clickMonitor: null,

		/**
		 * KeyMonitor
		 */
		keyMonitor: null,

		/**
		 * MouseMonitor
		 */
		mouseMonitor: null,

		/**
		 * VisibilityMonitor
		 */
		visibilityMonitor: null,

		/**
		 * OrientationMonitor
		 */
		orientationMonitor: null,

		/**
		 * StatsMonitor
		 */
		statsMonitor: null,

		/**
		 * Vars we added to the beacon
		 */
		addedVars: [],

		/**
		 * All possible monitors
		 */
		monitors: [
			"timeline",
			"longTaskMonitor",
			"pageBusyMonitor",
			"frameRateMonitor",
			"scrollMonitor",
			"keyMonitor",
			"clickMonitor",
			"mouseMonitor",
			"interactionMonitor",
			"visibilityMonitor",
			"orientationMonitor",
			"statsMonitor"
		],

		/**
		 * When we last sent a beacon
		 */
		timeOfLastBeacon: 0,

		/**
		 * Whether or not we've added data to this beacon
		 */
		hasAddedDataToBeacon: false,

		//
		// Callbacks
		//
		/**
		 * Callback before the beacon is going to be sent
		 */
		onBeforeBeacon: function() {
			impl.runAllAnalyzers();
		},

		/**
		 * Runs all analyzers
		 */
		runAllAnalyzers: function() {
			var i, mon;

			if (impl.hasAddedDataToBeacon) {
				// don't add data twice
				return;
			}

			for (i = 0; i < impl.monitors.length; i++) {
				mon = impl[impl.monitors[i]];

				if (mon && typeof mon.analyze === "function") {
					mon.analyze(impl.timeOfLastBeacon);
				}
			}

			// add last time the data was reset, if ever
			impl.addToBeacon("c.lb", impl.timeOfLastBeacon ? impl.timeOfLastBeacon.toString(36) : 0);

			// keep track of when we last added data
			impl.timeOfLastBeacon = BOOMR.now();

			// note we've added data
			impl.hasAddedDataToBeacon = true;
		},

		/**
		 * Callback after the beacon is ready to send, so we can clear
		 * our added vars and do other cleanup.
		 */
		onBeacon: function() {
			var i;

			// remove added vars
			if (impl.addedVars && impl.addedVars.length > 0) {
				BOOMR.removeVar(impl.addedVars);

				impl.addedVars = [];
			}

			// let any other monitors know that a beacon was sent
			for (i = 0; i < impl.monitors.length; i++) {
				var monitor = impl[impl.monitors[i]];

				if (monitor) {
					// disable ourselves if we're not doing anything after the first beacon
					if (!impl.afterOnload) {
						if (typeof monitor.stop === "function") {
							monitor.stop();
						}
					}

					// notify all plugins that there's been a beacon
					if (typeof monitor.onBeacon === "function") {
						monitor.onBeacon();
					}
				}
			}

			// we haven't added data any more
			impl.hasAddedDataToBeacon = false;
		},

		/**
		 * Callback when an XHR load happens
		 *
		 * @param {object} data XHR data
		 */
		onXhrLoad: function(data) {
			// note this is an SPA for later
			if (data && BOOMR.utils.inArray(data.initiator, BOOMR.constants.BEACON_TYPE_SPAS)) {
				impl.isSpa = true;
			}

			if (data && data.initiator === "spa_hard") {
				impl.onPageReady();
			}
		},

		/**
		 * Callback when the page is ready
		 */
		onPageReady: function() {
			impl.firedPageReady = true;

			//
			// If we're monitoring interactions after onload, set a timer to
			// disable them if configured
			//
			if (impl.afterOnload &&
			    impl.monitorInteractions) {
				impl.afterOnloadMonitoring = true;

				// disable after the specified amount if not a SPA
				if (!impl.isSpa && typeof impl.afterOnloadMaxLength === "number") {
					setTimeout(function() {
						impl.afterOnloadMonitoring = false;
					}, impl.afterOnloadMaxLength);
				}
			}

			if (impl.waitAfterOnload) {
				var start = BOOMR.now();

				setTimeout(function checkTti() {
					// wait for up to the defined time after onload
					if (BOOMR.now() - start > impl.waitAfterOnload) {
						// couldn't calculate TTI, send the beacon anyways
						impl.complete = true;
						BOOMR.sendBeacon();
					}
					else {
						// run the TTI calculation
						impl.timeline.analyze();

						// if we got something, mark as complete and send
						if (externalMetrics.timeToInteractive()) {
							impl.complete = true;
							BOOMR.sendBeacon();
						}
						else {
							// poll again
							setTimeout(checkTti, TIME_TO_INTERACTIVE_WAIT_POLL_PERIOD);
						}
					}
				}, TIME_TO_INTERACTIVE_WAIT_POLL_PERIOD);
			}
			else {
				impl.complete = true;
			}
		},

		//
		// Misc
		//
		/**
		 * Adds a variable to the beacon, tracking the names so we can
		 * remove them later.
		 *
		 * @param {string} name Name
		 * @param {string} val Value.  If 0 or undefined, the value is removed from the beacon.
		 * @param {number} force Force adding the variable, even if 0
		 */
		addToBeacon: function(name, val, force) {
			if ((val === 0 || typeof val === "undefined") && !force) {
				BOOMR.removeVar(name);
				return;
			}

			BOOMR.addVar(name, val);

			impl.addedVars.push(name);
		}
	};

	//
	// External Plugin
	//
	BOOMR.plugins.Continuity = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {boolean} [config.Continuity.monitorLongTasks=true] Whether or not to
		 * monitor Long Tasks.
		 * @param {boolean} [config.Continuity.monitorPageBusy=true] Whether or not to
		 * monitor Page Busy.
		 * @param {boolean} [config.Continuity.monitorFrameRate=true] Whether or not to
		 * monitor Frame Rate.
		 * @param {boolean} [config.Continuity.monitorInteractions=true] Whether or not to
		 * monitor Interactions.
		 * @param {boolean} [config.Continuity.monitorStats=true] Whether or not to
		 * monitor Page Statistics.
		 * @param {boolean} [config.Continuity.afterOnload=true] Whether or not to
		 * monitor Long Tasks, Page Busy, Frame Rate, interactions and Page Statistics
		 * after `onload` (up to `afterOnloadMaxLength`).
		 * @param {number} [config.Continuity.afterOnloadMaxLength=60000] Maximum time
		 * (milliseconds) after `onload` to monitor.
		 * @param {boolean} [config.Continuity.afterOnloadMinWait=5000] Minimum
		 * time after an interaction to wait for more interactions before batching
		 * the interactions into a beacon.
		 * @param {boolean|number} [config.Continuity.waitAfterOnload=false] If set
		 * to a `number`, how long after `onload` to wait for Time to Interactive to
		 * happen before sending a beacon (without TTI).
		 * @param {boolean} [config.Continuity.ttiWaitForFrameworkReady=false] Whether
		 * or not to wait for {@link BOOMR.plugins.Continuity.frameworkReady} before
		 * Visually Ready (and thus Time to Interactive) can happen.
		 * @param {boolean|string} [config.Continuity.ttiWaitForHeroImages=false] If
		 * set to a `string`, the CSS selector will wait until the specified images
		 * have been loaded before Visually Ready (and thus Time to Interactive) can happen.
		 * @param {boolean} [config.Continuity.sendLog=true] Whether or not to
		 * send the event log with each beacon.
		 * @param {boolean} [config.Continuity.logMaxEntries=100] How many log
		 * entries to keep.
		 * @param {boolean} [config.Continuity.sendTimeline=true] Whether or not to
		 * send the timeline with each beacon.
		 *
		 * @returns {@link BOOMR.plugins.Continuity} The Continuity plugin for chaining
		 * @memberof BOOMR.plugins.Continuity
		 */
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "Continuity",
				["monitorLongTasks", "monitorPageBusy", "monitorFrameRate", "monitorInteractions",
					"monitorStats", "afterOnload", "afterOnloadMaxLength", "afterOnloadMinWait",
					"waitAfterOnload", "ttiWaitForFrameworkReady", "ttiWaitForHeroImages",
					"sendLog", "logMaxEntries", "sendTimeline"]);

			if (impl.initialized) {
				return this;
			}

			impl.initialized = true;

			// create the timeline
			impl.timeline = new Timeline(BOOMR.now());

			//
			// Setup
			//
			if (BOOMR.window) {
				//
				// LongTasks
				//
				if (impl.monitorLongTasks &&
				    BOOMR.window.PerformanceObserver &&
				    BOOMR.window.PerformanceLongTaskTiming) {
					impl.longTaskMonitor = new LongTaskMonitor(BOOMR.window, impl.timeline);

					impl.ttiMethod = "lt";
				}

				//
				// FPS
				//
				if (impl.monitorFrameRate &&
				    typeof BOOMR.window.requestAnimationFrame === "function") {
					impl.frameRateMonitor = new FrameRateMonitor(BOOMR.window, impl.timeline);

					if (!impl.ttiMethod) {
						impl.ttiMethod = "raf";
					}
				}

				//
				// Page Busy (if LongTasks aren't supported or aren't enabled)
				//
				if (impl.monitorPageBusy &&
					(!BOOMR.window.PerformanceObserver || !BOOMR.window.PerformanceLongTaskTiming || !impl.monitorLongTasks)) {
					impl.pageBusyMonitor = new PageBusyMonitor(BOOMR.window, impl.timeline);

					if (!impl.ttiMethod) {
						impl.ttiMethod = "b";
					}
				}

				//
				// Interactions
				//
				if (impl.monitorInteractions) {
					impl.interactionMonitor = new InteractionMonitor(BOOMR.window, impl.timeline, impl.afterOnloadMinWait);
					impl.scrollMonitor = new ScrollMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.keyMonitor = new KeyMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.clickMonitor = new ClickMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.mouseMonitor = new MouseMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.visibilityMonitor = new VisibilityMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
					impl.orientationMonitor = new OrientationMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
				}

				//
				// Stats
				//
				if (impl.monitorStats) {
					impl.statsMonitor = new StatsMonitor(BOOMR.window, impl.timeline, impl.interactionMonitor);
				}
			}

			// add epoch and polling method to every beacon
			BOOMR.addVar("c.e", epoch.toString(36));
			BOOMR.addVar("c.tti.m", impl.ttiMethod);

			// event handlers
			BOOMR.subscribe("before_beacon", impl.onBeforeBeacon, null, impl);
			BOOMR.subscribe("beacon", impl.onBeacon, null, impl);
			BOOMR.subscribe("page_ready", impl.onPageReady, null, impl);
			BOOMR.subscribe("xhr_load", impl.onXhrLoad, null, impl);

			return this;
		},

		/**
		 * Whether or not this plugin is complete
		 *
		 * @returns {boolean} `true` if the plugin is complete
		 * @memberof BOOMR.plugins.Continuity
		 */
		is_complete: function(vars) {
			// allow error beacons to go through even if we're not complete
			return impl.complete || (vars && vars["http.initiator"] === "error");
		},

		/**
		 * Signal that the framework is ready
		 *
		 * @memberof BOOMR.plugins.Continuity
		 */
		frameworkReady: function() {
			impl.frameworkReady = BOOMR.now();
		},

		// external metrics
		metrics: externalMetrics

		/* BEGIN_DEBUG */,
		compressBucketLog: compressBucketLog,
		decompressBucketLog: decompressBucketLog,
		decompressBucketLogNumber: decompressBucketLogNumber,
		decompressLog: decompressLog
		/* END_DEBUG */
	};
}());
