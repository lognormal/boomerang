# Boomerang Release Notes

## 1.650.0
### New Features:

* Issue 782: Boomerang Loader Snippet v12
* Issue 966: History: Add config option to disable monitoring of `replaceState`

### Bug Fixes:

* Issue 969: AutoXHR: Make `routeChangeWaitFilter` `wait_complete` calls wait for other pending nodes
* Issue 972: IFrameDelay: Listen for `postMessage` calls on the correct window

### Docs:

* Issue 968: Continuity: Document events for TTFI

### Tests:

* Issue 975: IFrameDelay: Force tests to load Boomerang in an IFRAME when using the snippet
* Issue 974: Grunt: Allow specifying multiple webdriver-version

## 1.643.0
### Performance Improvements:

* Issue 933: Performance: Boomerang Performance Tests
* Issue 936: Performance: Strips out `BOOMR.debug` and related messages for production builds
* Issue 937: Performance: Grunt: Use UglifyJS-3
* Issue 953: Performance: ResourceTiming: Allow for non-optimal Trie to improve performance

### Bug Fixes:

* Issue 941: AutoXHR: Track uninteresting timeout per event instead of per page
* Issue 931: AutoXHR: Cleanup listeners on observed nodes
* Issue 947: AutoXHR: Track Fetch the same way as XHR during SPA navigations
* Issue 946: AutoXHR: Track `LINK` stylesheets as interesting nodes
* Issue 943: AutoXHR: Add XHRs to pending events at send instead of load finished
* Issue 947: AutoXHR: Include Fetch requests in SPA backend time
* Issue 952: Boomerang: Ensure only a single beacon is being sent at once
* Issue 959: IFrameDelay: Gracefully handle different load orders

## 1.630.0
### Bug Fixes:

* Issue 928: SPA: Ignore route changes if a `routeChangeWaitFilter` has not yet completed
* Issue 929: History: Ignore `replaceState()` if a SPA nav is in progress and no URL change
* Issue 930: SPA: Only apply `routeFilter` and `routeChangeWaitFilter` on SPA Soft Navigations

## 1.629.0
### Bug Fixes:

* Issue 906: Cleanup leaked global vars
* Issue 907: Added `.npmignore` for OS NPM package
* Issue 908: README: Notes on download / npm / bower
* Issue 910: TPAnalytics: Add data to `spa_hard` beacons
* Issue 913: UserTiming: Update to vanilla `UserTimingCompression`
* Issue 923: Boomerang: Keep track of all unload handlers to know when to send unload
* Issue 925: AutoXHR: Don't track `<SCRIPT>` tags for XHR beacons
* OS Issue 196: Optionally depend on `usertiming-compression`
* OS Issue 218: Boomerang: Optionally send XHR with credentials
* OS Issue 219: Clicks: Fix plugin config
* OS Issue 220: SPA: Clarify `route_change` comment
* OS Issue 221: Tests: Move `webdriver-manager` from `package.json` install script to tests
* OS Issue 223: JSDoc: Clarify SPA plugin load-order requirements
* OS Issue 224: Fix issue related to screen orientation in iPhone and iPad
* OS Issue 231: Add missing bracket after "Observer effect" link
* OS Issue 236: Continuity: Update documentation of beacon parameters

## 1.626.0
### Bug Fixes:

* Issue 905: Errors / AutoXHR: Un-register wrapped functions at unload
* Issue 903: SPA: Make markNavigationComplete only apply to SPA events

## 1.624.0
### Bug Fixes:

* Issue 892: Errors: Timing issue causing page load beacon to get tagged with the error type initiator marker
* Issue 899: AutoXHR: Try to use native MutationObserver when running on a page with Zone.js

## 1.621.0
### New Features:

* Session tracking via cookies
* Issue 890: Errors: Support Reporting API warnings
* Issue 840: Errors: Monitor Unhandled PromiseRejectionEvents

### Bug Fixes:

