//
// Imports
//
const path = require("path");
const util = require("util");
const fs = require("fs");

const writeFile = util.promisify(fs.writeFile);

// allow loading of JSON5 from require()
const JSON5 = require("json5");
require("json5/lib/register");

//
// Imports
//
const Profiler = require("./profiler");
const Sizer = require("./sizer");

//
// Locals
//
const resultsPath = path.join(__dirname, "results");
const allMetricsPath = path.join(resultsPath, "metrics.json");

//
// Exports
//
module.exports = async function() {
	var done = this.async();

	let allMetrics = {};

	//
	// Collect Browser Profiler data
	//
	console.debug("Running Profiler");

	await Profiler.run(allMetrics);

	//
	// Collect script sizes
	//
	console.debug("Running Sizer");

	await Sizer.run(allMetrics);

	//
	// Write out all metrics
	//
	console.debug("Writing out final metrics.json");

	await writeFile(allMetricsPath, JSON.stringify(allMetrics, null, 2));

	done();
};
