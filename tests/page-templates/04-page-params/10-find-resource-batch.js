/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("e2e/04-page-params/10-find-resource-batch", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var handlerConfigFixture = {
		varname: "test"
	};

	it("Should have Handler exposed on BOOMR.plugins.PageParams", function() {
		assert.isFunction(BOOMR.plugins.PageParams.Handler);
	});

	it("Should have the function findResource on the handlerInstance", function() {
		var Handler = BOOMR.plugins.PageParams.Handler;
		var handlerInstance = new Handler(handlerConfigFixture);
		assert.isFunction(handlerInstance.findResource);
	});

	it("Should return the single resource object if only one resource is found and ResourceTiming is supported ", function() {
		if (t.isResourceTimingSupported()) {
			var Handler = BOOMR.plugins.PageParams.Handler;
			var handlerInstance = new Handler(handlerConfigFixture);
			var resource = handlerInstance.findResource("*id=single*");
			assert.isDefined(resource);
			assert.isDefined(resource.name);
			assert.isString(resource.name);
			assert.include(resource.name, "/delay?delay=1000&id=single&file=/pages/04-page-params/support/img.jpg");
		}
	});

	it("Should return an array of resources if found multiple resources matching the resource RegEx", function() {
		if (t.isResourceTimingSupported()) {
			var Handler = BOOMR.plugins.PageParams.Handler;
			var handlerInstance = new Handler(handlerConfigFixture);
			var resources = handlerInstance.findResources("*img.jpg");
			assert.isDefined(resources);
			assert.isArray(resources);
			assert.lengthOf(resources, 4);
			["/delay?delay=1000&id=single&file=/pages/04-page-params/support/img.jpg",
			 "/delay?delay=1000&id=1&file=/pages/04-page-params/support/img.jpg",
			 "/delay?delay=1000&id=2&file=/pages/04-page-params/support/img.jpg",
			 "/delay?delay=1500&id=3&file=/pages/04-page-params/support/img.jpg"].forEach(function(element, index) {
				 assert.include(resources[index].name, element);
			 });
		}
	});

	it("Should still find the slowest as a one item array containing only the slowest element", function(){
		if (t.isResourceTimingSupported()) {
			var Handler = BOOMR.plugins.PageParams.Handler;
			var handlerInstance = new Handler(handlerConfigFixture);
			var resources = handlerInstance.findResources("slowest");
			assert.isDefined(resources);
			assert.isArray(resources);
			assert.lengthOf(resources, 1);
			var expectedSlowest = "/delay?delay=1500&id=3&file=/pages/04-page-params/support/img.jpg";
			assert.include(resources[0].name, expectedSlowest);
		}
	});

	it("Should return an empty array if findResources can not find the resource", function() {
		if (t.isResourceTimingSupported()) {
			var Handler = BOOMR.plugins.PageParams.Handler;
			var handlerInstance = new Handler(handlerConfigFixture);
			var resources = handlerInstance.findResources("does not exist");
			assert.isDefined(resources);
			assert.isArray(resources);
			assert.lengthOf(resources, 0);
		}
	});

	it("Should return the 2 first resources if limit was specified", function() {
		if (t.isResourceTimingSupported()) {
			var Handler = BOOMR.plugins.PageParams.Handler;
			var handlerInstance = new Handler(handlerConfigFixture);
			var resources = handlerInstance.findResources("*img.jpg", window, 0, 2);
			assert.isDefined(resources);
			assert.isArray(resources);
			assert.lengthOf(resources, 2);
			["/delay?delay=1000&id=single&file=/pages/04-page-params/support/img.jpg",
			 "/delay?delay=1000&id=1&file=/pages/04-page-params/support/img.jpg"].forEach(function(element, index) {
				 assert.include(resources[index].name, element);
			 });
		}
	});
});

