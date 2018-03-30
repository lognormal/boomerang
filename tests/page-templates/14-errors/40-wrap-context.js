/*eslint-env mocha*/

describe("e2e/14-errors/40-wrap-context", function() {
	it("Should infer BOOMR.window as context for unbound addEventListener calls", function(done) {
		if (typeof window.EventTarget === "undefined") {
			return this.skip();
		}

		assert.equal(BOOMR.window, top);
		assert.equal(BOOMR.window, window.parent);
		(function(){
			addEventListener("foo", function(){
				// this assert is redundant, if we get our callback, it means it fired on the right window
				assert.equal(this, BOOMR.window);
				done();
			});
			this.dispatchEvent(new Event("foo"));
		}).apply(BOOMR.window);
	});

});
