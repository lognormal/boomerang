/**
 * The `Errors` plugin automatically captures JavaScript and other errors from
 * your web application.
 *
 * For information on how to include this plugin, see the {@tutorial building} tutorial.
 *
 * ## Sources of Errors
 *
 * When the `Errors` plugin is enabled, the following sources of errors are captured:
 *
 * * JavaScript runtime errors captured via the
 *   [`onerror`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror)
 *   global event handler
 * * [``XMLHttpRequest``](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
 *   responses that were not successful.  Note {@link BOOMR.plugins.AutOXHR} is required
 *   if using this.
 * * Any calls to [``window.console.error``](https://developer.mozilla.org/en-US/docs/Web/API/Console/error)
 * * JavaScript runtime errors that happen during a callback for
 *   [``addEventListener``](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
 * * JavaScript runtime errors that happen during a callback for
 *   [``setTimeout``](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout)
 *   and [``setInterval``](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
 * * Manually sent errors via {@link BOOMR.plugins.Errors.send}
 * * Functions that threw an exception that were wrapped via {@link BOOMR.plugins.Errors.wrap}
 * * Functions that threw an exception that were run via {@link BOOMR.plugins.Errors.test}
 * * JavaScript runtime errors captured via the
 *   [`unhandledrejection`](https://developer.mozilla.org/en-US/docs/Web/Events/unhandledrejection)
 *   global event handler. Disabled by default.
 * * JavaScript runtime warnings captured via the
 *   [`Reporting API`](https://www.w3.org/TR/reporting/#reporting-observer). Disabled by default.
 *
 * These are all enabled by default, and can be
 * {@link BOOMR.plugins.Errors.init manually turned off}.
 *
 * ## Supported Browsers
 *
 * The `Errors` plugin can be enabled for all browsers, though some older browsers
 * may not be able to capture the full breadth of sources of errors. Due to the lack
 * of error detail on some older browsers, some errors may be reported more than once.
 *
 * Notable browsers:
 *
 * * Internet Explorer <= 8: Does not support capturing `XMLHttpRequest` errors.
 *
 * ## Manually Sending Errors
 *
 * Besides automatically capturing errors from `onerror`, `XMLHttpRequest`,
 * `console.error` or event handlers such as `setTimeout`, you can also manually
 * send errors.
 *
 * There are three ways of doing this as follows:
 *
 * * {@link BOOMR.plugins.Errors.send}: Immediately sends an error.
 * * {@link BOOMR.plugins.Errors.wrap}: Wraps a function with error tracking
 * * {@link BOOMR.plugins.Errors.test}: Runs the function and captures any errors.
 *
 * ## Error callback
 *
 * You can specify an {@link BOOMR.plugins.Errors.init `onError`} function that
 * the Errors plugin will call any time an error is captured on the page.
 *
 * If your `onError` function returns `true`, the error will be captured.
 *
 * If your `onError` function does not return `true`, the error will be ignored.
 *
 * Example:
 *
 * ```
 * BOOMR.init({
 *   Errors: {
 *     onError: function(err) {
 *       if (err.message && err.message.indexOf("internally handled")) {
 *         return false;
 *       }
 *       return true;
 *     }
 *   }
 * });
 * ```
 *
 * ## When to Send Errors
 *
 * By default, errors captured during the page load will be sent along with the
 * page load beacon.
 *
 * Errors that happen after the page load will not be captured or sent.
 *
 * To enable capturing of errors after page load, you need to set
 * {@link BOOMR.plugins.Errors.init `sendAfterOnload`} to `true`. If set,
 * errors that happen after the page load will be sent at most once every
 * {@link BOOMR.plugins.Errors.init `sendInterval`} (which defaults to 1 second)
 * on a new beacon.
 *
 * Example:
 *
 * ```
 * BOOMR.init({
 *   Errors: {
 *     sendAfterOnload: true,
 *     sendInterval: 5000
 *   }
 * });
 * ```
 *
 * ## How Many Errors to Capture
 *
 * The `Errors` plugin will only capture up to
 * {@link BOOMR.plugins.Errors.init `maxErrors`} (defaults to 10) distinct
 * errors on the page.
 *
 * Please note that duplicate errors (those with the same function name, stack,
 * and so on) are tracked as single distinct error, with a `count` of how many
 * times it was seen.
 *
 * You can increase (or decrease) `maxErrors`. For example:
 * ```
 * BOOMR.init({
 *   Errors: {
 *     maxErrors: 20
 *   }
 * });
 * ```
 *
 * ## Dealing with Script Error
 *
 * When looking at JavaScript errors, you will likely come across the generic error
 * message: `Script error.`
 *
 * `Script Error.` is the message that browsers send to the
 * [`window.onerror`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror)
 * global exception handler when the error was triggered by a script loaded from a different (cross)
 * [origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin).  `window.onerror`
 * is used by Boomerang so that it gets notified of all unhandled exceptions.
 *
 * The `Script Error.` string is given _instead_ of the real error message
 * and does not contain any useful information about what caused the error. In addition,
 * there is no stack associated with the message, so it's impossible to know where
 * or why the error occurred.
 *
 * Browsers mask the real error message for cross-origin scripts due to security and
 * privacy concerns - they don't want to leak sensitive information in the message
 * or stack.  The only thing that `window.onerror` knows for cross-origin scripts
 * is that an error occurred, not where or why.
 *
 * ### Example
 *
 * For an example of where you'd see `Script Error.`, consider the following code
 * that lives on `website.com`:
 *
 * ```html
 * <html>
 *     <head>
 *         <title>website.com</title>
 *     </head>
 *     <body>
 *         <script>
 *             window.onerror = function(message, url, line, column, error) {
 *                 console.log("window.onerror: " + message);
 *                 console.log((error && error.stack) ? error.stack : "(no stack)");
 *             };
 *         </script>
 *         <script src="my-script.js"></script>
 *         <script src="https://anothersite.com/my-script.js"></script>
 *     </body>
 * </html>
 * ```
 *
 * Assume `my-script.js` is the same file being served from both `website.com` and
 * `anothersite.com`:
 *
 * ```js
 * function runCode() {
 *     a = b + 1;
 * }
 *
 * runCode();
 * ```
 *
 * When `my-script.js` is loaded from `website.com`, it will be executed twice:
 *
 * 1. First on the same-origin, where we'll see the full error message followed by
 *     the stack:
 *
 *     ```
 *     window.onerror: Uncaught ReferenceError: b is not defined
 *
 *     ReferenceError: b is not defined
 *         at runCode (my-script.js:2)
 *         at my-script.js:5
 *     ```
 *
 * 2. Then, it will be loaded from `https://anothersite.com/my-script.js`, which
 *     will be considered cross-origin and only `Script Error.` will be logged:
 *
 *     ```
 *     window.onerror: Script error.
 *
 *     (no stack)
 *     ```
 *
 * As you can see, browser shares the full details of the exception when it's served
 * from the same origin as the website, but if it's served from any other origin,
 * it will be considered cross-origin and no details will be shared.
 *
 * Note that while the browser only shares `Script Error.` to `window.onerror`
 * for cross-origin scripts, if _you_ have browser developer tools open,
 * the browser will show _you_ the full error message in the Console.  This is
 * because there aren't any security or privacy concerns for a developer looking at
 * their own machine's information.
 *
 * ### When You'll See Script Error
 *
 * Unfortunately `Script Error.` will be shown in many legitimate use-cases,
 * such as:
 *
 * 1. When serving your website's JavaScript from a CDN (since it will be coming
 *     from a different origin)
 *
 * 2. When loading a library such as jQuery or Angular from their CDN, i.e.
 *     [Google's Hosted Libraries](https://developers.google.com/speed/libraries/)
 *     or [cdnjs](https://cdnjs.com/)
 *
 * 3. When a third-party script loads from another domain
 *
 * The good news is that in many of these cases, there are changes you can make to
 * ensure the full error message and stack are shared with `window.onerror`.
 *
 * ### Fixing Script Error
 *
 * To ensure a cross-origin script shares full error details with `window.onerror`,
 * you'll need to do **two** things:
 *
 * 1. Add `crossorigin="anonymous"` to the `<script>` tag
 *
 *     The [`crossorigin="anonymous"` attribute](https://www.w3.org/TR/html5/infrastructure.html#cors-settings-attribute)
 *     tells the browser that the script should be fetched without sending
 *     any cookies or HTTP authentication
 *
 * 2. Add the `Access-Control-Allow-Origin` (ACAO) header to the JavaScript file's response.
 *
 *     The `Access-Control-Allow-Origin` header is part of the
 *     [Cross Origin Resource Sharing](https://www.w3.org/TR/cors/) (CORS) standard.
 *
 *     The ACAO header **must** be set in the JavaScript's HTTP response headers.
 *
 *     An example header that sets ACAO for all calling origins would be:
 *
 *     `Access-Control-Allow-Origin: *`
 *
 * If both conditions are true, cross-origin JavaScript files will report errors
 * to `window.onerror` with the correct error message and full stack.
 *
 * The biggest challenge to getting this working is that (1) is within the _site's_
 * control while (2) can only be configured by the _owner_ of the JavaScript.  If you're
 * loading JavaScript from a third-party, you will need to encourage them to add the
 * ACAO header if it's not already set.  The good news is that many CDNs and
 * third-parties set the ACAO header already.
 *
 * ### Workarounds for Third Parties that aren't sending ACAO
 *
 * One way to help monitor for errors coming from third-party scripts that aren't
 * setting ACAO (and aren't within your control) is by manually wrapping calls
 * to any of the third-party script's functions in a `try {} catch {}`.
 *
 * ```js
 * try {
 *     // calls a cross-origin script that doesn't have ACAO
 *     runThirdPartyCode();
 * } catch (e) {
 *     // report on error with e.message and e.stack
 * }
 * ```
 *
 * If `runThirdPartyCode()` causes any errors, the `catch {}` handler will get the full
 * details of the exception.
 *
 * Unfortunately this won't work for functions that are executed in the third-party
 * script as a result of browser events or callbacks (since you're not wrapping them).
 *
 * When using Boomerang to monitor JavaScript errors, Boomerang automatically wraps some
 * of the built-in browser APIs such as `setTimeout`, `setInterval` and `addEventListener`
 * with a minimal-overhead wrapper.  It does this to help ensure as many cross-origin
 * exceptions as possible have full stack details. You may also do this manually via
 * [`` BOOMR.plugin.Errors.wrap(function)``](#BOOMR_plugin_Errors_wrap).
 *
 * ## Why is Boomerang in my Error Stack?
 *
 * When looking at error reports, you may find errors that have a function in
 * `boomerang.js` (or `/boomerang/`) on the stack.  Why is that?  Is Boomerang
 * causing errors on your site?
 *
 * One of the ways that Boomerang is able to monitor and measure your site's performance
 * is by _wrapping_ itself around some of the core browser APIs.  Boomerang only does
 * this in a few places, if absolutely necessary -- namely, when the browser doesn't
 * provide a native "monitoring" interface for something that needs to be tracked.
 *
 * One example is for `XMLHttpRequests`, as there are no browser APIs to monitor when
 * XHRs load.  To monitor XHRs, Boomerang swaps in its own `window.XMLHttpRequest`
 * object, wrapping around the native methods.  When an XHR is created (via `.open()`),
 * the lightweight Boomerang wrapper is executed first so it can log a start timestamp.
 * When the XHR finishes (via a `readyState` change), Boomerang can log the end
 * timestamp and report on the XHR's performance.
 *
 * Examples of Boomerang wrapping native methods include:
 *
 * * `XMLHttpRequest` if the XHR instrumentation is turned on
 * * `setTimeout` and `setInterval` if error tracking is turned on
 * * `console.error` if error tracking is turned on
 * * `addEventListener` and `removeEventListener` if error tracking is turned on
 *
 * All of these wrapped functions come into play when you see an error stack with
 * a `boomerang.js` function in it.
 *
 * Often, the `boomerang.js` function will be at the _bottom_ of the stack (the first
 * function called).  This does not mean Boomerang caused the error, merely that
 * the monitoring code was running before the error occurred.  The actual
 * error happens towards the _top_ of the stack -- the function that ran and threw
 * the exception.
 *
 * Let's look at some examples:
 *
 * ```
 * Cannot read property 'foo' of undefined at thirdPartyTwo (https://thirdparty.com/core.js:1:100)
 * at thirdPartyOne (https://thirdparty.com/core.js:1:101)
 * at runThirdParty (https://thirdparty.com/core.js:1:102)
 * at xhrCallback (http://website.com/site.js:2:200)
 * at XMLHttpRequest.send (https://mysite.com/boomerang.js:3:300)
 * ```
 *
 * In the above example, Boomerang is monitoring `XMLHttpRequests`.  An XHR was
 * loaded on the site, and during the XHR callback, an exception was thrown.  Even
 * though `/boomerang/` is listed here, the error was caused by code in the XHR
 * callback (`xhrCallback` eventually calling `thirdPartyTwo`).
 *
 * Here's a second example:
 *
 * ```
 * Reference error: a is not defined at setTimeout (http://website.com/site.js:1:200)
 * at BOOMR_plugins_errors_wrap (http://mysite.com/boomerang.js:3:300)
 * at onclick (http://website.com/site.js:1:100)
 * ```
 *
 * In the above example, JavaScript Error Reporting is enabled and an exception was
 * thrown in a `setTimeout()` on the website.  You can see the `BOOMR_plugins_errors_wrap`
 * function is near the top of the stack, but this is merely the error tracking code.
 * All it did was wrap `setTimeout` to help ensure that cross-origin exceptions are
 * caught.  It was not the actual cause of the site's error.
 *
 * Here's a third example:
 *
 * ```
 * Error: missing argument 1 at BOOMR.window.console.error (https://mysite.com/boomerang.js:3:300)
 * at u/< (https://website.com/site.js:1:100)
 * at tp/this.$get</< (https://website.com/site.js:1:200)
 * at $digest (https://website.com/site.js:1:300)
 * at $apply (https://website.com/site.js:1:400)
 * at ut (https://website.com/site.js:1:500)
 * at it (https://website.com/site.js:1:600)
 * at vp/</k.onload (https://website.com/site.js:1:700)
 * ```
 *
 * In the above example, JavaScript Error Reporting is enabled and has wrapped
 * `console.error`.  The minified function `u/<` must be logging a `console.error`,
 * which executes the Boomerang wrapper code, reporting the error.
 *
 * In summary, if you see Boomerang functions in error stacks similar to any of the
 * ones listed below, it's probable that you're just seeing a side-effect of the
 * monitoring code:
 *
 * * `BOOMR_addError`
 * * `BOOMR_plugins_errors_onerror`
 * * `BOOMR_plugins_errors_onxhrerror`
 * * `BOOMR_plugins_errors_console_error`
 * * `BOOMR_plugins_errors_wrap`
 * * `BOOMR.window.console.error`
 * * `BOOMR_plugins_errors_onrejection`
 *
 * ## Beacon Parameters
 *
 * * `err`: The compressed error data structure
 * * `http.initiator = error` (if not part of a Page Load beacon)
 *
 * The compressed error data structure is a [JSURL](https://github.com/Sage/jsurl)
 * encoded JSON object.
 *
 * Each element in the array is a compressed representation of a JavaScript error:
 *
 * * `n`: Count (if the error was seen more than once)
 * * `f[]`: An array of frames
 *   * `f[].l`: Line number
 *   * `f[].c`: Colum number
 *   * `f[].f`: Function name
 *   * `f[].w`: File name (if origin differs from root page)
 *   * `f[].wo`: File name without origin (if same as root page)
 * * `s`: Source:
 *   * `1`: Error was triggered by the application
 *   * `2`: Error was triggered by Boomerang
 * * `v`: Via
 *   * `1`: Application ({@link BOOMR.plugins.Errors.send})
 *   * `2`: Global exception handler (`window.onerror`)
 *   * `3`: Network (XHR) error
 *   * `4`: Console (`console.error`)
 *   * `5`: Event handler (`addEventListener`)
 *   * `6`: `setTimeout` or `setInterval`
 * * `t`: Type (e.g. `SyntaxError` or `ReferenceError`)
 * * `c`: Code (for network errors)
 * * `m`: Error messag
 * * `x`: Extra data
 * * `d`: Timestamp (base 36)
 *
 * @class BOOMR.plugins.Errors
 */

