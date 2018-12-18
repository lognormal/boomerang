//
// Imports
//
const cdp = require("chrome-remote-interface");
const chromeLauncher = require("chrome-launcher");
const config = require("./perf-tests.json5").config;

//
// Functions
//

/**
 * Launches Chrome
 *
 * @returns {object} Chrome and CDP Client objects
 */
async function launchChrome() {
	console.debug("browserUtils.launchChrome: Launching Chrome and CDP");

	// launch Chrome
	const chrome = await chromeLauncher.launch(config.chromeConfig);

	// Waits for the debug protocol
	const client = await cdp();

	client.on("error", function(e) {
		console.error("browserUtils.launchChrome: CDP error", e);
	});

	client.on("disconnect", function(e) {
		console.warn("browserUtils.launchChrome: CDP disconnected", e);
	});

	return { chrome, client };
}

/**
 * Closes Chrome
 *
 * @param {object} client CDP Client
 * @param {object} chrome Chrome
 *
 * @returns {undefined}
 */
async function closeChrome(client, chrome) {
	console.debug("browserUtils.closeChrome: Closing Chrome");

	// close and kill
	await client.close();
	await chrome.kill();
}

//
// Exports
//
exports.launchChrome = launchChrome;
exports.closeChrome = closeChrome;