* Issue 886: Errors: Allow `onerror` to be called with an `ErrorEvent` object
* Issue 893: Continuity: Disable `MutationObserver` usage for `monitorStats` for IE11
* Issue 895: AutoXHR: Don't track pixels or IFRAMEs that change `src`
* OS Issue 206: Fallback to use XHR if data store requires auth
* OS Issue 211: Fix `getBeaconURL()` error using AutoXHR plugin

## 1.615.0
### Bug Fixes:

* Issue 879: Protect against undefined `nodeName`
* Issue 877: Boomerang: Add beacon number param
* Issue 769: NavTiming: Don't look at `chrome.loadTimes()` if `nextHopProtocol` is empty
* Issue 883: Cookie Compression

## 1.612.0
### Bug Fixes:

* Issue 869: PaintTiming: Don't add FP/FCP if document is hidden or for SPA Soft/XHRs
* Issue 873: Continuity: Don't fail if Screen Orientation API is not supported
* Issue 876: Boomerang: Don't use polyfilled `sendBeacon()`

## 1.609.0
### Bug Fixes:

* Issue 847: Don't use the `navigator.sendBeacon` API when `beacon_type` is set to `GET`
* Issue 853: Verify that the Battery value is a valid number before adding it to the beacon
* Issue 864: SPA: Fix regression in SPA timings with `disableHardNav`
* Issue 865: AutoXHR: Fix regression in XHR monitoring for non-NT browsers
* Issue 866: AutoXHR: don't mistakenly clear `monitorFetch` flag
* Issue 863: AutoXHR: `alwaysSendXhr` accepts a function or list of strings/regexs

## 1.602.0
### Bug Fixes:

* Issue 858: Fix `localStorage` expiry time
* Issue 854: Run page ready only after config arrives
* Issue 861: If the cookie is set to null, `rt.si`, `rt.sl`, `rt.ss`, should not be written

## 1.598.0
### New Features

* Issue 851: EXPERIMENTAL: AutoXHR: Delay checking RT if fetch response body is not used

### Bug Fixes:

* Issue 850: EXPERIMENTAL: AutoXHR: Do not instrument polyfilled fetch API

### Tests:

* Issue 841: Remove CT16 'slowest' from Resource Groups

### Docs:

* Issue 820: ResourceTiming: JSDoc fixes

## 1.593.0
### New Features:

* Issue 824: EXPERIMENTAL: AutoXHR: Add Fetch API instrumentation

### Bug Fixes:

* Issue 843: AutoXHR: Handle XHRs that are aborted after `readyState` 4
* Issue 844: SPA: Fixes URL for SPA navigations after XHR beacons

## 1.590.0
### New Features:

* Issue 813: Add cookie length and `localStorage` length as beacon parameters
* Issue 818: Trap `clearResourceTimings()`

### Bug Fixes:

* Issue 835: Protect access to `localStorage` variable
* Issue 838: AutoXHR: Only save XHR request and response payloads if configured to
* Issue 817: Replace undefined parameter values with empty string in beacon query
* OS Issue 198: Fix `TypeError: undefined is not an object`

### Tests:

* Issue 828: Test server: Add support for customizable status codes in all cases
* Issue 802: Test fixes for test #111096
* Issue 839: Clean `sessionStorage` in e2e tests
* Issue 842: Fix for `11-restiming/12-clearResourceTiming`

### Docs:

* Issue 830: Continuity: Docs update for missing parameters
* Issue 836: Docs for Boomerang Tests

## 1.579.0
### New Features:

* Issue 792: Use currentSrc for images (`PICTURE` support)
* Issue 814: `SVG:IMAGE` and `srcset` support for Continuity Hero Images

### Bug Fixes:

* Issue 809: Errors: unbound `removeEventListener`
* Issue 750: History: react to `popstate` events and allow aborted beacons

## 1.571.0
### New Features:

* Issue 528: Continuity plugin

### Bug Fixes:

