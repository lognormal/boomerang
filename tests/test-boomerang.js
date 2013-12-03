function getStaticTests(Y) {
	return new Y.Test.Case({
		name: "Boomerang Static Load",

		testMethodsExist: function() {
			Y.Assert.isObject(BOOMR);
			Y.Assert.isString(BOOMR.version);
			Y.Assert.isObject(BOOMR.session);
			Y.Assert.isObject(BOOMR.utils);
			Y.Assert.isFunction(BOOMR.init);
			Y.Assert.isFunction(BOOMR.debug);
			Y.Assert.isFunction(BOOMR.warn);
			Y.Assert.isObject(BOOMR.plugins);
		}
	});
}

function getMockLoggerTests(Y) {
	return new Y.Test.Case({

		name: "Boomerang Static Load: Logger Munged",

		_should: {
			ignore: {
				testGetCookieExists: true,
				testGetCookieName0: true,
				testGetCookieNotExists: true,
				testSetCookieValid: true,
				testRemoveCookieExists: true,
				testRemoveCookieName0: true,
				testRemoveCookieNotExists: true
			}
		},

		setUp: function() {
			this.debug = BOOMR.debug;
		},

		tearDown: function() {
			BOOMR.debug = this.debug;
		},

		testObjectToString: function() {
			var o = { one: 1, two: 2, three: "3rd", four: null, five: undefined, six: 0, seven: 1.2, eight: "a=b", nine: [1, 2] };
			var expected = "one=1&two=2&three=3rd&four=null&five=undefined&six=0&seven=1.2&eight=" + encodeURIComponent("a=b") + "&nine=" + encodeURIComponent("1,2");

			Y.Assert.areEqual(expected, BOOMR.utils.objectToString(o, "&"));
			Y.Assert.areEqual(expected.replace(/&/g, '\n\t'), BOOMR.utils.objectToString(o));
		},

		testGetCookieNull: function() {
			Y.Assert.isNull(BOOMR.utils.getCookie());
			Y.Assert.isNull(BOOMR.utils.getCookie(""));
			Y.Assert.isNull(BOOMR.utils.getCookie(null));
		},

		testGetCookieExists: function() {
			// TODO
		},

		testGetCookieName0: function() {
			// TODO test getting a cookie with name == 0
		},

		testGetCookieNotExists: function() {
			// TODO
		},

		testSetCookieNoNameOrDomain: function() {
			BOOMR.debug = function(msg, src) {
				Y.Assert.isArray(msg.match(/^No cookie name or site domain:/));
			};
			Y.Assert.isFalse(BOOMR.utils.setCookie(""));
			Y.Assert.isFalse(BOOMR.utils.setCookie("myname"));
		},

		testSetCookieTooLong: function() {
			BOOMR.debug = function(msg, src) {
				Y.Assert.isArray(msg.match(/^Cookie too long: /));
			};
			BOOMR.session.domain = "mydomain";
			var value = "";
			for(var i=0; i<400; i++) {
				value += "1";
			}
			Y.Assert.isFalse(BOOMR.utils.setCookie("myname", {a: value}));
		},

		testSetCookieValid: function() {
			// TODO
		},

		testGetSubCookiesNull: function() {
			Y.Assert.isNull(BOOMR.utils.getSubCookies());
			Y.Assert.isNull(BOOMR.utils.getSubCookies(""));
			Y.Assert.isNull(BOOMR.utils.getSubCookies(null));
			Y.Assert.isNull(BOOMR.utils.getSubCookies(undefined));
			Y.Assert.isNull(BOOMR.utils.getSubCookies("&"), "Should be null with &");
			Y.Assert.isNull(BOOMR.utils.getSubCookies("="), "Should be null with =");
			Y.Assert.isNull(BOOMR.utils.getSubCookies("=&="), "Should be null with =&=");
			Y.Assert.isNull(BOOMR.utils.getSubCookies("=foo"), "Should be null with =foo");
			BOOMR.debug = function(msg, src) {
				Y.Assert.areSame(msg, "TypeError: cookie is not a string: number");
			};
			Y.Assert.isNull(BOOMR.utils.getSubCookies(0));
		},

		testGetSubCookiesValid: function() {
			var cookie = "one=1&two=2&three=3rd&four=null&five=undefined&six=0&seven=1.2&eight=" + encodeURIComponent("a=b") + "&nine=" + encodeURIComponent("1,2") + "&%3d=&10=11&11";

			var o = BOOMR.utils.getSubCookies(cookie);
			Y.Assert.isNotNull(o);
			Y.Assert.isObject(o);

			Y.Assert.areSame(o.one, "1");
			Y.Assert.areSame(o.two, "2");
			Y.Assert.areSame(o.three, "3rd");
			Y.Assert.areSame(o.four, "null");
			Y.Assert.areSame(o.five, "undefined");
			Y.Assert.areSame(o.six, "0");
			Y.Assert.areSame(o.seven, "1.2");
			Y.Assert.areSame(o.eight, "a=b");
			Y.Assert.areSame(o.nine, "1,2");
			Y.Assert.areSame(o["="], "");
			Y.Assert.areSame(o["10"], "11");
			Y.Assert.areSame(o["11"], "");
		},

		testRemoveCookieNoName: function() {
			BOOMR.debug = function(msg, src) {
				Y.Assert.isArray(msg.match(/^No cookie name or site domain:/));
			};
			Y.Assert.isFalse(BOOMR.utils.removeCookie());
			Y.Assert.isFalse(BOOMR.utils.removeCookie("mycookie"));
		},

		testRemoveCookieExists: function() {
			// TODO
		},

		testRemoveCookieName0: function() {
			// TODO test removing a cookie with name == 0
		},

		testRemoveCookieNotExists: function() {
			// TODO
		},

		testCleanupURLNull: function() {
			Y.Assert.isUndefined(BOOMR.utils.cleanupURL());
			Y.Assert.isNull(BOOMR.utils.cleanupURL(null));
			Y.Assert.areSame("", BOOMR.utils.cleanupURL(""));
		},

		testCleanupURLActualURLNoStrip: function() {
			var url = "http://lognormal.github.io/?hello=world";
			Y.Assert.areEqual(url, BOOMR.utils.cleanupURL(url));
		},

		testHashQueryStringNoURL: function() {
			Y.Assert.isUndefined(BOOMR.utils.hashQueryString());
			Y.Assert.isNull(BOOMR.utils.hashQueryString(null));
			Y.Assert.areSame("", BOOMR.utils.hashQueryString(""));
		},

		testHashQueryString: function() {
			var url = "http://lognormal.github.io/#hello";
			Y.Assert.areEqual(url, BOOMR.utils.hashQueryString(url), "No QS");
			url = "http://lognormal.github.io/?hello=world#hello";
			Y.Assert.areEqual(url, BOOMR.utils.hashQueryString(url), "With QS");
			var expected = "http://lognormal.github.io/?hello=world";
			Y.Assert.areEqual(expected, BOOMR.utils.hashQueryString(url, true), "With QS strip Hash");
		},

		testPluginConfig: function() {
			var o = {};
			var config = { ABC: { one: 1, two: [2], three: "3rd", four: 4.1, five: false } };

			Y.Assert.isFalse(BOOMR.utils.pluginConfig(o, config, "DEF", []));
			Y.Assert.isFalse(BOOMR.utils.pluginConfig(o, config, "ABC", []));
			Y.Assert.isFalse(BOOMR.utils.pluginConfig(o, config, "DEF", ["one", "two"]));
			Y.Assert.isTrue(BOOMR.utils.pluginConfig(o, config, "ABC", ["one", "two"]));

			Y.Assert.areSame(1, o.one);
			Y.Assert.isArray(o.two);
			Y.Assert.areEqual(1, o.two.length);
			Y.Assert.areEqual(2, o.two[0]);
			Y.Assert.isUndefined(o.three);

			Y.Assert.isTrue(BOOMR.utils.pluginConfig(o, config, "ABC", ["five"]));

			Y.Assert.areSame(1, o.one);
			Y.Assert.isArray(o.two);
			Y.Assert.areEqual(1, o.two.length);
			Y.Assert.areEqual(2, o.two[0]);
			Y.Assert.isUndefined(o.three);
			Y.Assert.isNotUndefined(o.five);
			Y.Assert.isFalse(o.five);
		}

	});
}

