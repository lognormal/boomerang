//
// Imports
//
const path = require("path");
const util = require("util");
const fs = require("fs");
const grunt = require("grunt");
const chalk = require("chalk");

// promisify"d functions
const mkdir = util.promisify(fs.mkdir);
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const resultsPath = path.join(__dirname, "results");
const baselineFilePath = path.join(resultsPath, "baseline.json");
const metricsFilePath = path.join(resultsPath, "metrics.json");

//
// Exports
//
module.exports = async function() {
	const done = this.async();

	// check files exist first
	if (!await exists(baselineFilePath)) {
		grunt.log.error(baselineFilePath + " does not exist!  Creat it with 'grunt perf:baseline'");
		return done();
	}

	if (!await exists(metricsFilePath)) {
		grunt.log.error(metricsFilePath + " does not exist!  Creat it with 'grunt perf'");
		return done();
	}

	// load both metrics files
	const baselineMetrics = JSON.parse(await readFile(baselineFilePath, "utf-8"));
	const compareMetrics = JSON.parse(await readFile(metricsFilePath, "utf-8"));

	console.log("Results comparison to baseline:\n");

	for (var scenarioName in compareMetrics) {
		for (var testName in compareMetrics[scenarioName]) {
			for (var metricName in compareMetrics[scenarioName][testName]) {
				const base = baselineMetrics[scenarioName][testName][metricName];
				const cur = compareMetrics[scenarioName][testName][metricName];

				// compare metrics to the baseline
				const diff = cur - base;
				const diffPct = Math.floor(diff / (base ? base : diff) * 100);

				// output display content
				const metricNamePrefix = `${chalk.underline(scenarioName + "." + testName + "." + metricName).padEnd(80)}: `;
				const diffPctSuffix = " (" + (diff > 0 ? "+" : "") + `${chalk.yellow(diffPct + "%")})`;

				// show diffs
				if (!base) {
					console.log(`${metricNamePrefix}${chalk.gray("[missing in baseline]")}`);
				}
				else if (diff === 0 && !grunt.option("diff-only")) {
					console.log(`${metricNamePrefix}=${chalk.green(base)}`);
				}
				else if (diff > 0) {
					console.log(`${metricNamePrefix} ${cur} ${chalk.yellow("+" + diff)}${diffPctSuffix}`);
				}
				else if (diff < 0) {
					console.log(`${metricNamePrefix} ${cur} ${chalk.yellow(diff)}${diffPctSuffix}`);
				}
			}
		}
	}

	done();
};