* Issue 804: OS Repo sync and fixes 2018
* Issue 801: Add array bounds check to `getQueryParamValue()`
* Issue 790: ResourceGroups: Run at same time as other handlers instead of at `before_beacon`
* Issue 793: Boomerang: Ensure we don't `console.log` a `BOOMR.debug` message in production
* Issue 805: Continuity: Fix busy calculation for late periods
* Issue 775: Errors: Check context in `wrapFn`
* Issue 777: Errors: Call `removeEventListener` before `addEventListener`
* Issue 784: `getMyURL()` fix for PhantomJS 1
* Issue 776: Correctly detect our url on IE using non-standard loader
* Issue 799: Move `alwaysSendXhr` into the `pluginConfig` section to make it clearer that this is an AutoXHR config

## 1.566.0 (restricted use)
### New Features:

* Issue 759: Update to new server timing header syntax

### Bug Fixes:

* Issue 774: Disable `MutationObserver` in IE 11 due to browser bugs
* Issue 761: Prevent unload confirmation popup in tests
* Issue 772: Make self url detection work when loaded in primary window as well
* Issue 756: Errors: Support capture flag in options object passed in

### Tests:

* Issue 752: Upgrade `express-middleware-server-timing`
* Issue 771: Edge, IE and Safari e2e test support
* Issue 737: Headless modern browser support (Chrome + Firefox)
* Issue 768: Improve `localStorage` tests
* Issue 767: Revive the SauceLabs code
* Issue 751: Gruntfile: Split apart build steps

## 1.552.0
### New Features:

* Issue 748: PaintTiming plugin; NavTiming: Deprecate `chrome.loadTimes()`

## 1.543.0
### New Features:

* Issue 728: Override the load end-time with `BOOMR_page_ready` or a param to `BOOMR.page_ready()`

### Bug Fixes:

* Issue 726: NavTiming: Fix `nt_nav_type`
* Issue 726: Boomerang: Add timeout to `requestIdleCallback` in `BOOMR.setImmediate`
* Issue 726: AutoXHR: fix for `IMGs` with changing `src`
* Issue 726: NavTiming: Get `msFirstPaint` only from `performance.timing`
* Issue 726: AutoXHR: When a SPA Hard beacon is ready but `onload` hasn't fired, run after other `onload` handlers
* Issue 738: Configuration for locking `beacon_url` to specific patterns
* Issue 730: Compare marks/measures to `performance.now` mark
* Issue 727: Navtiming: Fix `nt_nav_st`
* Issue 723: CrossDomain: Disable if URL is blank or whitespace
* Issue 722: Work around minification that breaks in IE8 and quirks mode
* Issue 718: Errors: Wrap `addEventListener` at the end of the protocol chain

## 1.532.0
### Bug Fixes:

* Issue 714: Fix Custom Timers for SPA navigations
* Issue 699: NavigationTiming: Don't include timestamps for events that haven't happened

## 1.527.0
### New Features:

* Issue 695: `BOOMR.sendAll()`

### Bug Fixes:

* Issue 701: CrossDomain: Validate cross-domain URL
* Issue 710: Workaround for `document.write` changing readyState after `onload`

## 1.522.0
### Bug Fixes:

* Issue 693: Add `BOOMR.utils.arrayFind` (fixes ResourceTiming in IE11)
* Issue 696: Better string checking for Boolean Custom Metrics
* Issue 700: Capture `BOOMR.page_ready()` time after `onload`; `BOOMR.addVar()` for single beacons

## 1.517.0
### New Features:

* Issue 635: ServerTiming support

### Bug Fixes:

* Issue 691: XHR Filtering: Fixes for match option
* Issue 686: Force beacons to HTTPS
* Issue 670: Handle latest netinfo spec
* Issue 671: Add `nocookie` flag if we couldn't set cookies
* Issue 678: Resource Groups: Fixes for IE 10
* Issue 685: ResourceTiming: Add `iframe` and `subdocument` to `initiatorType`
* Issue 683: CrossDomain: Abort when cross-domain URL isn't specified

## 1.511.0
### Bug Fixes:

* Issue 621: CrossDomain: Reliability fixes
* Issue 665: AutoXHR: Wait once up to 1,000ms after an uninteresting mutation
* Issue 666: `SPA.markNavigationComplete()` support

