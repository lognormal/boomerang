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

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};

	if (BOOMR.plugins.Errors) {
		return;
	}

	//
	// Constants
	//

	// functions to strip
	var STACK_FUNCTIONS_REMOVE = [
		"BOOMR_addError",
		"createStackForSend",
		"BOOMR.window.console.error",
		"BOOMR.plugins.Errors.init",
		"BOOMR.window.onerror",
		// below matches multiple functions:
		"BOOMR_plugins_errors_"
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
		var frame, frames, lastFrame, forceUpdate = false, i, j,
		    now = BOOMR.now();

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
					if (frames[i].functionName) {
						for (j = 0; j < STACK_FUNCTIONS_REMOVE.length; j++) {
							if (frames[i].functionName.indexOf(STACK_FUNCTIONS_REMOVE[j]) !== -1) {
								frames.splice(i, 1);
								forceUpdate = true;

								// outloop continues with the next element
								i--;
								break;
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
		if (error.message &&
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
		sendAfterOnload: false,
		isDuringLoad: true,
		maxErrors: 10,
		sendInterval: 1000,
		sendIntervalId: -1,
		maxEvents: 10,

		// state
		initialized: false,
		supported: false,

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

		//
		// Public Functions
		//
		/**
		 * Sends an error
		 *
		 * @param {Error|String} error Error object or message
		 */
		send: function(error, via, source) {
			var now = BOOMR.now();

			if (!error) {
				return;
			}

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
						error.timestamp =  now;

						impl.addError(error, via, source);
					}
				}

				createStackForSend();
			}
			else {
				// add the timestamp
				error.timestamp = now;

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
			var onErrorResult, err, dup = false;

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
			BOOMR.fireEvent("onerror", dup || err);

			// add to our current queue
			impl.mergeDuplicateErrors(impl.q, err, true);

			if (!impl.isDuringLoad && impl.sendIntervalId === -1) {
				if (dup) {
					// If this is not during a load, and it's a duplicate of
					// a previous error, don't send a beacon just for itself
					return;
				}

				// errors outside of a load will be sent at the next interval
				impl.sendIntervalId = setTimeout(function() {
					impl.sendIntervalId = -1;

					// change this to an 'error' beacon
					BOOMR.addVar("http.initiator", "error");

					// set it as an API beacon, which means it won't have any timing data
					BOOMR.addVar("api", 1);

					// add our errors to the beacon
					impl.addErrorsToBeacon();

					// send it!
					BOOMR.sendBeacon();
				}, impl.sendInterval);
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
		 * Fired 'onbeacon'
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

			that[functionName] = function() {
				try {
					var args = Array.prototype.slice.call(arguments);
					var callbackFn = args[callbackIndex];
					var targetObj = useCallingObject ? this : that;
					var wrappedFn = impl.wrap(callbackFn, targetObj, via);

					args[callbackIndex] = wrappedFn;

					if (functionName === "addEventListener") {
						// for removeEventListener we need to keep track of this
						// unique tuple of target object, event name (arg0), original function
						// and capture (arg2)
						impl.trackFn(targetObj, args[0], callbackFn, args[2], wrappedFn);
					}

					return origFn.apply(targetObj, args);
				}
				catch (e) {
					// error during original callback setup
					impl.send(e, via);
				}
			};
		},

		/**
		 * Tracks the specified function for removeEventListener.
		 *
		 * @param {object} target Target element (window, element, etc)
		 * @param {string} type Event type (name)
		 * @param {function} listener Original listener
		 * @param {boolean} useCapture Use capture
		 * @param {function} wrapped Wrapped function
		 */
		trackFn: function(target, type, listener, useCapture, wrapped) {
			if (!target) {
				return;
			}

			if (impl.trackedFnIdx(target, type, listener, useCapture) !== -1) {
				// already tracked
				return;
			}

			if (!target._bmrEvents) {
				target._bmrEvents = [];
			}

			target._bmrEvents.push([type, listener, !!useCapture, wrapped]);
		},

		/**
		 * Gets the index of the tracked function.
		 *
		 * @param {object} target Target element (window, element, etc)
		 * @param {string} type Event type (name)
		 * @param {function} listener Original listener
		 * @param {boolean} useCapture Use capture
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

			for (i = 0; i < target._bmrEvents.length; i++) {
				f = target._bmrEvents[i];
				if (f[0] === type &&
				    f[1] === listener &&
				    f[2] === !!useCapture) {
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
				idx = impl.trackedFnIdx(this, type, listener, useCapture);
				if (idx !== -1) {
					wrappedFn = this._bmrEvents[idx][3];

					// remove our wrapped function instead
					origFn.call(this, type, wrappedFn, useCapture);

					// remove bookkeeping
					this._bmrEvents.splice(idx, 1);
				}
				else {
					// unknown, pass original args
					origFn.call(this, type, listener, useCapture);
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
					// error during callback
					impl.send(e, via);
				}
			};
		},

		/**
		 * Runs the function, watching for exceptions
		 *
		 * @param {function} fn Function
		 * @param {object} that Target object
		 * @param {object[]} args Arguments
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
			if (obj === undefined) {
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

	var E = BOOMR.plugins.Errors = {
		init: function(config) {
			BOOMR.utils.pluginConfig(impl, config, "Errors",
				["onError", "monitorGlobal", "monitorNetwork", "monitorConsole",
				 "monitorEvents", "monitorTimeout", "sendAfterOnload",
				 "sendInterval", "maxErrors"]);

			if (impl.initialized) {
				return this;
			}

			impl.initialized = true;

			// TODO determine what we don't support
			impl.supported = true;

			if (!impl.supported) {
				return this;
			}

			// only if we're supported
			BOOMR.subscribe("before_beacon", impl.beforeBeacon, null, impl);
			BOOMR.subscribe("onbeacon", impl.onBeacon, null, impl);
			BOOMR.subscribe("page_ready", impl.pageReady, null, impl);

			// register an event
			BOOMR.registerEvent("onerror");

			// hook into window.onError if configured
			if (impl.monitorGlobal) {
				try {
					var globalOnError = BOOMR.window.onerror;

					BOOMR.window.onerror = function BOOMR_plugins_errors_onerror(message, fileName, lineNumber, columnNumber, error) {
						// a SyntaxError can produce a null error
						if (typeof error !== "undefined" && error !== null) {
							impl.send(error, E.VIA_GLOBAL_EXCEPTION_HANDLER);
						}
						else {
							impl.send({
								message: message,
								fileName: fileName,
								lineNumber: lineNumber,
								columnNumber: columnNumber,
								noStack: true
							}, E.VIA_GLOBAL_EXCEPTION_HANDLER);
						}

						if (typeof globalOnError === "function") {
							globalOnError.apply(window, arguments);
						}
					};
				}
				catch (e) {
					BOOMR.debug("Exception in the window.onerror handler", "Errors");
				}
			}

			// listen for XHR errors
			if (impl.monitorNetwork) {
				BOOMR.subscribe("onxhrerror", function BOOMR_plugins_errors_onxhrerror(resource) {
					impl.send({
						code: resource.status,
						message: resource.url,
						noStack: true
					}, E.VIA_NETWORK);
				});
			}

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

			if (impl.monitorEvents && BOOMR.window.addEventListener && BOOMR.window.Element) {
				impl.wrapFn("addEventListener", BOOMR.window, false, 1, E.VIA_EVENTHANDLER);
				impl.wrapFn("addEventListener", BOOMR.window.Element.prototype, true, 1, E.VIA_EVENTHANDLER);
				impl.wrapFn("addEventListener", BOOMR.window.XMLHttpRequest.prototype, true, 1, E.VIA_EVENTHANDLER);

				impl.wrapRemoveEventListener(BOOMR.window);
				impl.wrapRemoveEventListener(BOOMR.window.Element.prototype);
				impl.wrapRemoveEventListener(BOOMR.window.XMLHttpRequest.prototype);
			}

			if (impl.monitorTimeout) {
				impl.wrapFn("setTimeout", BOOMR.window, false, 0, E.VIA_TIMEOUT);
				impl.wrapFn("setInterval", BOOMR.window, false, 0, E.VIA_TIMEOUT);
			}

			return this;
		},
		is_complete: function() {
			return true;
		},
		is_supported: function() {
			return impl.initialized && impl.supported;
		},
		//
		// Public Exports
		//
		// constants
		SOURCE_APP: 1,
		SOURCE_BOOMERANG: 2,

		VIA_APP: 1,
		VIA_GLOBAL_EXCEPTION_HANDLER: 2,
		VIA_NETWORK: 3,
		VIA_CONSOLE: 4,
		VIA_EVENTHANDLER: 5,
		VIA_TIMEOUT: 6,

		EVENT_CLICK: 1,
		EVENT_NETWORK: 2,
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
