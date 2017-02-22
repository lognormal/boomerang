/*eslint-env mocha*/
/*global chai,describe,it*/

describe("BOOMR.plugins.AutoXHR.MutationHandler", function() {
	var assert = chai.assert;
	var t = BOOMR_test;
	it("Should return interesting true from wait_for_node if container has network bound resources", function() {
		if (t.isMutationObserverSupported()) {
			// Get current handler
			var handler = BOOMR.plugins.AutoXHR.getMutationHandler();
			var imgPath = "/pages/07-autoxhr/support/img.jpg";
			// Pre-Fill pending events so it will find this on recursing the wait_for_node call for the child image
			var index = handler.pending_events.push({
				complete: false,
				url: null,
				resource: {
					timing: {}
				},
				resources: [],
				nodes_to_wait: 0
			});

			var element = document.createElement("div");
			var img = document.createElement("img");
			img.src = imgPath;
			element.appendChild(img);

			// Expect size of interesting to be 1 based on the number of network bound items in the container (1 img tag)
			var expect = 1;
			var interesting = handler.wait_for_node(element, 0);

			// Return test
			assert.equal(interesting, expect);

			// Validating that pending_events was filled correctly
			assert.include(handler.pending_events[index - 1].resource.url, imgPath);
			assert.equal(handler.pending_events[index - 1].resources.length, 1);
			assert.deepEqual(handler.pending_events[index - 1].resources[0], img);
			assert.equal(handler.pending_events[index - 1].urls[img.src], 1);
		}
	});
});