## 1.506.0
### Bug Fixes:

* Issue 663: AutoXHR: If we don't instrument XHR `open()` due to exclude filter then don't instrument `send()`
* Issue 664: AutoXHR: Do not extend the event timeout with each uninteresting mutation

## 1.500.0
### Bug Fixes:

* Issue 602: SPA: Aborted load beacons
* Issue 647: RT: Fix `t_page` and `t_resp` missing from the beacon
* Issue 648: RT: Always use `loadEventEnd` as the end load time

## 1.495.0 (restricted use)
### Bug Fixes:

* Issue 598: NavigationTiming: Add a few NavigationTiming2 fields if available
* Issue 599: ResourceGroup: Support for SPA navigations
* Issue 614: ResourceGroups: Match all CSS selector elements instead of just first one

## 1.489.0 (restricted use)
### Bug Fixes:

* Issue 624: `BOOMR.sendMetric/Timer`: Include `rt.end`
* Issue 633: `BOOMR.sendMetric/Timer`: Append session start time to `rt.si`

## 1.486.0
### Bug Fixes:

* Issue 610: BOOMR.log: Add timestamp
* Issue 612: SPA: Don't send beacons for SPA soft navs that don't change the URL and no resources are triggered
* Issue 608: ResourceTiming: Additional checks and fixes for non-supported browsers
* Issue 607: ResourceTiming: If there are no entries, ensure the parameter is `{}`
* Issue 609: Angular: Don't trigger Route Change on `$locationChangeStart` if other events fire
* Issue 618: `BOOMR.sendTimer/sendMetric`: Set the location so dimensions work properly

## 1.483.0
### Bug Fixes:

* Issue 594: AutoXHR: Don't wait for XHRs that `.open()` but don't `.send()`
* Issue 579: `BOOMR_mq` method queue
* Issue 588: Add support for delaying `page_load` beacon with instrumented iframes
* Issue OSS 139: ResTiming: Resource type filter

## 1.479.0
### Bug Fixes:

* Issue 591: `sendBeacon`: `x-www-form-urlencoded`

## 1.477.0 (restricted use)
### Bug Fixes:

* Issue 586: Don't report IE error for freed script in event and timeout handlers
* Issue 585: Angular: Track navigations when only a `$locationChangeStart` fires
* Issue 587: Miscellaneous cleanup
* Issue 577: Warn on window and document overrides (debug builds only)
* Issue 583: Don't send boomerang error on `TPAnalytics` third party errors
* Issue 559: Errors: Loader Snippet to capture errors before Boomerang arrives
* Issue 561: Errors: Re-throw caught exceptions
* Issue 563: `BOOMR.sendTimer()` / `BOOMR.sendMetric()` and `sendBeacon()` support
* Issue 582: UserTiming disabled by default
* Issue 581: Add `usertiming` feature flag
* Issue OSS 77: Plugin to beacon User Timing API mark and measure entries
* Issue 562: Minor fixes to sync with OS repo
* Issue OSS 138: Make the errors plugin work without the Compression plugin

## 1.463.1493220061
### Bug Fixes:

* Issue 570: History: Option to disable hard navigation in favor of `BOOMR.page_ready()`
* Issue 560: Errors: Include dimensions (page groups, AB, custom) on error beacons
* Issue 558: Errors: Send during `onload` if `autorun=false`
* Issue 564: AutoXHR: Fixes XHR after click missing beacon
* Issue 567: Update copyrights

## 1.452.1492175627
### Bug Fixes:

* Issue 556: Deduplicate calls to `addEventListener()` with the same arguments

## 1.451.1491334204
### Bug Fixes:

* Issue 555: Ensure we don't clobber `cross_domain_url` if it has a query param already
* Issue 557: AutoXHR: Only capture `reponseText` or `responseXML` if the type is set

## 1.449.1490889765
### Bug Fixes:

* Issue 553: Prevent Errors plugin from accessing a function of a potentially undefined error message
* Issue 547: Only use `performance.now()` if it is a native function
* Issue 554: Replace `isArray` with `hasOwnProperty` check for backward compatibility
* Issue 551: Remove calls for timepoint calculations