function getInitTests(Y) {
	return new Y.Test.Case({
		name: "Boomerang Static Load: Init",

		_should: {
			ignore: {
				testSetCookieNotOnline: !location.href.match(/^file:/),
				testSetCookieOnline: !location.href.match(/^https?:/)
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

		testInit: function() {
			var test = this;
			var domain = "lognormal.github.io";
			var o = BOOMR.init({
				strip_query_string: true,
				site_domain: domain,
				log: function(m, l, s) {
					test.logger.log(m, l, s);
				}
			});

			Y.Assert.areSame(BOOMR, o, "BOOMR.init did not return BOOMR");
			Y.Assert.areEqual(domain, BOOMR.session.domain);

			this.logger.matcher = "--test init--";
			BOOMR.log(this.logger.matcher);
		},

		testSetCookieNotOnline: function() {
			this.logger.matcher = /^Saved cookie value doesn't match what we tried to set:/
			Y.Assert.isFalse(BOOMR.utils.setCookie("myname", {name: "value"}));
		},

		testSetCookieOnline: function() {
			Y.Assert.isTrue(BOOMR.utils.setCookie("myname", {name: "value"}));
		},

		testCleanupURLActualURLStrip: function() {
			var url = "http://lognormal.github.io/?hello=world";
			var expected = "http://lognormal.github.io/?qs-redacted";
			Y.Assert.areEqual(expected, BOOMR.utils.cleanupURL(url));
		},

		testInitPlugin: function() {
			var mockPlugin = Y.Mock();
			var mockConfig = {
				mockPlugin: {
					test: "abc",
					arr: []
				}
			};

			Y.Mock.expect(mockPlugin, {
				method: "init",
				args: [mockConfig]
			});

			BOOMR.plugins.mockPlugin = mockPlugin;

			BOOMR.init(mockConfig);

			Y.Mock.verify(mockPlugin);
		}

	});
}
