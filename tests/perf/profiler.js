//
// Imports
//
const path = require("path");
const util = require("util");
const fs = require("fs");
const CpuProfileFilter = require("cpuprofile-filter");
const now = require("performance-now");
const Stats = require("fast-stats").Stats;

// promisify'd functions
const mkdir = util.promisify(fs.mkdir);
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// local modules
const BrowserUtils = require("./browser-utils");

// test information
const testsFile = path.join(__dirname, "perf-tests.json5");
const perfTestConfig = require(testsFile);
const config = perfTestConfig.config;

// scenario information
const scenariosFile = path.join(__dirname, "scenarios.json");

const resultsPath = path.join(__dirname, "results");

// Browser functions
let navTimingJavaScript;
let marksJavaScript;
let measuresJavaScript;

//
// Functions
//
/**
 * Gets the URL for a test
 *
 * @param {string} urlPath URL path
 *
 * @returns {string} URL for a test
 */
function getUrl(urlPath) {
	return `http://${perfTestConfig.server.main}:${perfTestConfig.ports.main}${urlPath}`;
}

/**
 * Ensures the specified directory exists
 *
 * @param {string} dir Directory
 */
async function ensureDirectory(dir) {
	if (!await exists(dir)) {
		console.log(`Creating ${dir}`);

		await mkdir(dir);
	}
}

/**
 * Runs the profiler
 */
async function run(allMetrics) {
	const scenarios = require(scenariosFile).tests;

	return new Promise(async function(resolve, reject) {
		// load JavaScript we'll be executing in the Chrome process
		navTimingJavaScript = await readFile(path.join(__dirname, "utils", "browser-fetch-navtiming.js"), "utf-8");
		marksJavaScript = await readFile(path.join(__dirname, "utils", "browser-fetch-marks.js"), "utf-8");
		measuresJavaScript = await readFile(path.join(__dirname, "utils", "browser-fetch-measures.js"), "utf-8");

		console.log(`Running ${scenarios.length} Profiler scenarios`);

		// make sure our results path exist
		await ensureDirectory(resultsPath);

		// iterate through all scenarios
		for (var i = 0; i < scenarios.length; i++) {
			const scenario = scenarios[i];

			// metrics for this scenario
			let scenarioMetrics = {};

			// name and path
			const scenarioName = scenario.path + "." + scenario.file;
			const scenarioUrl = `/perf/pages/${scenario.path}/${scenario.file}.html`;

			console.log(`Scenario: ${scenarioName}:`);

			// ensure the scenario results directory exists
			let scenarioPath = path.join(resultsPath, scenarioName);
			await ensureDirectory(scenarioPath);

			// iterate the specific number of times from config
			for (var j = 1; j <= config.iterations; j++) {
				console.log(`Iteration #${j}:`);

				// gather Profiler data for this URL
				const results = await loadAndGatherProfile(getUrl(scenarioUrl));

				console.debug("Analyzing results...");

				// analyze the results
				const analysis = await analyzeResults(results);

				// create a [n].metrics.json for this iteration
				let metricsPath = path.join(scenarioPath, `${j}.metrics.json`);
				await writeFile(metricsPath, JSON.stringify(analysis.metrics, null, 2));

				// add to scenario overall metrics
				for (var metricName in analysis.metrics) {
					if (!scenarioMetrics[metricName]) {
						scenarioMetrics[metricName] = new Stats();
					}

					scenarioMetrics[metricName].push(analysis.metrics[metricName]);
				}

				// write raw results to disk
				console.debug("Writing results to disk");
				for (var rawData in analysis.raw) {
					let rawDataPath = path.join(scenarioPath, `${j}.${rawData}`);

					if (typeof analysis.raw[rawData] !== "undefined") {
						await writeFile(rawDataPath, JSON.stringify(analysis.raw[rawData], null, 2));
					}
				}
			}

			// calculate stats on metrics
			for (var metric in scenarioMetrics) {
				// calculate median for this scenario
				scenarioMetrics[metric] = scenarioMetrics[metric].median();

				// copy to all metrics
				allMetrics[scenario.path] = allMetrics[scenario.path] || {};
				allMetrics[scenario.path][scenario.file] = allMetrics[scenario.path][scenario.file] || {};
				allMetrics[scenario.path][scenario.file][metric] = scenarioMetrics[metric];
			}

			// write metrics for this test
			let metricsPath = path.join(scenarioPath, "metrics.json");
			await writeFile(metricsPath, JSON.stringify(scenarioMetrics, null, 2));
		}

		resolve();
	});
}

/**
 * Sleeps for the specified number of milliseconds
 *
 * @param {number} n Milliseconds
 */
const sleep = n => new Promise(resolve => setTimeout(resolve, n));

/**
 * Analyzes results
 *
 * @param {object} results Results
 */