## 1.446.1490635326
### Bug Fixes:

* Issue 549: Fix typo in NavigationTiming (push of `undefined`)

## 1.445.1489625641
### Bug Fixes:

* Issue 525: Grunt: Re-run specific tasks
* Issue 531: Check that `scrollX` & `scrollY` are numbers
* Issue 532: Make sure `n.getBattery` is a function before calling it
* Issue 537: ResourceTiming: Ignore IE's `res:` urls
* Issue 536: Add `downlinkMax` for browsers that support it.
* Issue 533: ResourceTiming: Exports `.addResourceTimingToBeacon()`
* Issue 524: Warn on buggy `responseEnd`
* Issue 538: Normalize `cross_domain_url`
* Issue 535: Add support for `requestIdleCallback()`
* Issue 542: Gruntfile: Uglify `debug-test-min` after applying templates
* Issue 529: Add ResourceTiming timepoints
* Issue 526: History bugs and XHR beacon handling changes
* Misc: Jump to newer versions of eslint so that jenkins matches reality

## 1.435.1487783301
### Bug Fixes:

* Issue 520: Test fix
* Issue 521: Bind `forEach` contexts this to calling `mutationHandler` instance context

## 1.432.1486768074
### Bug Fixes:

* Issue 509: Adds Page ID and refactored random ID generation
* Issue 513: XHR fixes when ResourceTiming is available
* Issue 515: SPA Hard: Use `navigationStart` instead of `fetchStart` for start time
* Issue 516: SPA navigations: Remove timers from hard nav
* Issue 517: Remove `rt.sh` and `rt.srst` (Session History debug)
* Issue 519: CrossDomain: Ensure a beacon is sent, wait up to 5s for timeout
* Issue 371: Handle SVG IMAGE types
* Issue 495: Add support for PageGroups based XHR Instrumentation filters
* Issue 348: Count unique urls in `dom.img` and `dom.script`
* Issue 455: `t_page < 0` on some SPA beacons
* Issue 518: Protect against browser bugs for `t_page` and `t_resp`

## 1.429.1485448661
### Bug Fixes:

* Issue 456: Errors: Filter boomerang functions from stack in minified version
* Issue 508: Errors: `Errors.wrap`: Run `BOOMR_check_doc_domain` first

## 1.426.1484362995
### Bug Fixes:

* Issue 496: ESlint: Enable `space-in-parens`
* Issue 499: boomerang: Fix XHR Authorization check

## 1.423.1483643196
### Bug Fixes:

* Issue 479: Prevent XHR Beacons before SPA Hard if `alwaysSendXHR` not enabled
* Issue 481: SPA: Don't enable `MutationObserver` / `AutoXHR` until asked to
* Issue 483: Capture Adobe `s.purchaseID` var
* Issue 482: Add support for PageGroups based on XHR Payload
* Issue 485: Use Boomerang IFRAME XHR as backup if window XHR fails
* Issue 491: Add support for Custom Filters in AutoXHR
* Issue 497: Ensure `removeChild()` is only called when iframe exists, ensure `indexOf()`
* Issue 498: Move origin check up before parsing JSON
* Misc: Updated mocha dependency
* Misc: Update README to account for changed build procedure
* OS 112: `POST` & Auth Token Support

## 1.413.1477614597
### Bug Fixes:

* Issue 470: SPA: Recalculate SPA Hard timings before capturing ResourceTiming
* Issue 471: ResourceTiming: Ensure entries are sorted correctly so all are captured
* Issue 476: Add `rt.nstart` to to beacon
* Issue 477: Avoid IE10 / IE11 bug with `MutationObserver` and `XHR.responseXML`

## 1.407.1476482714
### New Features:

* Support for Resource Groups

### Bug Fixes:

* Issue 465: SPA Hard navigation timing calculation changes

## 1.405.1475087321
### Bug Fixes:

