/*eslint-env mocha*/

describe("e2e/14-errors/40-unbound-addEventListener", function() {
	it("Should infer BOOMR.window as context for unbound addEventListener calls", function(done) {
		if (typeof window.EventTarget === "undefined") {
			return this.skip();
		}

		assert.equal(BOOMR.window, top);
		assert.equal(BOOMR.window, window.parent);
		(function(){
			// this is the unbound addEventListener call
			addEventListener("foo", function(){
				// this assert is redundant, if we get our callback, it means it fired on the right window
				assert.equal(this, BOOMR.window);
				done();
			});

			var event;
			try {
				event = new Event("foo");
			}
			catch (err) {
				event = window.document.createEvent("Event");
				event.initEvent("foo", true, true);
			}

			this.dispatchEvent(event);
		}).apply(BOOMR.window);
	});

});