async function analyzeResults(results) {
	return new Promise(function(resolve, reject) {
		console.debug("Analyzing Profile and writing to disk...");

		// get filtered Profiler data to just boomerang
		var filteredProfile = CpuProfileFilter.filter(results.profile, {
			files: [
				"boomerang-latest-debug"
			]
		});

		// Metrics output
		var metrics = {
			// Metrics
			metrics: {
				// NavigationTiming metrics
				page_load_time: results.navigationTiming ?
					(results.navigationTiming.loadEventEnd - results.navigationTiming.navigationStart) :
					0,

				// JavaScript CPU time from Profiler
				boomerang_javascript_time: Math.floor(filteredProfile.cpuTimeFiltered / 1000),
				total_javascript_time: Math.floor(filteredProfile.cpuTime / 1000)
			},
			// Raw data
			raw: {
				cpuprofile: results.profile,
				"marks.json": results.marks,
				"measures.json": results.measures,
				"navigationTiming.json": results.navigationTiming
			}
		};

		//
		// Marks
		//

		// find unique mark names (ignoring :end ones)
		const markNames = [...new Set(results.marks.map(mark => mark.name))]
			// remove all end calls
			.filter(markName => markName.indexOf(":end") === -1);

		markNames.forEach(function(markName) {
			const fixedName = markName
				// strip boomr: prefix
				.replace("boomr:", "")

				// swap all :s with _s
				.replace(/:/g, "_")

				// only look at start calls
				.replace("_start", "");

			metrics.metrics["mark_" + fixedName + "_called"] = results.marks.filter(mark => mark.name === markName).length;
		});

		//
		// Measures
		//

		// find unique meausre names (ignoring :end ones)
		const measureNames = [...new Set(results.measures.map(measure => measure.name))];

		measureNames.forEach(function(measureName) {
			const fixedName = measureName
				// strip boomr: prefix
				.replace("boomr:", "")

				// swap all :s with _s
				.replace(/:/g, "_");

			const measures = results.measures.filter(measure => measure.name === measureName);
			metrics.metrics["measure_" + fixedName + "_called"] = measures.length;

			var measureStat = new Stats();

			measures.forEach(function(measure) {
				measureStat.push(measure.duration);
			});

			metrics.metrics["measure_" + fixedName + "_median"] = Math.ceil(measureStat.median());
			metrics.metrics["measure_" + fixedName + "_sum"] = Math.ceil(measureStat.sum);
		});

		resolve(metrics);
	});
}

/**
 * Runs the Profiler on the specified web page
 *
 * @param {string} url URL
 * @param {function} callback Completion callback
 *
 * @returns {undefined}
 */
async function loadAndGatherProfile(url) {
	return new Promise(async function(resolve, reject) {
		console.debug(`Loading ${url}...`);

		let startTime = 0;
		let loadTime = 0;

		// launch Chrome
		const { chrome, client } = await BrowserUtils.launchChrome();

		// CDP objects we need to interact with
		const { Profiler, Page, Runtime } = client;

		// enable domains to get events
		await Page.enable();
		await Profiler.enable();

		// Set JS profiler sampling resolution to 100 microsecond (default is 1000)
		await Profiler.setSamplingInterval({
			interval: config.sampleInterval
		});

		// make sure we launch Chrome within timeout
		var timeoutTimer = setTimeout(async function() {
			BrowserUtils.closeChrome(client, chrome);

			return reject("Page Load did not complete after " + config.timeout + "ms");
		}, config.timeout);

		// gather profile on load event
		client.on("Page.loadEventFired", async function runLoadEvent() {
			try {
				loadTime = now();

				// total duration
				const duration = Math.floor(loadTime - startTime);

				console.debug(`Page load complete (${duration}ms)`);

				clearTimeout(timeoutTimer);

				// wait a bit
				if (config.postLoadWait) {
					console.debug(`Sleeping for ${config.postLoadWait}ms...`);
					await sleep(config.postLoadWait);
				}

				console.debug("Page load complete, gathering profile");

				// get data from the profiler
				const profile = (await Profiler.stop()).profile;

				//
				// get data from the page
				//
				const navigationTiming = (await Runtime.evaluate({
					expression: navTimingJavaScript,
					returnByValue: true
				})).result.value;

				const marks = (await Runtime.evaluate({
					expression: marksJavaScript,
					returnByValue: true
				})).result.value;

				const measures = (await Runtime.evaluate({
					expression: measuresJavaScript,
					returnByValue: true
				})).result.value;

				// close Chrome
				await BrowserUtils.closeChrome(client, chrome);

				resolve({
					duration,
					profile,
					navigationTiming,
					marks,
					measures
				});
			}
			catch (e) {
				reject(e);
			}
		});

		// start the profiler
		console.debug("Enabling profiler");
		await Profiler.start();

		startTime = now();

		// Navigate!
		console.debug(`Navigating to ${url}`);
		await Page.navigate({ url });
	});
}

//
// Exports
//
exports.run = run;
