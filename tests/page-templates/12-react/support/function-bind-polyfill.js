/**
 * Fix issues with Function.prototype.bind not being available.
 * via: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Polyfill
 **/
(function() {
	if (!Function.prototype.bind) {
		/*eslint-disable no-extend-native*/
		Function.prototype.bind = function(that) {
			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5
				// internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs   = Array.prototype.slice.call(arguments, 1),
			    fToBind = this,
			    fNOP    = function() {},
			    fBound  = function() {
				    return fToBind.apply(this instanceof fNOP
							 ? this
							 : that,
							 aArgs.concat(Array.prototype.slice.call(arguments)));
			    };

			if (this.prototype) {
				// native functions don't have a prototype
				fNOP.prototype = this.prototype;
			}
			fBound.prototype = new fNOP();

			return fBound;
		};
		/*eslint-enable no-extend-native*/
	}
}());
