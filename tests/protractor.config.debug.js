/*eslint-env node*/
/*global jasmine*/
exports.config = {
	onPrepare: function() {
		// The require statement must be down here, since jasmine-reporters
		// needs jasmine to be in the global and protractor does not guarantee
		// this until inside the onPrepare function.
		require("jasmine-reporters");

		jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
	}
};
