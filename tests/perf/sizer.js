//
// Imports
//
const path = require("path");
const util = require("util");
const fs = require("fs");

// promisify'd functions
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);

//
// Locals
//
const resultsPath = path.join(__dirname, "results");
const testsPath = path.join(__dirname, "..");
const rootPath = path.join(testsPath, "..");
const buildPath = path.join(rootPath, "build");
const buildPluginsPath = path.join(buildPath, "plugins");

//
// Functions
//
/**
 * Gathers size stats
 *
 * @param {object} metrics Metrics recording location
 */
async function run(metrics) {
	metrics.size = {};

	return new Promise(async function(resolve, reject) {
		// Boomerang.js sizes
		metrics.size.boomerang = {};
		metrics.size.boomerang.debug = await getSize(path.join(buildPath, "boomerang-1.0.0-debug.js"));
		metrics.size.boomerang.min = await getSize(path.join(buildPath, "boomerang-1.0.0.min.js"));
		metrics.size.boomerang.min_gz = await getSize(path.join(buildPath, "boomerang-1.0.0.min.js.gz"));

		// Plugin sizes
		let plugins = (await readdir(buildPluginsPath)).filter(fileName => fileName.match(/\.js$/));

		metrics.size.plugins = {};
		metrics.size.plugins.count = plugins.length;

		for (let i = 0; i < plugins.length; i++) {
			const plugin = plugins[i];

			metrics.size.plugins[plugin.replace(".min.js", "")] = await getSize(path.join(buildPluginsPath, plugin));
		}

		resolve();
	});
}

/**
 * Get the size of a file
 *
 * @param {string} filePath File path
 *
 * @returns {number} File size (bytes)
 */
async function getSize(filePath) {
	return new Promise(async function(resolve, reject) {
		const fileStats = await stat(filePath);

		resolve(fileStats.size);
	});
}

//
// Exports
//
exports.run = run;