/*eslint-disable*/
//
// Via https://github.com/stacktracejs/error-stack-parser
// Modifications:
// * Removed UMD
// * Return anonymous objects, not StackFrames
//
(function (root, factory) {
	'use strict';
	root.ErrorStackParser = factory();
}(this, function ErrorStackParser() {
	'use strict';

	var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
	var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
	var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;

	function _map(array, fn, thisArg) {
		if (typeof Array.prototype.map === 'function') {
			return array.map(fn, thisArg);
		} else {
			var output = new Array(array.length);
			for (var i = 0; i < array.length; i++) {
				output[i] = fn.call(thisArg, array[i]);
			}
			return output;
		}
	}

	function _filter(array, fn, thisArg) {
		if (typeof Array.prototype.filter === 'function') {
			return array.filter(fn, thisArg);
		} else {
			var output = [];
			for (var i = 0; i < array.length; i++) {
				if (fn.call(thisArg, array[i])) {
					output.push(array[i]);
				}
			}
			return output;
		}
	}

	return {
		/**
		 * Given an Error object, extract the most information from it.
		 * @param error {Error}
		 * @return Array[]
		 * @ignore
		 */
		parse: function ErrorStackParser$$parse(error) {
			if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
				return this.parseOpera(error);
			} else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
				return this.parseV8OrIE(error);
			} else if (error.stack) {
				return this.parseFFOrSafari(error);
			} else {
				throw new Error('Cannot parse given Error object');
			}
		},

		/**
		 * Separate line and column numbers from a URL-like string.
		 * @param urlLike String
		 * @return Array[String]
		 * @ignore
		 */
		extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
			// Fail-fast but return locations like "(native)"
			if (urlLike.indexOf(':') === -1) {
				return [urlLike];
			}

			var locationParts = urlLike.replace(/[\(\)\s]/g, '').split(':');
			var lastNumber = locationParts.pop();
			var possibleNumber = locationParts[locationParts.length - 1];
			if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
				var lineNumber = locationParts.pop();
				return [locationParts.join(':'), lineNumber, lastNumber];
			} else {
				return [locationParts.join(':'), lastNumber, undefined];
			}
		},

		parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
			var filtered = _filter(error.stack.split('\n'), function (line) {
				return !!line.match(CHROME_IE_STACK_REGEXP);
			}, this);

			return _map(filtered, function (line) {
				if (line.indexOf('(eval ') > -1) {
					// Throw away eval information until we implement stacktrace.js/stackframe#8
					line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
				}
				var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
				var locationParts = this.extractLocation(tokens.pop());
				var functionName = tokens.join(' ') || undefined;
				var fileName = locationParts[0] === 'eval' ? undefined : locationParts[0];

				return {
					functionName: functionName,
					fileName: fileName,
					lineNumber: locationParts[1],
					columnNumber: locationParts[2],
					source: line
				};
			}, this);
		},

		parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
			var filtered = _filter(error.stack.split('\n'), function (line) {
				return !line.match(SAFARI_NATIVE_CODE_REGEXP);
			}, this);

			return _map(filtered, function (line) {
				// Throw away eval information until we implement stacktrace.js/stackframe#8
				if (line.indexOf(' > eval') > -1) {
					line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
				}

				if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
					// Safari eval frames only have function names and nothing else
					return { functionName: line };
				} else {
					var tokens = line.split('@');
					var locationParts = this.extractLocation(tokens.pop());
					var functionName = tokens.join('@') || undefined;
					return {
						functionName: functionName,
						fileName: locationParts[0],
						lineNumber: locationParts[1],
						columnNumber: locationParts[2],
						source: line
					};
				}
			}, this);
		},

		parseOpera: function ErrorStackParser$$parseOpera(e) {
			if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
				e.message.split('\n').length > e.stacktrace.split('\n').length)) {
				return this.parseOpera9(e);
			} else if (!e.stack) {
				return this.parseOpera10(e);
			} else {
				return this.parseOpera11(e);
			}
		},

		parseOpera9: function ErrorStackParser$$parseOpera9(e) {
			var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
			var lines = e.message.split('\n');
			var result = [];

			for (var i = 2, len = lines.length; i < len; i += 2) {
				var match = lineRE.exec(lines[i]);
				if (match) {
					result.push({
						fileName: match[2],
						lineNumber: match[1],
						source: lines[i]
					});
				}
			}

			return result;
		},

		parseOpera10: function ErrorStackParser$$parseOpera10(e) {
			var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
			var lines = e.stacktrace.split('\n');
			var result = [];

			for (var i = 0, len = lines.length; i < len; i += 2) {
				var match = lineRE.exec(lines[i]);
				if (match) {
					result.push({
						functionName: match[3] || undefined,
						fileName: match[2],
						lineNumber: match[1],
						source: lines[i]
					});
				}
			}

			return result;
		},

		// Opera 10.65+ Error.stack very similar to FF/Safari
		parseOpera11: function ErrorStackParser$$parseOpera11(error) {
			var filtered = _filter(error.stack.split('\n'), function (line) {
				return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
					!line.match(/^Error created at/);
			}, this);

			return _map(filtered, function (line) {
				var tokens = line.split('@');
				var locationParts = this.extractLocation(tokens.pop());
				var functionCall = (tokens.shift() || '');
				var functionName = functionCall
						.replace(/<anonymous function(: (\w+))?>/, '$2')
						.replace(/\([^\)]*\)/g, '') || undefined;
				var argsRaw;
				if (functionCall.match(/\(([^\)]*)\)/)) {
					argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
				}
				var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
				return {
					functionName: functionName,
					args: args,
					fileName: locationParts[0],
					lineNumber: locationParts[1],
					columnNumber: locationParts[2],
					source: line
				};
			}, this);
		}
	};
}));
/*eslint-enable*/

