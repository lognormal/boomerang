/*eslint-env node*/
/*global jasmine*/

exports.config = {
	onPrepare: function() {
		// The require statement must be down here, since jasmine-reporters
		// needs jasmine to be in the global and protractor does not guarantee
		// this until inside the onPrepare function.
		require("jasmine-reporters");

		var junitReporter = new jasmine.JUnitXmlReporter("tests/results", true, true, "e2e", true);

		jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
		jasmine.getEnv().addReporter(junitReporter);
	}
};
