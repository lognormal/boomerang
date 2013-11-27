function getStaticTests(Assert) {
	return new YUITest.TestCase({
		name: "Boomerang Static Load",

		testMethodsExist: function() {
			Assert.isObject(BOOMR);
			Assert.isString(BOOMR.version);
			Assert.isObject(BOOMR.session);
			Assert.isObject(BOOMR.utils);
			Assert.isFunction(BOOMR.init);
			Assert.isFunction(BOOMR.debug);
			Assert.isFunction(BOOMR.warn);
			Assert.isObject(BOOMR.plugins);
		}
	});
}

function getMockLoggerTests(Assert) {
	return new YUITest.TestCase({

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

			Assert.areEqual(expected, BOOMR.utils.objectToString(o, "&"));
			Assert.areEqual(expected.replace(/&/g, '\n\t'), BOOMR.utils.objectToString(o));
		},

		testGetCookieNull: function() {
			Assert.isNull(BOOMR.utils.getCookie());
			Assert.isNull(BOOMR.utils.getCookie(""));
			Assert.isNull(BOOMR.utils.getCookie(null));
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
				Assert.isArray(msg.match(/^No cookie name or site domain:/));
			};
			Assert.isFalse(BOOMR.utils.setCookie(""));
			Assert.isFalse(BOOMR.utils.setCookie("myname"));
		},

		testSetCookieTooLong: function() {
			BOOMR.debug = function(msg, src) {
				Assert.isArray(msg.match(/^Cookie too long: /));
			};
			BOOMR.session.domain = "mydomain";
			var value = "";
			for(var i=0; i<400; i++) {
				value += "1";
			}
			Assert.isFalse(BOOMR.utils.setCookie("myname", {a: value}));
		},

		testSetCookieValid: function() {
			// TODO
		},

		testGetSubCookiesNull: function() {
			Assert.isNull(BOOMR.utils.getSubCookies());
			Assert.isNull(BOOMR.utils.getSubCookies(""));
			Assert.isNull(BOOMR.utils.getSubCookies(null));
			Assert.isNull(BOOMR.utils.getSubCookies(undefined));
			Assert.isNull(BOOMR.utils.getSubCookies("&"), "Should be null with &");
			Assert.isNull(BOOMR.utils.getSubCookies("="), "Should be null with =");
			Assert.isNull(BOOMR.utils.getSubCookies("=&="), "Should be null with =&=");
			Assert.isNull(BOOMR.utils.getSubCookies("=foo"), "Should be null with =foo");
			BOOMR.debug = function(msg, src) {
				Assert.areSame(msg, "TypeError: cookie is not a string: number");
			};
			Assert.isNull(BOOMR.utils.getSubCookies(0));
		},

		testGetSubCookiesValid: function() {
			var cookie = "one=1&two=2&three=3rd&four=null&five=undefined&six=0&seven=1.2&eight=" + encodeURIComponent("a=b") + "&nine=" + encodeURIComponent("1,2") + "&%3d=&10=11&11";

			var o = BOOMR.utils.getSubCookies(cookie);
			Assert.isNotNull(o);
			Assert.isObject(o);

			Assert.areSame(o.one, "1");
			Assert.areSame(o.two, "2");
			Assert.areSame(o.three, "3rd");
			Assert.areSame(o.four, "null");
			Assert.areSame(o.five, "undefined");
			Assert.areSame(o.six, "0");
			Assert.areSame(o.seven, "1.2");
			Assert.areSame(o.eight, "a=b");
			Assert.areSame(o.nine, "1,2");
			Assert.areSame(o["="], "");
			Assert.areSame(o["10"], "11");
			Assert.areSame(o["11"], "");
		},

		testRemoveCookieNoName: function() {
			BOOMR.debug = function(msg, src) {
				Assert.isArray(msg.match(/^No cookie name or site domain:/));
			};
			Assert.isFalse(BOOMR.utils.removeCookie());
			Assert.isFalse(BOOMR.utils.removeCookie("mycookie"));
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
			Assert.isUndefined(BOOMR.utils.cleanupURL());
			Assert.isNull(BOOMR.utils.cleanupURL(null));
			Assert.areSame("", BOOMR.utils.cleanupURL(""));
		},

		testCleanupURLActualURLNoStrip: function() {
			var url = "http://lognormal.github.io/?hello=world";
			Assert.areEqual(url, BOOMR.utils.cleanupURL(url));
		},

		testHashQueryStringNoURL: function() {
			Assert.isUndefined(BOOMR.utils.hashQueryString());
			Assert.isNull(BOOMR.utils.hashQueryString(null));
			Assert.areSame("", BOOMR.utils.hashQueryString(""));
		},

		testHashQueryString: function() {
			var url = "http://lognormal.github.io/#hello";
			Assert.areEqual(url, BOOMR.utils.hashQueryString(url), "No QS");
			url = "http://lognormal.github.io/?hello=world#hello";
			Assert.areEqual(url, BOOMR.utils.hashQueryString(url), "With QS");
			var expected = "http://lognormal.github.io/?hello=world";
			Assert.areEqual(expected, BOOMR.utils.hashQueryString(url, true), "With QS strip Hash");
		},

		testPluginConfig: function() {
			var o = {};
			var config = { ABC: { one: 1, two: [2], three: "3rd", four: 4.1, five: false } };

			Assert.isFalse(BOOMR.utils.pluginConfig(o, config, "DEF", []));
			Assert.isFalse(BOOMR.utils.pluginConfig(o, config, "ABC", []));
			Assert.isFalse(BOOMR.utils.pluginConfig(o, config, "DEF", ["one", "two"]));
			Assert.isTrue(BOOMR.utils.pluginConfig(o, config, "ABC", ["one", "two"]));

			Assert.areSame(1, o.one);
			Assert.isArray(o.two);
			Assert.areEqual(1, o.two.length);
			Assert.areEqual(2, o.two[0]);
			Assert.isUndefined(o.three);

			Assert.isTrue(BOOMR.utils.pluginConfig(o, config, "ABC", ["five"]));

			Assert.areSame(1, o.one);
			Assert.isArray(o.two);
			Assert.areEqual(1, o.two.length);
			Assert.areEqual(2, o.two[0]);
			Assert.isUndefined(o.three);
			Assert.isNotUndefined(o.five);
			Assert.isFalse(o.five);
		}

	});
}

function getInitTests(Assert) {
	return new YUITest.TestCase({
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
					Assert.isArray(m.match(this.matcher));
				}
				else {
					Assert.areEqual(this.matcher, m);
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

			Assert.areSame(BOOMR, o, "BOOMR.init did not return BOOMR");
			Assert.areEqual(domain, BOOMR.session.domain);

			this.logger.matcher = "--test init--";
			BOOMR.log(this.logger.matcher);
		},

		testSetCookieNotOnline: function() {
			this.logger.matcher = /^Saved cookie value doesn't match what we tried to set:/
			Assert.isFalse(BOOMR.utils.setCookie("myname", {name: "value"}));
		},

		testSetCookieOnline: function() {
			Assert.isTrue(BOOMR.utils.setCookie("myname", {name: "value"}));
		},

		testCleanupURLActualURLStrip: function() {
			var url = "http://lognormal.github.io/?hello=world";
			var expected = "http://lognormal.github.io/?qs-redacted";
			Assert.areEqual(expected, BOOMR.utils.cleanupURL(url));
		},


	});
}