/**
 * Boomerang Error plugin
 */
(function() {
	var impl;

	BOOMR = window.BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.Errors) {
		return;
	}

	//
	// Constants
	//

	/**
	 * Functions to strip from any stack (internal functions)
	 */
	var STACK_FUNCTIONS_REMOVE = [
		"BOOMR_addError",
		"createStackForSend",
		"BOOMR.window.console.error",
		"BOOMR.plugins.Errors.init",
		"BOOMR.window.onerror",
		// below matches multiple functions:
		"BOOMR_plugins_errors_"
	];

	// functions to strip if they match a STACK_FILENAME_MATCH
	var STACK_FUNCTIONS_REMOVE_IF_FILENAME_MATCH = [
		"Object.send",
		"b.send",
		"wrap",
		"Anonymous function"
	];

	// files that will match for STACK_FUNCTIONS_REMOVE_IF_FILENAME_MATCH
	var STACK_FILENAME_MATCH = [
		"/boomerang"
	];

	/**
	 * Maximum size, in characters, of stack to capture
	 */
	var MAX_STACK_SIZE = 5000;

	/**
	 * BoomerangError object
	 *
	 * @param {object} config Configuration
	 */
	function BoomerangError(config) {
		config = config || {};

		// how many times we've seen this error
		if (typeof config.count === "number" || typeof config.count === "string") {
			this.count = parseInt(config.count, 10);
		}
		else {
			this.count = 1;
		}

		if (typeof config.timestamp === "number") {
			this.timestamp = config.timestamp;
		}
		else {
			 this.timestamp = BOOMR.now();
		}

		// merge in properties from config
		if (typeof config.code === "number" || typeof config.code === "string") {
			this.code = parseInt(config.code, 10);
		}

		if (typeof config.message === "string") {
			this.message = config.message;
		}

		if (typeof config.functionName === "string") {
			this.functionName = config.functionName;
		}

		if (typeof config.fileName === "string") {
			this.fileName = config.fileName;
		}

		if (typeof config.lineNumber === "number" || typeof config.lineNumber === "string") {
			this.lineNumber = parseInt(config.lineNumber, 10);
		}

		if (typeof config.columnNumber === "number" || typeof config.columnNumber === "string") {
			this.columnNumber = parseInt(config.columnNumber, 10);
		}

		if (typeof config.stack === "string") {
			this.stack = config.stack;
		}

		if (typeof config.type === "string") {
			this.type = config.type;
		}

		if (typeof config.extra !== "undefined") {
			this.extra = config.extra;
		}

		this.source = (typeof config.source === "number" || typeof config.source === "string") ?
			parseInt(config.source, 10) :
			BOOMR.plugins.Errors.SOURCE_APP;

		if (typeof config.via === "number" || typeof config.via === "string") {
			this.via = parseInt(config.via, 10);
		}

		if (BOOMR.utils.isArray(config.frames)) {
			this.frames = config.frames;
		}
		else {
			this.frames = [];
		}

		if (BOOMR.utils.isArray(config.events)) {
			this.events = config.events;
		}
		else {
			this.events = [];
		}
	}

	/**
	 * Determines if one BoomerangError object is equal to another
	 *
	 * @param {object} other Object to compare to
	 *
	 * @returns {boolean} True if the two objects are logically equal errors
	 */
	BoomerangError.prototype.equals = function(other) {
		if (typeof other !== "object") {
			return false;
		}
		else if (this.code !== other.code) {
			return false;
		}
		else if (this.message !== other.message) {
			return false;
		}
		else if (this.functionName !== other.functionName) {
			return false;
		}
		else if (this.fileName !== other.fileName) {
			return false;
		}
		else if (this.lineNumber !== other.lineNumber) {
			return false;
		}
		else if (this.columnNumber !== other.columnNumber) {
			return false;
		}
		else if (this.stack !== other.stack) {
			return false;
		}
		else if (this.type !== other.type) {
			return false;
		}
		else if (this.source !== other.source) {
			return false;
		}
		else {
			// same!
			return true;
		}
	};

	/**
	 * Creates a BoomerangError from an Error
	 *
	 * @param {Error} error Error object
	 * @param {number} via How the Error was found (VIA_* enum)
	 * @param {number} source Source of the error (SOURCE_* enum)
	 *
	 * @returns {BoomerangError} Error
	 */
	BoomerangError.fromError = function(error, via, source) {
		var frame, frames, lastFrame, forceUpdate = false, i, j, k,
		    now = BOOMR.now(), skipThis, thisFrame, thisFn;

		if (!error) {
			return null;
		}

		// parse the stack
		if (error.stack) {
			if (error.stack.length > MAX_STACK_SIZE) {
				error.stack = error.stack.substr(0, MAX_STACK_SIZE);
			}

			frames = ErrorStackParser.parse(error);
			if (frames && frames.length) {
				if (error.generatedStack) {
					// if we generated the stack (we were only given a message),
					// we should remove our stack-generation function from it

					// fix-up stack generation on Chrome
					if (frames.length >= 4 &&
						frames[1].functionName &&
						frames[1].functionName.indexOf("createStackForSend") !== -1) {
						// remove the top 3 frames
						frames = frames.slice(3);
						forceUpdate = true;
					}

					// fix-up stack generation on Firefox
					if (frames.length >= 3 &&
						frames[0].functionName &&
						frames[0].functionName.indexOf("createStackForSend") !== -1) {
						// check to see if the filename of frames two and 3 are the same (boomerang),
						// if so, remove both
						if (frames[1].fileName === frames[2].fileName) {
							// remove the top 3 frames
							frames = frames.slice(3);
						}
						else {
							// remove the top 2 frames
							frames = frames.slice(2);
						}

						forceUpdate = true;
					}

					// strip other stack generators
					if (frames.length >= 1 &&
						frames[0].functionName &&
						frames[0].functionName.indexOf("BOOMR_plugins_errors") !== -1) {
						frames = frames.slice(1);
						forceUpdate = true;
					}
				}

				// remove our error wrappers from the stack
				for (i = 0; i < frames.length; i++) {
					thisFrame = frames[i];
					thisFn = thisFrame.functionName;
					skipThis = false;

					// strip boomerang function names
					if (thisFn) {
						for (j = 0; j < STACK_FUNCTIONS_REMOVE.length; j++) {
							if (thisFn.indexOf(STACK_FUNCTIONS_REMOVE[j]) !== -1) {
								frames.splice(i, 1);
								forceUpdate = true;

								// outloop continues with the next element
								i--;
								skipThis = true;
								break;
							}
						}

						// strip additional functions if they also match a file
						if (!skipThis && thisFrame.fileName) {
							for (j = 0; j < STACK_FILENAME_MATCH.length; j++) {
								if (thisFrame.fileName.indexOf(STACK_FILENAME_MATCH[j]) !== -1) {
									// this file name matches, see if any of the matching functions also do
									for (k = 0; k < STACK_FUNCTIONS_REMOVE_IF_FILENAME_MATCH.length; k++) {
										if (thisFn.indexOf(STACK_FUNCTIONS_REMOVE_IF_FILENAME_MATCH[k]) !== -1) {
											frames.splice(i, 1);
											forceUpdate = true;

											// outloop continues with the next element
											i--;
											skipThis = true;
											break;
										}
									}
								}
							}
						}
					}
				}

				if (frames.length) {
					// get the top frame
					frame = frames[0];

					// fill in our error with the top frame, if not already specified
					if (forceUpdate || typeof error.lineNumber === "undefined") {
						error.lineNumber = frame.lineNumber;
					}

					if (forceUpdate || typeof error.columnNumber === "undefined") {
						error.columnNumber = frame.columnNumber;
					}

					if (forceUpdate || typeof error.functionName === "undefined") {
						error.functionName = frame.functionName;
					}

					if (forceUpdate || typeof error.fileName === "undefined") {
						error.fileName = frame.fileName;
					}
				}

				// trim stack down
				if (error.stack) {
					// remove double-spaces
					error.stack = error.stack.replace(/\s\s+/g, " ");
				}
			}
		}
		else if (error.functionName ||
			error.fileName ||
			error.lineNumber ||
			error.columnNumber) {
			// reconstruct a single frame if given fileName, etc
			frames = [{
				lineNumber: error.lineNumber,
				columnNumber: error.columnNumber,
				fileName: error.fileName,
				functionName: error.functionName
			}];
		}

		// fixup some old browser types
		if (typeof error.message === "string" &&
		    error.message.indexOf("ReferenceError:") !== -1 &&
		    error.name === "Error") {
			error.name = "ReferenceError";
		}

		// create our final object
		var err = new BoomerangError({
			code: error.code ? error.code : undefined,
			message: error.message ? error.message : undefined,
			functionName: error.functionName ? error.functionName : undefined,
			fileName: error.fileName ? error.fileName : undefined,
			lineNumber: error.lineNumber ? error.lineNumber : undefined,
			columnNumber: error.columnNumber ? error.columnNumber : undefined,
			stack: error.stack ? error.stack : undefined,
			type: error.name ? error.name : undefined,
			source: source,
			via: via,
			frames: frames,
			extra: error.extra ? error.extra : undefined,
			timestamp: error.timestamp ? error.timestamp : now
		});

		return err;
	};

	//
	// Internal config
	//
	impl = {
		//
		// Configuration
		//

		// overridable
		onError: undefined,
		monitorGlobal: true,
		monitorNetwork: true,
		monitorConsole: true,
		monitorEvents: true,
		monitorTimeout: true,
		monitorRejections: false,  // new feature, off by default
		monitorReporting: false,  // new feature, off by default
		sendAfterOnload: false,
		maxErrors: 10,
		// How often to send an error beacon after onload
		sendInterval: 1000,
		// How often to send a beacon during onload if autorun=false
		sendIntervalDuringLoad: 2500,
		sendIntervalId: -1,
		maxEvents: 10,

		// state
		isDuringLoad: true,
		initialized: false,
		supported: false,
		autorun: true,

		/**
		 * All errors
		 */
		errors: [],

		/**
		 * Errors queued up for the next batch
		 */
		q: [],

		/**
		 * Circular event buffer
		 */
		events: [],

		// Reporting API observer
		reportingObserver: undefined,

		//
		// Public Functions
		//
		/**
		 * Sends an error
		 *
		 * @param {Error|String} error Error object or message
		 *
		 * @memberof BOOMR.plugins.Errors
		 */
		send: function(error, via, source) {
			var now = BOOMR.now();

			if (!error) {
				return;
			}

			// check if this error was already sent.
			// This could happen if an event handler caught it and then the global
			// error handler caught it again.
			if (error.reported === true) {
				return;
			}
			error.reported = true;

			// defaults, if not specified
			via = via || BOOMR.plugins.Errors.VIA_APP;
			source = source ||  BOOMR.plugins.Errors.SOURCE_APP;

			// if we weren't given a stack, try to create one
			if (!error.stack && !error.noStack) {
				// run this in a function so we can detect it easier by the name,
				// and remove it from any stack frames we send
				function createStackForSend() {
					try {
						throw Error(error);
					}
					catch (ex) {
						error = ex;

						// note we generated this stack for later
						error.generatedStack = true;

						// set the time when it was created
						error.timestamp = error.timestamp || now;

						impl.addError(error, via, source);
					}
				}

				createStackForSend();
			}
			else {
				// add the timestamp
				error.timestamp = error.timestamp || now;

				// send (or queue) the error
				impl.addError(error, via, source);
			}
		},

		//
		// Private Functions
		//

		/**
		 * Sends (or queues) errors
		 *
		 * @param {Error} error Error
		 * @param {number} via VIA_* constant
		 * @param {number} source SOURCE_* constant
		 */
		addError: function(error, via, source) {
			var onErrorResult, err, dup = false, now = BOOMR.now();

			// only track post-load errors if configured
			if (!impl.isDuringLoad && !impl.sendAfterOnload) {
				return;
			}

			// allow the user to filter out the error
			if (impl.onError) {
				try {
					onErrorResult = impl.onError(error);
				}
				catch (exc) {
					onErrorResult = false;
				}

				if (!onErrorResult) {
					return;
				}
			}

			// obey the errors limit
			if (impl.errors.length >= impl.maxErrors) {
				return;
			}

			// convert into our object
			err = BoomerangError.fromError(error, via, source);

			// add to our list of errors seen for all time
			dup = impl.mergeDuplicateErrors(impl.errors, err, false);

			// fire an error event with the duped or new error
			BOOMR.fireEvent("error", dup || err);

			// add to our current queue
			impl.mergeDuplicateErrors(impl.q, err, true);

			//
			// There are a few reasons we'll send an error beacon on its own:
			// 1. If this is after onload, and sendAfterOnload is set.
			// 2. If this is during onload, but autorun is false.  In that case,
			//    we want to send out errors (after a small delay) in case the
			//    page never loads (e.g. due to the error).
			//
			if ((!impl.isDuringLoad || !impl.autorun) && impl.sendIntervalId === -1) {
				if (dup) {
					// If this is not during a load, and it's a duplicate of
					// a previous error, don't send a beacon just for itself
					return;
				}

				// errors outside of a load will be sent at the next interval
				impl.sendIntervalId = setTimeout(function() {
					impl.sendIntervalId = -1;

					// Don't send a beacon if we've already flushed the queue.  This
					// might happen for pre-onload becaons if the onload beacon was
					// sent after queueing
					if (impl.q.length === 0) {
						return;
					}

					// change this to an 'error' beacon
					BOOMR.addVar("http.initiator", "error");

					// set it as an API beacon, which means it won't have any timing data
					BOOMR.addVar("api", 1);

					// add our errors to the beacon
					impl.addErrorsToBeacon();

					// ensure start/end timestamps are on the beacon since the RT
					// plugin won't run until onload
					if (impl.isDuringLoad) {
						BOOMR.addVar("rt.tstart", now);
						BOOMR.addVar("rt.end", now);
						BOOMR.addVar("rt.start", "manual");
					}

					// send it!
					BOOMR.sendBeacon();
				}, impl.isDuringLoad ? impl.sendIntervalDuringLoad : impl.sendInterval);
			}
		},

		/**
		 * Finds a duplicate BoomerangErrors in the specified array
		 *
		 * @param {Array[]} errors Array of BoomerangErrors
		 * @param {BoomerangError} err BoomerangError to check
		 *
		 * @returns {BoomerangError} BoomerangErrors that was duped against, if any
		 */
		findDuplicateError: function(errors, err) {
			if (!BOOMR.utils.isArray(errors) || typeof err === "undefined") {
				return undefined;
			}

			for (var i = 0; i < errors.length; i++) {
				if (errors[i].equals(err)) {
					return errors[i];
				}
			}

			return undefined;
		},

		/**
		 * Merges duplicate BoomerangErrors
		 *
		 * @param {Array[]} errors Array of BoomerangErrors
		 * @param {BoomerangError} err BoomerangError to check
		 * @param {boolean} bumpCount Increment the count of any found duplicates
		 *
		 * @returns {BoomerangError} BoomerangErrors that was duped against, if any
		 */
		mergeDuplicateErrors: function(errors, err, bumpCount) {
			if (!BOOMR.utils.isArray(errors) || typeof err === "undefined") {
				return undefined;
			}

			var dup = impl.findDuplicateError(errors, err);
			if (dup) {
				if (bumpCount) {
					dup.count += err.count;
				}

				return dup;
			}
			else {
				errors.push(err);
				return undefined;
			}
		},

		/**
		 * Fired 'beacon'
		 */
		onBeacon: function() {
			// remove our err vars
			BOOMR.removeVar("err");
			BOOMR.removeVar("api");
			BOOMR.removeVar("http.initiator");
		},

		/**
		 * Fired on 'page_ready'
		 */
		pageReady: function() {
			impl.isDuringLoad = false;
		},

		/**
		 * Retrieves the current errors
		 *
		 * @returns {BoomerangError[]}
		 */
		getErrors: function() {
			if (impl.errors.length === 0) {
				return false;
			}

			return impl.errors;
		},

		/**
		 * Gets errors suitable for transmission in a URL
		 *
		 * @param {BoomerangError[]} errors BoomerangErrors array
		 *
		 * @returns {string} String for URL
		 */
		getErrorsForUrl: function(errors) {
			errors = impl.compressErrors(errors);
			return BOOMR.utils.serializeForUrl(errors);
		},

		/**
		 * Adds any queue'd errors to the beacon
		 */
		addErrorsToBeacon: function() {
			if (impl.q.length) {
				var err = this.getErrorsForUrl(impl.q);
				if (err) {
					BOOMR.addVar("err", err);
				}

				impl.q = [];
			}
		},

		/**
		 * Fired 'before_beacon'
		 */
		beforeBeacon: function() {
			impl.addErrorsToBeacon();
		},

		/**
		 * Wraps calls to functionName in an exception handler that will
		 * automatically report exceptions.
		 *
		 * @param {string} functionName Function name
		 * @param {object} that Target object
		 * @param {boolean} useCallingObject Whether or not to use the calling object for 'this'
		 * @param {number} callbackIndex Which argument is the callback
		 * @param {number} via Via
		 */
		wrapFn: function(functionName, that, useCallingObject, callbackIndex, via) {
			var origFn = that[functionName];

			if (typeof origFn !== "function") {
				return;
			}

			var rEL;
			if (functionName === "addEventListener") {
				// grab the native
				rEL = that.removeEventListener;
			}

			that[functionName] = function() {
				try {
					var args = Array.prototype.slice.call(arguments);
					var callbackFn = args[callbackIndex];

					// Determine the calling object: if 'this' is the Boomerang frame, we should swap it
					// to the correct top level window context.  If Boomerang isn't running in a frame,
					// BOOMR.window will still point to the top-level window.
					var targetObj = useCallingObject ? (this === window ? BOOMR.window : this) : that;
					var wrappedFn = impl.wrap(callbackFn, targetObj, via);

					args[callbackIndex] = wrappedFn;

					if (functionName === "addEventListener") {
						// For removeEventListener we need to keep track of this
						// unique tuple of target object, event name (arg0), original function
						// and capture (arg2)
						// Since we wrap the origFn with a new anonymous function we can't rely on
						// the browser's addEventListener to dedup multiple additions of the same
						// callback.
						if (!impl.trackFn(targetObj, args[0], callbackFn, args[2], wrappedFn)) {
							// if the callback is already tracked, we won't call addEventListener
							return;
						}
						if (rEL) {
							// Remove the listener before adding it back in.
							// This takes care of the (pathological) case where code is relying on the native
							// de-dupping that the browser provides and BOOMR instruments `addEventListener` between
							// their redundant calls to `addEventListener`.
							// We detach with the native because there's no point in calling our wrapped version.
							rEL.apply(targetObj, arguments);
						}
					}

					return origFn.apply(targetObj, args);
				}
				catch (e) {
					// error during original callback setup
					impl.send(e, via);

					// re-throw
					throw e;
				}
			};
		},

		/**
		 * Tracks the specified function for removeEventListener.
		 *
		 * @param {object} target Target element (window, element, etc)
		 * @param {string} type Event type (name)
		 * @param {function} listener Original listener
		 * @param {boolean|object} useCapture|options Use capture flag or options object
		 * @param {function} wrapped Wrapped function
		 *
		 * @returns {boolean} `true` if function is not already tracked, false otherwise
		 */
		trackFn: function(target, type, listener, useCapture, wrapped) {
			if (!target) {
				return false;
			}

			if (impl.trackedFnIdx(target, type, listener, useCapture) !== -1) {
				// already tracked
				return false;
			}

			if (!target._bmrEvents) {
				target._bmrEvents = [];
			}

			// 3rd argment can be useCapture flag or options object that may contain a `capture` key.
			// Default is false in both cases
			useCapture = (useCapture && useCapture.capture || useCapture) === true;

			target._bmrEvents.push([type, listener, useCapture, wrapped]);
			return true;
		},

		/**
		 * Gets the index of the tracked function.
		 *
		 * @param {object} target Target element (window, element, etc)
		 * @param {string} type Event type (name)
		 * @param {function} listener Original listener
		 * @param {boolean|object} useCapture|options Use capture flag or options object
		 *
		 * @returns {number} Index of already tracked function, or -1 if it doesn't exist
		 */
		trackedFnIdx: function(target, type, listener, useCapture) {
			var i, f;

			if (!target) {
				return;
			}

			if (!target._bmrEvents) {
				target._bmrEvents = [];
			}

			// 3rd argment can be useCapture flag or options object that may contain a `capture` key.
			// Default is false in both cases
			useCapture = (useCapture && useCapture.capture || useCapture) === true;

			for (i = 0; i < target._bmrEvents.length; i++) {
				f = target._bmrEvents[i];
				if (f[0] === type &&
				    f[1] === listener &&
				    f[2] === useCapture) {
					return i;
				}
			}

			return -1;
		},

		/**
		 * Wraps removeEventListener to work with our wrapFn
		 *
		 * @param {object} that Target object
		 */
		wrapRemoveEventListener: function(that) {
			var fn = "removeEventListener", origFn = that[fn], idx, wrappedFn;

			if (typeof origFn !== "function") {
				return;
			}

			that[fn] = function(type, listener, useCapture) {
				var targetObj = this === window ? BOOMR.window : this;
				idx = impl.trackedFnIdx(targetObj, type, listener, useCapture);
				if (idx !== -1) {
					wrappedFn = targetObj._bmrEvents[idx][3];

					// remove our wrapped function instead
					origFn.call(targetObj, type, wrappedFn, useCapture);

					// remove bookkeeping
					targetObj._bmrEvents.splice(idx, 1);
				}
				else {
					// unknown, pass original args
					origFn.call(targetObj, type, listener, useCapture);
				}
			};
		},

		/**
		 * Wraps the function in an exception handler that will
		 * automatically report exceptions.
		 *
		 * @param {function} fn Function
		 * @param {object} that Target object
		 * @param {number} via Via (optional)
		 *
		 * @returns {function} Wrapped function
		 *
		 * @memberof BOOMR.plugins.Errors
		 */
		wrap: function(fn, that, via) {
			if (typeof fn !== "function") {
				// Return the input argument as-is.  This might happen if the argument
				// to setTimeout/setInterval is a string, which is deprecated but supported
				// by all browsers, however it isn't something we can wrap (we don't want to have
				// eval statements in the code).
				return fn;
			}

			via = via || BOOMR.plugins.Errors.VIA_APP;

			// ensure the document.domain is OK before we wrap the function
			BOOMR_check_doc_domain();

			return function BOOMR_plugins_errors_wrap() {
				try {
					return fn.apply(that, arguments);
				}
				catch (e) {
					// Check for IE/Edge error "Can't execute code from freed script"
					if (e.number === -2146823277 &&
						(via === BOOMR.plugins.Errors.VIA_EVENTHANDLER || via === BOOMR.plugins.Errors.VIA_TIMEOUT)) {
						// Event listeners that reference freed scripts don't generate errors in IE
						// Our call to a freed script does though, don't report the error
						return;
					}

					// Report error during callback
					impl.send(e, via);

					// re-throw
					throw e;
				}
			};
		},

		/**
		 * Runs the function, watching for exceptions
		 *
		 * @param {function} fn Function
		 * @param {object} that Target object
		 * @param {object[]} args Arguments
		 *
		 * @memberof BOOMR.plugins.Errors
		 */
		test: function() {
			var fn, that, args;
			if (arguments.length === 0) {
				return undefined;
			}

			// the function to run is the first argument
			fn = arguments[0];
			if (typeof fn !== "function") {
				return undefined;
			}

			// the object is the second
			that = arguments.length > 1 ? arguments[1] : BOOMR.window;

			// additional arguments after
			var args = Array.prototype.slice.call(arguments, 2);

			// run the fn
			return impl.wrap(fn, that).apply(that, args);
		},

		/**
		 * Normalizes an object to a string
		 *
		 * @param {object} obj Object
		 * @returns {string} String version of the object
		 */
		normalizeToString: function(obj) {
			if (typeof obj === "undefined") {
				return "undefined";
			}
			else if (obj === null) {
				return "null";
			}
			else if (typeof obj === "number" && isNaN(obj)) {
				return "NaN";
			}
			else if (obj === "") {
				return "(empty string)";
			}
			else if (obj === 0) {
				return "0";
			}
			else if (!obj) {
				return "false";
			}
			else if (typeof obj === "function") {
				return "(function)";
			}
			else if (obj && typeof obj.toString === "function") {
				return obj.toString();
			}
			else {
				return "(unknown)";
			}
		},

		/**
		 * Compresses BoomerangErrors to a smaller properties for transmission
		 *
		 * count -> n if > 1
		 * frames -> f
		 * frames[].lineNumber -> f[].l
		 * frames[].columnNumber -> f[].c
		 * frames[].functionName -> f[].f
		 * frames[].fileName -> f[].w or .wo (stripped of root origin)
		 * events -> e
		 * events[].type -> e[].t
		 * events[].timestamp -> e[].d
		 * events[].[other] -> each type has its own data
		 * source -> s
		 * via -> v
		 * type -> t
		 * code -> c
		 * message -> m
		 * extra -> x
		 * events -> e
		 * timestamp -> d (base 36)
		 *
		 * stack, fileName, functionName, lineNumber and columnNumber are dropped
		 * since they're frame[0]
		 *
		 * @params {BoomerangError[]} errors Errors array
		 *
		 * @returns {BoomerangError[]} Compressed errors array
		 */
		compressErrors: function(errors) {
			var i, j, err, frame, evt, minFrame, minEvent, o, obj, timestamp = 0;

			// get the origin
			o = BOOMR.window.location.origin;

			// minimize the contents of each error
			for (i = 0; i < errors.length; i++) {
				err = errors[i];

				// we're going to create a new object with minimized property
				// names and values to reduce byte size
				obj = {};

				// 1-count is assumed
				if (err.count !== 1) {
					obj.n = err.count;
				}

				if (typeof err.timestamp === "number") {
					timestamp = err.timestamp;
					obj.d = err.timestamp.toString(36);
				}

				// frames
				if (err.frames.length) {
					obj.f = [];

					// compress all frames
					for (j = 0; j < err.frames.length; j++) {
						frame = err.frames[j];

						// encode numeric properties
						if (frame.lineNumber) {
							frame.lineNumber = parseInt(frame.lineNumber, 10);
						}

						if (frame.columnNumber) {
							frame.columnNumber = parseInt(frame.columnNumber, 10);
						}

						minFrame = {
							l: frame.lineNumber,
							c: frame.columnNumber
						};

						// drop origin from filename
						if (typeof frame.fileName === "string") {
							if (frame.fileName.indexOf(o) !== -1) {
								minFrame.wo = frame.fileName.replace(o, "");
							}
							else {
								minFrame.w = frame.fileName;
							}
						}

						if (typeof frame.functionName === "string") {
							minFrame.f = frame.functionName;
						}

						obj.f.push(minFrame);
					}
				}

				// don't copy events if there aren't any
				if (err.events.length) {
					obj.e = [];

					// compress all events
					for (j = 0; j < err.events.length; j++) {
						evt = err.events[j];

						minEvent = {
							t: evt.type,
							d: timestamp ? (timestamp - evt.timestamp) : evt.timestamp
						};

						// type-specific compression
						if (evt.type === BOOMR.plugins.Errors.EVENT_CLICK) {
							if (evt.id) {
								minEvent.i = evt.id;
							}

							if (evt.name) {
								minEvent.n = evt.name;
							}

							if (evt.tagName) {
								minEvent.g = evt.tagName;
							}
						}
						else if (evt.type === BOOMR.plugins.Errors.EVENT_NETWORK) {
							if (evt.url) {
								minEvent.u = evt.url;
							}

							if (evt.method) {
								minEvent.m = evt.method;
							}

							if (evt.result) {
								minEvent.r = evt.result;
							}
						}
						else if (evt.type === BOOMR.plugins.Errors.EVENT_LOG) {
							if (evt.severity) {
								minEvent.s = evt.severity;
							}

							if (evt.message) {
								minEvent.m = evt.message;
							}
						}

						obj.e.push(minEvent);
					}
				}

				// don't need to add these properties as they're in the first frame:
				// lineNumber
				// columnNumber
				// functionName
				// fileName

				//
				// Only copy non-default values
				//
				if (err.source !== BOOMR.plugins.Errors.SOURCE_APP) {
					obj.s = err.source;
				}

				if (typeof err.via !== "undefined" && err.via !== BOOMR.plugins.Errors.VIA_APP) {
					obj.v = err.via;
				}

				if (typeof err.type !== "undefined" && err.type !== "Error") {
					obj.t = err.type;
				}

				if (err.code) {
					obj.c = err.code;
				}

				if (err.message) {
					obj.m = err.message;
				}

				if (err.extra) {
					obj.x = err.extra;
				}

				// send minimized object
				errors[i] = obj;
			}

			return errors;
		}

		/* BEGIN_DEBUG */,
		/**
		 * Decompresses URL-transmitted BoomerangErrors back into the full object
		 *
		 * @params {BoomerangError[]} errors Errors array
		 *
		 * @returns {BoomerangError[]} Decompressed errors array
		 */
		decompressErrors: function(errors) {
			var i, j, err, frame, o;

			// get the origin
			o = BOOMR.window.location.origin;

			for (i = 0; i < errors.length; i++) {
				err = errors[i];

				// 1-count is assumed
				if (err.n) {
					err.count = parseInt(err.n, 10);
				}
				else {
					err.count = 1;
				}

				// timestamp is base-36
				if (err.d) {
					err.timestamp = parseInt(err.d, 36);
				}

				// frames
				err.frames = [];

				if (err.m) {
					err.message = err.m;
				}

				// start reconstructing the stack
				err.stack = err.message ? (err.message + " ") : "";

				// decompress all frames
				if (err.f) {
					for (j = 0; j < err.f.length; j++) {
						frame = err.f[j];

						// replace minimized property names with their full ones
						if (frame.l) {
							frame.lineNumber = parseInt(frame.l, 10);
						}

						if (frame.c) {
							frame.columnNumber = parseInt(frame.c, 10);
						}

						if (frame.f) {
							frame.functionName = frame.f;
						}

						if (frame.w) {
							frame.fileName = frame.w;
						}

						if (frame.wo) {
							frame.fileName = o + frame.wo;
						}

						delete frame.c;
						delete frame.l;
						delete frame.f;
						delete frame.w;
						delete frame.wo;

						err.frames.push(frame);

						// reconstruct the stack
						if (j !== 0) {
							err.stack += "\n";
						}

						err.stack += "at";

						if (frame.functionName) {
							err.stack += " " + frame.functionName;
						}

						if (frame.functionName && frame.fileName) {
							err.stack += " (" + frame.fileName;
						}
						else if (!frame.functionName && frame.fileName) {
							err.stack += " " + frame.fileName;
						}

						if (frame.lineNumber) {
							err.stack += ":" + frame.lineNumber;
						}

						if (frame.columnNumber) {
							err.stack += ":" + frame.columnNumber;
						}

						if (frame.functionName && frame.fileName) {
							err.stack += ")";
						}
					}

					// copy propeties from top frame
					err.lineNumber = err.frames[0].lineNumber;
					err.columnNumber = err.frames[0].columnNumber;
					err.functionName = err.frames[0].functionName;
					err.fileName = err.frames[0].fileName;
				}

				err.events = err.e || [];

				// copy over values or defaults
				err.source = err.s ? err.s : BOOMR.plugins.Errors.SOURCE_APP;
				err.via = err.v ? err.v : BOOMR.plugins.Errors.VIA_APP;
				err.type = err.t ? err.t : "Error";

				if (err.x) {
					err.extra = err.x;
				}

				if (err.c) {
					err.code = parseInt(err.c, 10);
				}

				// delete minimized property names
				delete err.c;
				delete err.f;
				delete err.e;
				delete err.s;
				delete err.v;
				delete err.t;
				delete err.m;
				delete err.n;
				delete err.x;
				delete err.d;
			}

			return errors;
		}
		/* END_DEBUG */
	};

	//
	// Exports
	//
	var E = BOOMR.plugins.Errors = {
		/**
		 * Initializes the plugin.
		 *
		 * @param {object} config Configuration
		 * @param {function} [config.Errors.onError] Callback to fire when
		 * an error occurs
		 *
		 * @param {boolean} [config.Errors.monitorGlobal] Monitor `window.onerror`
		 * @param {boolean} [config.Errors.monitorNetwork] Monitor XHR errors
		 * @param {boolean} [config.Errors.monitorConsole] Monitor `console.error`
		 * @param {boolean} [config.Errors.monitorEvents] Monitor event callbacks
		 * (from `addEventListener`).
		 * @param {boolean} [config.Errors.monitorTimeout] Monitor `setTimout`
		 * and `setInterval`.
		 * @param {boolean} [config.Errors.monitorRejections] Monitor unhandled
		 * promise rejections.
		 * @param {boolean} [config.Errors.monitorReporting] Monitor Reporting API
		 * warnings.
		 * @param {boolean} [config.Errors.sendAfterOnload] Whether or not to
		 * send errors after the page load beacon.  If set to false, only errors
		 * that happened up to the page load beacon will be captured.
		 * @param {boolean} [config.Errors.sendInterval] If `sendAfterOnload` is
		 * true, how often to send the latest batch of errors.
		 * @param {number} [config.Errors.maxErrors] Maximum number of errors
		 * to track per page.
		 *
		 * @returns {@link BOOMR.plugins.Errors} The Errors plugin for chaining
		 * @memberof BOOMR.plugins.Errors
		 */

		init: function(config) {
			var i, report, msg;

			BOOMR.utils.pluginConfig(impl, config, "Errors",
				["onError", "monitorGlobal", "monitorNetwork", "monitorConsole",
				 "monitorEvents", "monitorTimeout", "monitorReporting", "monitorRejections",
				 "sendAfterOnload", "sendInterval", "maxErrors"]);

			if (impl.initialized) {
				return this;
			}

			if (config && typeof config.autorun !== "undefined") {
				impl.autorun = config.autorun;
			}

			impl.initialized = true;

			// TODO determine what we don't support
			impl.supported = true;

			if (!impl.supported) {
				return this;
			}

			// only if we're supported
			BOOMR.subscribe("before_beacon", impl.beforeBeacon, null, impl);
			BOOMR.subscribe("beacon", impl.onBeacon, null, impl);
			BOOMR.subscribe("page_ready", impl.pageReady, null, impl);

			// register an event
			BOOMR.registerEvent("error");

			// hook into window.onError if configured
			if (impl.monitorGlobal) {
				try {
					// globalOnError might be set by loader snippet
					if (!BOOMR.globalOnError) {
						BOOMR.globalOnError = BOOMR.window.onerror;
					}
					else {
						// Another error wrapper came in after us - call this new onerror first.  Since
						// it presumably wrapped our original handler, that will likely be called but
						// will detect Boomerang has loaded and will call *its* original onerror handler.
						if (BOOMR.window.onerror && !BOOMR.window.onerror._bmr) {
							BOOMR.globalOnError = BOOMR.window.onerror;
						}
					}

					BOOMR.window.onerror = function BOOMR_plugins_errors_onerror(message, fileName, lineNumber, columnNumber, error) {
						// onerror may be called with an `ErrorEvent` object (eg. https://github.com/angular/zone.js/issues/1108)
						if (typeof error === "undefined" &&
						    typeof message === "object" && typeof message.error === "object" && message.error !== null) {
							error = message.error;
						}

						// a SyntaxError can produce a null error
						if (typeof error !== "undefined" && error !== null) {
							impl.send(error, E.VIA_GLOBAL_EXCEPTION_HANDLER);
						}
						else {
							// older browsers will not send an error object to the global error handler making deduplication difficult.
							// If an error is caught and reported (eg. in an error wrapper of addEventListener or setTimeout) then it will
							// also be reported here.
							// We could possibly check that the last error in our queue did not arrive via the global error handler
							// and assume it was the same error but more testing will be required. We cannot compare the error message,
							// since the message of the original error and the one that is provided here will be different in some cases.
							impl.send({
								message: message,
								fileName: fileName,
								lineNumber: lineNumber,
								columnNumber: columnNumber,
								noStack: true
							}, E.VIA_GLOBAL_EXCEPTION_HANDLER);
						}

						if (typeof BOOMR.globalOnError === "function") {
							return BOOMR.globalOnError.apply(BOOMR.window, arguments);
						}

						return false; // don't prevent the firing of the default event handler
					};

					// send any errors from the loader snippet
					if (BOOMR.globalErrors) {
						for (var i = 0; i < BOOMR.globalErrors.length; i++) {
							impl.send(BOOMR.globalErrors[i], E.VIA_GLOBAL_EXCEPTION_HANDLER);
						}

						delete BOOMR.globalErrors;
					}
				}
				catch (e) {
					BOOMR.debug("Exception in the window.onerror handler", "Errors");
				}
			}

			// listen for XHR errors
			if (impl.monitorNetwork) {
				BOOMR.subscribe("xhr_error", function BOOMR_plugins_errors_onxhrerror(resource) {
					impl.send({
						code: resource.status,
						message: resource.url,
						noStack: true
					}, E.VIA_NETWORK);
				});
			}


			// listen for unhandled promise rejections
			if (impl.monitorRejections && BOOMR.window.PromiseRejectionEvent) {
				// add event listener instead of window.onunhandledrejection
				BOOMR.utils.addListener(BOOMR.window, "unhandledrejection", function BOOMR_plugins_errors_onrejection(event) {
					var stack, message = "Unhandled Promise Rejection";
					if (event && event.reason) {
						if (typeof event.reason === "string") {
							message = event.reason;
						}
						else {
							if (typeof event.reason.stack === "string") {
								stack = event.reason.stack;
							}
							if (typeof event.reason.message === "undefined") {
								message = impl.normalizeToString(event.reason);
							}
							else {
								message = impl.normalizeToString(event.reason.message);
							}
						}
						impl.send({
							message: message,
							stack: stack,
							noStack: stack ? false : true
						}, E.VIA_REJECTION);
					}
				}, true);
			}

			// listen for calls to console.error
			if (impl.monitorConsole) {
				if (!BOOMR.window.console) {
					BOOMR.window.console = {};
				}

				var globalConsole = BOOMR.window.console.error;

				try {
					BOOMR.window.console.error = function BOOMR_plugins_errors_console_error() {
						// get a copy of the args
						var args = Array.prototype.slice.call(arguments);

						if (args.length === 1) {
							// send just the first argument
							impl.send(impl.normalizeToString(args[0]), E.VIA_CONSOLE);
						}
						else {
							// get the array of arguments
							impl.send(impl.normalizeToString(args), E.VIA_CONSOLE);
						}

						if (typeof globalConsole === "function") {
							if (typeof globalConsole.apply === "function") {
								globalConsole.apply(this, args);
							}
							else {
								globalConsole(args[0], args[1], args[2]);
							}
						}
					};
				}
				catch (h) {
					BOOMR.debug("Exception in the window.console.error handler", "Errors");
				}
			}

			// listen for errors in addEventListener callbacks
			if (impl.monitorEvents) {
				// EventTarget's addEventListener will catch events from window, document, Element and XHR in modern browsers.
				// We want to instrument addEventListener at the end of the protocol chain in order to avoid conflicts with
				// other libraries that might be wrapping AEL at a different level.
				// This pattern is safer since other libraries' wrappers will get called. The downside is that our wrapper
				// will not be called and any error in the AEL callback will be caught by the global error handler instead.
				if (BOOMR.window.EventTarget) {
					impl.wrapFn("addEventListener", BOOMR.window.EventTarget.prototype, true, 1, E.VIA_EVENTHANDLER);
					impl.wrapRemoveEventListener(BOOMR.window.EventTarget.prototype);
				}
				else {
					if (BOOMR.window) {
						impl.wrapFn("addEventListener", BOOMR.window, false, 1, E.VIA_EVENTHANDLER);
						impl.wrapRemoveEventListener(BOOMR.window);
					}

					if (BOOMR.window.Node) {
						impl.wrapFn("addEventListener", BOOMR.window.Node.prototype, true, 1, E.VIA_EVENTHANDLER);
						impl.wrapRemoveEventListener(BOOMR.window.Node.prototype);
					}

					if (BOOMR.window.XMLHttpRequest) {
						impl.wrapFn("addEventListener", BOOMR.window.XMLHttpRequest.prototype, true, 1, E.VIA_EVENTHANDLER);
						impl.wrapRemoveEventListener(BOOMR.window.XMLHttpRequest.prototype);
					}
				}
			}

			// listen for errors in timeout callbacks
			if (impl.monitorTimeout) {
				impl.wrapFn("setTimeout", BOOMR.window, false, 0, E.VIA_TIMEOUT);
				impl.wrapFn("setInterval", BOOMR.window, false, 0, E.VIA_TIMEOUT);
			}

			// listen for Reporting API warnings
			if (impl.monitorReporting && BOOMR.window.ReportingObserver) {
				impl.reportingObserver = new BOOMR.window.ReportingObserver(function(reports, observer) {
					if (BOOMR.utils.isArray(reports)) {
						for (i = 0; i < reports.length; i++) {
							report = reports[i];
							msg = report && report.body && (report.body.message || report.body.reason);
							if (msg) {
								impl.send({
									message: msg,
									fileName: report.body.sourceFile || report.url,
									lineNumber: report.body.lineNumber,
									columnNumber: report.body.columnNumber,
									noStack: true
								}, E.VIA_REPORTING_API);
							}
						}
					}
				}, {buffered: true});
				impl.reportingObserver.observe();
			}


			return this;
		},

		/**
		 * This plugin is always complete (ready to send a beacon)
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Errors
		 */
		is_complete: function() {
			return true;
		},

		/**
		 * Determines if Error tracking is initialized and supported.
		 *
		 * @returns {boolean} `true`
		 * @memberof BOOMR.plugins.Errors
		 */
		is_supported: function() {
			return impl.initialized && impl.supported;
		},

		//
		// Public Exports
		//
		// constants
		/**
		 * This error came from the app
		 */
		SOURCE_APP: 1,

		/**
		 * This error came from Boomerang
		 */
		SOURCE_BOOMERANG: 2,

		//
		// Via: Where the error came from
		//
		/**
		 * This error was generated by {@link BOOMR.plugins.Errors.wrap},
		 * {@link BOOMR.plugins.Errors.test} or {@link BOOMR.plugins.Errors.send}
		 */
		VIA_APP: 1,

		/**
		 * This error was caught by the Global Exception handler (e.g.
		 * `window.onerror`).
		 */
		VIA_GLOBAL_EXCEPTION_HANDLER: 2,

		/**
		 * This was a network error caught by XMLHttpRequest instrumentation.
		 */
		VIA_NETWORK: 3,

		/**
		 * This was caught by `console.error()`
		 */
		VIA_CONSOLE: 4,

		/**
		 * This was caught by monitoring `addEventListener()`
		 */
		VIA_EVENTHANDLER: 5,

		/**
		 * This was caught by monitoring `setTimeout()` or `setInterval()`
		 */
		VIA_TIMEOUT: 6,

		/**
		 * This was caught by monitoring unhandled promise rejection events
		 */
		VIA_REJECTION: 7,

		/**
		 * Observed with the Reporting API
		 */
		VIA_REPORTING_API: 8,

		//
		// Events
		//
		/**
		 * A click event
		 */
		EVENT_CLICK: 1,

		/**
		 * A network event
		 */
		EVENT_NETWORK: 2,

		/**
		 * A console.log event
		 */
		EVENT_LOG: 3,

		// functions
		send: impl.send,
		wrap: impl.wrap,
		test: impl.test,

		// objects
		BoomerangError: BoomerangError

		//
		// Test Exports (only for debug)
		//
		/* BEGIN_DEBUG */,
		BoomerangError: BoomerangError,
		findDuplicateError: impl.findDuplicateError,
		mergeDuplicateErrors: impl.mergeDuplicateErrors,
		compressErrors: impl.compressErrors,
		decompressErrors: impl.decompressErrors,
		normalizeToString: impl.normalizeToString
		/* END_DEBUG */
	};

}());
