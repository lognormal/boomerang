function getStaticTests(Y) {
	return new Y.Test.Case({
		name: "PageParams Static Load",

		testMethodsExist: function() {
			Y.Assert.isObject(BOOMR);
			Y.Assert.isObject(BOOMR.plugins);
			Y.Assert.isObject(BOOMR.plugins.PageParams);
		},

		testNotComplete: function() {
			Y.Assert.isFalse(BOOMR.plugins.PageParams.is_complete());
		}
	});
}

function getInitTests(Y) {
	return new Y.Test.Case({
		name: "PageParams Static Load: Init",

		_should: {
			ignore: {
			}
		},

		logger: {
			matcher: undefined,
			log: function(m, l, s) {
				if(this.matcher === undefined) {
					return;
				}
				if(this.matcher instanceof RegExp) {
					Y.Assert.isArray(m.match(this.matcher));
				}
				else {
					Y.Assert.areEqual(this.matcher, m);
				}
			}
		},

		run_assertions: function(vars, data) {
			this.beaconVars = vars;
			this.resume();
		},

		testPageGroupCustomBasic: function() {
			var test = this;

			// 1. Define a global variable
			window.PageGroupVariable = "PageGroup";

			// 2. Tell PageParams to look for a basic JavaScript variable
			var o = BOOMR.init({
				autorun: false,
				PageParams: {
					pageGroups: [
						{
							parameter1: "PageGroupVariable"
						}
					],
				},
				log: null
			});

			// 3. Subscribe to the before_beacon method so we can tell if our params are available
			BOOMR.subscribe(
				"before_beacon",
				this.run_assertions,
				null,
				this
			);

			// 4. We'll now fire the page ready event so that boomerang runs the code
			BOOMR.page_ready();

			this.wait(function() {
				Y.Assert.isTrue(BOOMR.plugins.PageParams.is_complete());
			
				Y.Assert.isTrue(test.beaconVars.hasOwnProperty("h.pg"), "beacon does not contain h.pg parameter");
				Y.Assert.areEqual("PageGroup", test.beaconVars["h.pg"]);
			}, 100);
		}
	});
}