* Issue 451: Session length incrementing for XHR subresource beacons before `onload`
* Issue 452: Session length incrementing for Boomerang in IFRAME when `autorun=false`
* Issue 453: `scrollX` and `scrollY` undefined in IE
* Issue 477: Ensure window is available when sending a Beacon

## 1.402.1473440808
### Bug Fixes:

* Issue 434: Boomerang: Wrap `dispatchEvent()` / `fireEvent()` in `try/catch`
* Issue 440: AutoXHR: Improve tracking with multiple outstanding XHRs
* Issue 443: TPAnalytics: Skip calling `ga.getAll()` if it's not a function

## 1.400.1470878703
### Bug Fixes:

* Issue 412: BOOMR.now was always using `Date.now`
* Issue 413: Allow `XMLHttpRequest.open()` twice
* Issue 427: Add `errors-monitor-other` feature
* Issue 429: Support Classic GA and named trackers
* Issue 430: Fix xhr negative `t_page` in prerender
* Issue 431: Ensure our `MutationObserver` is created in the page's context, not our IFRAME

## 1.399.1469784094
### Bug Fixes:

* Issue 416: Fixes capturing of ResourceTiming2 sizes
* Issue 418: Sanity check Image works before using to send a beacon
* Issue 419: Ensure `r` and `r2` parameters are redacted
* Issue 420: Do not send Third Party Analytics client IDs if disabled in config
* Issue 421: Errors limit the maximum captured stack length
* Issue 422: AutoXHR: Click events should always use the URL of the fetched resource
* Issue 423: Errors: `monitorConsole` bug fixed

## 1.394.1467954210
### Bug Fixes:

* Issue 400: Wraps `removeEventListener()` to work with the wrapped functions

## 1.390.1467244673
### New Features:

* Cross-domain session tracking support
* ResourceTiming: Allow a list of URLs to trim all data from (e.g. analytics beacons)
* TPAnalytics: Add support for IBM Site Promotion Analysis and Real Estate Analysis

### Bug Fixes:

* Issue 363: Fixes bug with duplicate XHR URLs returning incorrect timing
* Issue 385: Fix for Errors plugin with `setInterval()` using string parameters
* Issue 372: ResourceTiming no longer tracks beacon URLs
* Issue 386: ResourceTiming fixes bugs for browsers that have NT but no RT support
* Issue 389: Fix missing data on pre-rendered pages when another beacon is sent before

## 1.381.1463423250
### New Features:

* TPAnalytics: Plugin captures IDs from other third-party analytics scripts

### Bug Fixes:

* Issue 357: Fixes a warning when `window.performance` doesn't exist
* Issue 374: Fixes a warning when the browser doesn't implement `getBattery()` properly
* Issue 376, 377, 378: Fixes warnings when window doesn't exist due to the page unloading
* Issue 378, 380: Fixes warnings when `JSON` doesn't exist

## 1.376.1462309808
### Bug Fixes:

* Issue 366: Fixes a bug where a beacon might not be sent if an IMG is modified several times in a Single Page App nav

## 1.371.1461863625
### New Features:

* Errors plugin: JavaScript Error Reporting
* Support for Boolean Custom Metrics
* International currency formatting support
* Large beacons (for example, those containing ResourceTiming data) are now sent using XHR instead of a FORM POST
* `scr.sxy` parameter added to the beacon (scroll X and Y in pixels at the time of the beacon)

## 1.345.1458593666
### Bugs Fixes:

* Issue 328: Fix race condition causing No Page Groups
* Issue 329: Fix for History plugin when using `auto` in custom SPA frameworks
* Issue 331: Protect against user agents that throw errors on `window.performance` access

## 1.334.1456175784
### New Features:

