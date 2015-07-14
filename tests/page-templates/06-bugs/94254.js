/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/94254", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should send a beacon", function(){
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should not have an element in the iframe", function(done){
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {

			var observer = new MutationObserver(function(mutations) {
				assert.isArray(mutations);
				assert.lengthOf(mutations, 2);

				assert.lengthOf(mutations[0].addedNodes, 1);
				assert.lengthOf(mutations[1].removedNodes, 1);

				assert.strictEqual(mutations[0].addedNodes[0].nodeName, "SCRIPT");
				assert.strictEqual(mutations[1].removedNodes[0].nodeName, "SCRIPT");

				assert.include(mutations[0].addedNodes[0].src, "boomerang.test");
				assert.include(mutations[1].removedNodes[0].src, "boomerang.test");

				observer.disconnect();
				done();
			});
			observer.observe(document.head, { attributes: true, childList: true, characterData: false });
		}
		else {
			done();
		}
	});
});