* XHR instrumentation uses ResourceTiming if available for more accurate performance metrics
* ResourceTiming can be configured to clear ResourceTiming entries after each beacon
* Single Page App navigations now calculate Front-End (`t_page`) and Back-End (`t_resp`) metrics
* Single Page App navigations can be configured tell Boomerang to hold the SPA beacon until the page has completed other non-network activity
* XHR instrumentation can be configured to send XHR beacons for every XHR, instead of combining them during SPA navigations
* Custom Metric JavaScript variables can be configured to only be captured on specific URLs
* XHR instrumentation has a new optional snippet that helps instrument XHR before `boomerang.js` has been loaded
* Single Page App navigations now include NavigationTiming and/or ResourceTiming metrics for hard and soft navigations
* Angular `ui-router` support
* URLs captured via ResourceTiming are now limited to 1,000 characters
* React support
* Other Single Page App support via `window.History` and `onhashchange` monitoring
* ResourceTiming2 encoded, decoded and transfer sizes are collected
* Configurable option to override the name of the `RT` cookie

### Bug Fixes:

* Issue 196: Fixes `t_done` merging when two XHRs complete at the same time
* Issue 231: SPA navigations might wait indefinitely for IFRAMEs that were removed from the DOM
* Issue 249: Don't fire a non-SPA beacon when SPA support is enabled
* Issue 250: Wait for page `onload` before firing a SPA Hard Nav
* Issue 260: Revert `form.submit()` behavior back to original style
* Issue 271: Ensure we don't send bad `t_page` values from `responseStart` / `responseEnd` inversions on iOS
* Issue 299: Fixes race condition with manual beacons
* Issue 305: Wrap all sub-frame accesses in `try/catch` to avoid "Permission Denied" errors
* Issue 307: Fixes XHR error codes were not being tracked in some cases
* Issue 313: Fixes conflict with other third-party XHR instrumentation
* Issue 315: SPA navigation beacons being sent when `autorun=false` for prerender

## 1.246.1441122062
### Bug Fixes:

* Issue 174: Allow for quotes in cookies
* Issue 189: Only fire beacons during prerender to visible transition if beyond page load
* Issue 191: Check for Backbone existence on the correct IFRAME

## 1.235.1439916634
### Bug Fixes:

* Bug 95730: Support static function members on JavaScript classes and strings for dimensions, timers and metrics
* Bug 95904: Microsoft Edge browser hang on `form.submit()` on some pages
* Issue 176: Fix for browsers that don't have native support for `Array.filter`
* Issue 181: Fix to stop sending two beacons when SPA is disabled in app configuration but hook code is still on the page
* Issue 179: Enable QuerySelectors for Custom Timers with ResourceTiming

## 0.9.1437148526
### New Features:

* Optional parameter to await completion in bandwidth plugin before sending beacon
* Better support for tag managers and loading after `onload`
* New `dom.script.ext` beacon parameter reports the number of external scripts
* New `dom.img.ext` beacon parameter reports the number of external images
* New `ua.plt` beacon parameter reports the current platform
* New `ua.vnd` beacon parameter reports the current vendor
* QuerySelector support for Custom Metrics, Timers and Dimensions
* AngularJS, Ember.js and Backbone.js support
* Bug 93814: Allow array subscript for variables

### Bug Fixes:

* Bug 87109: Sessions were not being reset in some cases, resulting in very long sessions that skew average session duration
* Bug 88717: Auto-XHR: Always use original XHR `.open()` arguments
* Bug 91178: Page Groups using JavaScript variables always need to return the value so we can terminate on match
* Bug 92121: For Cookie Custom Metrics, if the cookie wasn't defined, we were using the current URL as the value
* Bug 92542: Ensure `getEntriesByName()` / `getEntriesByType()` exists in the frame before using
* Bug 92302: Change ResourceTiming optimized trie to avoid strings that trigger a XSS warning from NoScript
* Bug 92560: Auto-XHR: Exclude list not honored in IE
* Bug 92924: Auto-XHR: Not working with IE9
* Bug 94388: Use `rt.start=none` only if we don't have a start time
* Bug 94400: Page Group matching failing on IE (pre-IE11)
* IE Xpath parser: Allow single or double quotes
* rt.js: `validateLoadTimestamp()`: In an XHR event, trust the end ('now') timestamp
* auto_xhr.js: Only watch IMGs that have a new `src` attribute or the `src` attribute has changed
