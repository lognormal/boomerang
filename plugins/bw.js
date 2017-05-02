/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

// This is the Bandwidth & Latency plugin abbreviated to BW
(function() {
	var impl, images;

	BOOMR = BOOMR || {};
	BOOMR.plugins = BOOMR.plugins || {};
	if (BOOMR.plugins.BW) {
		return;
	}

	// We choose image sizes so that we can narrow down on a bandwidth range as
	// soon as possible the sizes chosen correspond to bandwidth values of
	// 14-64kbps, 64-256kbps, 256-1024kbps, 1-2Mbps, 2-8Mbps, 8-30Mbps & 30Mbps+
	// Anything below 14kbps will probably timeout before the test completes
	// Anything over 60Mbps will probably be unreliable since latency will make up
	// the largest part of download time. If you want to extend this further to
	// cover 100Mbps & 1Gbps networks, use image sizes of 19,200,000 & 153,600,000
	// bytes respectively
	// See https://spreadsheets.google.com/ccc?key=0AplxPyCzmQi6dDRBN2JEd190N1hhV1N5cHQtUVdBMUE&hl=en_GB
	// for a spreadsheet with the details
	//
	// The images were generated with ImageMagic, using random uncompressed data.
	// As input data (image-3.bin) I used the original images that were encrypted using AES256.
	// The IM command used was : convert -size 618x618 -depth 8 gray:image-3.bin image-3.png
	// Vary the image dimensions to change the filesize. The image dimensions are more or less the square of the desired filesize.
	images = [
		{ name: "image-0.png", size: 11773, timeout: 1400 },
		{ name: "image-1.png", size: 40836, timeout: 1200 },
		{ name: "image-2.png", size: 165544, timeout: 1300 },
		{ name: "image-3.png", size: 382946, timeout: 1500 },
		{ name: "image-4.png", size: 1236278, timeout: 1200 },
		{ name: "image-5.png", size: 4511798, timeout: 1200 },
		{ name: "image-6.png", size: 9092136, timeout: 1200 }
	];

	images.end = images.length;
	images.start = 0;

	// abuse arrays to do the latency test simply because it avoids a bunch of
	// branches in the rest of the code.
	// I'm sorry Douglas
	images.l = { name: "image-l.gif", size: 35, timeout: 1000 };

	// private object
	impl = {
		// properties
		base_url: "",
		timeout: 15000,
		nruns: 5,
		latency_runs: 10,
		user_ip: "",
		block_beacon: false,
		test_https: false,
		cookie_exp: 7 * 86400,
		cookie: "BA",

		// state
		results: [],
		latencies: [],
		latency: null,
		runs_left: 0,
		aborted: false,
		complete: true,		// defaults to true so we don't block other plugins if this cannot start.
					// init sets it to false
		running: false,
		initialized: false,

		// methods

		// numeric comparator.  Returns negative number if a < b, positive if a > b and 0 if they're equal
		// used to sort an array numerically
		ncmp: function(a, b) { return (a - b); },

		// Calculate the interquartile range of an array of data points
		iqr: function(a) {
			var l = a.length - 1, q1, q3, fw, b = [], i;

			q1 = (a[Math.floor(l * 0.25)] + a[Math.ceil(l * 0.25)]) / 2;
			q3 = (a[Math.floor(l * 0.75)] + a[Math.ceil(l * 0.75)]) / 2;

			fw = (q3 - q1) * 1.5;

			// fw === 0 => all items are identical, so no need to filter
			if (fw === 0) {
				return a;
			}

			l++;

			for (i = 0; i < l && a[i] < q3 + fw; i++) {
				if (a[i] > q1 - fw) {
					b.push(a[i]);
				}
			}

			return b;
		},

		calc_latency: function() {
			var i, n,
			    sum = 0, sumsq = 0,
			    amean, median,
			    std_dev, std_err,
			    lat_filtered;

			// We ignore the first since it paid the price of DNS lookup, TCP connect
			// and slow start
			this.latencies.shift();

			// We first do IQR filtering and use the resulting data set
			// for all calculations
			lat_filtered = this.iqr(this.latencies.sort(this.ncmp));
			n = lat_filtered.length;

			BOOMR.debug("latencies: " + this.latencies, "bw");
			BOOMR.debug("lat_filtered: " + lat_filtered, "bw");

			// First we get the arithmetic mean, standard deviation and standard error
			for (i = 0; i < n; i++) {
				sum += lat_filtered[i];
				sumsq += lat_filtered[i] * lat_filtered[i];
			}

			amean = Math.round(sum / n);

			std_dev = Math.sqrt(sumsq / n - sum * sum / (n * n));

			// See http://en.wikipedia.org/wiki/1.96 and http://en.wikipedia.org/wiki/Standard_error_%28statistics%29
			std_err = (1.96 * std_dev / Math.sqrt(n)).toFixed(2);

			std_dev = std_dev.toFixed(2);


			median = Math.round(
					(lat_filtered[Math.floor(n / 2)] + lat_filtered[Math.ceil(n / 2)]) / 2
				);

			return { mean: amean, median: median, stddev: std_dev, stderr: std_err };
		},

		calc_bw: function() {
			var i, j, n = 0,
			    r, bandwidths = [], bandwidths_corrected = [],
			    sum = 0, sumsq = 0, sum_corrected = 0, sumsq_corrected = 0,
			    amean, std_dev, std_err, median,
			    amean_corrected, std_dev_corrected, std_err_corrected, median_corrected,
			    nimgs, bw, bw_c, debug_info = [];

			for (i = 0; i < this.nruns; i++) {
				if (!this.results[i] || !this.results[i].r) {
					continue;
				}

				r = this.results[i].r;

				// the next loop we iterate through backwards and only consider the largest
				// 3 images that succeeded that way we don't consider small images that
				// downloaded fast without really saturating the network
				nimgs = 0;
				for (j = r.length - 1; j >= 0 && nimgs < 3; j--) {
					// if we hit an undefined image time, we skipped everything before this
					if (!r[j]) {
						break;
					}
					if (r[j].t === null) {
						continue;
					}

					n++;
					nimgs++;

					// multiply by 1000 since t is in milliseconds and not seconds
					bw = images[j].size * 1000 / r[j].t;
					bandwidths.push(bw);

					if (r[j].t > this.latency.mean) {
						bw_c = images[j].size * 1000 / (r[j].t - this.latency.mean);
						bandwidths_corrected.push(bw_c);
					}
					else {
						debug_info.push(j + "_" + r[j].t);
					}
				}
			}

			BOOMR.debug("got " + n + " readings", "bw");

			BOOMR.debug("bandwidths: " + bandwidths, "bw");
			BOOMR.debug("corrected: " + bandwidths_corrected, "bw");

			// First do IQR filtering since we use the median here
			// and should use the stddev after filtering.
			if (bandwidths.length > 3) {
				bandwidths = this.iqr(bandwidths.sort(this.ncmp));
				bandwidths_corrected = this.iqr(bandwidths_corrected.sort(this.ncmp));
			}
			else {
				bandwidths = bandwidths.sort(this.ncmp);
				bandwidths_corrected = bandwidths_corrected.sort(this.ncmp);
			}

			BOOMR.debug("after iqr: " + bandwidths, "bw");
			BOOMR.debug("corrected: " + bandwidths_corrected, "bw");

			// Now get the mean & median.
			// Also get corrected values that eliminate latency
			n = Math.max(bandwidths.length, bandwidths_corrected.length);
			for (i = 0; i < n; i++) {
				if (i < bandwidths.length) {
					sum += bandwidths[i];
					sumsq += Math.pow(bandwidths[i], 2);
				}
				if (i < bandwidths_corrected.length) {
					sum_corrected += bandwidths_corrected[i];
					sumsq_corrected += Math.pow(bandwidths_corrected[i], 2);
				}
			}

			n = bandwidths.length;
			amean = Math.round(sum / n);
			std_dev = Math.sqrt(sumsq / n - Math.pow(sum / n, 2));
			std_err = Math.round(1.96 * std_dev / Math.sqrt(n));
			std_dev = Math.round(std_dev);

			n = bandwidths.length - 1;
			median = Math.round(
					(bandwidths[Math.floor(n / 2)] + bandwidths[Math.ceil(n / 2)]) / 2
				);

			if (bandwidths_corrected.length < 1) {
				BOOMR.debug("not enough valid corrected datapoints, falling back to uncorrected", "bw");
				debug_info.push("l==" + bandwidths_corrected.length);

				amean_corrected = amean;
				std_dev_corrected = std_dev;
				std_err_corrected = std_err;
				median_corrected = median;
			}
			else {
				n = bandwidths_corrected.length;
				amean_corrected = Math.round(sum_corrected / n);
				std_dev_corrected = Math.sqrt(sumsq_corrected / n - Math.pow(sum_corrected / n, 2));
				std_err_corrected = (1.96 * std_dev_corrected / Math.sqrt(n)).toFixed(2);
				std_dev_corrected = std_dev_corrected.toFixed(2);

				n = bandwidths_corrected.length - 1;
				median_corrected = Math.round(
							(
								bandwidths_corrected[Math.floor(n / 2)] +
								bandwidths_corrected[Math.ceil(n / 2)]
							) / 2
						);
			}

			BOOMR.debug("amean: " + amean + ", median: " + median, "bw");
			BOOMR.debug("corrected amean: " + amean_corrected + ", " + "median: " + median_corrected, "bw");

			return {
				mean: amean,
				stddev: std_dev,
				stderr: std_err,
				median: median,
				mean_corrected: amean_corrected,
				stddev_corrected: std_dev_corrected,
				stderr_corrected: std_err_corrected,
				median_corrected: median_corrected,
				debug_info: debug_info
			};
		},

		load_img: function(i, run, callback) {
			var url = this.base_url + images[i].name +
			    "?t=" + BOOMR.utils.generateId(10),
			    timer = 0, tstart = 0,
			    img = new Image(),
			    that = this;

			function handler(value) {
				return function() {
					if (callback) {
						callback.call(that, i, tstart, run, value);
					}

					if (value !== null) {
						img.onload = img.onerror = null;
						img = null;
						clearTimeout(timer);
						that = callback = null;
					}
				};
			}

			img.onload = handler(true);
			img.onerror = handler(false);

			// the timeout does not abort download of the current image, it just sets an
			// end of loop flag so we don't attempt download of the next image we still
			// need to wait until onload or onerror fire to be sure that the image
			// download isn't using up bandwidth.  This also saves us if the timeout
			// happens on the first image.  If it didn't, we'd have nothing to measure.
			timer = setTimeout(handler(null), images[i].timeout + Math.min(400, this.latency ? this.latency.mean : 400));

			tstart = BOOMR.now();
			img.src = url;
		},

		lat_loaded: function(i, tstart, run, success) {
			if (run !== this.latency_runs + 1) {
				return;
			}

			if (success !== null) {
				var lat = BOOMR.now() - tstart;
				this.latencies.push(lat);
			}
			// we've got all the latency images at this point,
			// so we can calculate latency
			if (this.latency_runs === 0) {
				this.latency = this.calc_latency();
			}

			BOOMR.setImmediate(this.iterate, null, null, this);
		},

		img_loaded: function(i, tstart, run, success) {
			if (run !== this.runs_left + 1) {
				return;
			}

			if (this.results[this.nruns - run].r[i])	{	// already called on this image
				return;
			}

			// if timeout, then we set the next image to the end of loop marker
			if (success === null) {
				this.results[this.nruns - run].r[i + 1] = {t: null, state: null, run: run};
				return;
			}

			var result = {
				start: tstart,
				end: BOOMR.now(),
				t: null,
				state: success,
				run: run
			};
			if (success) {
				result.t = result.end - result.start;
			}
			this.results[this.nruns - run].r[i] = result;

			// we terminate if an image timed out because that means the connection is
			// too slow to go to the next image
			if (i >= images.end - 1 || this.results[this.nruns - run].r[i + 1] !== undefined) {
				BOOMR.debug(BOOMR.utils.objectToString(this.results[this.nruns - run], undefined, 2), "bw");
				// First run is a pilot test to decide what the largest image
				// that we can download is. All following runs only try to
				// download this image
				if (run === this.nruns) {
					images.start = i;
				}
				BOOMR.setImmediate(this.iterate, null, null, this);
			}
			else {
				this.load_img(i + 1, run, this.img_loaded);
			}
		},

		finish: function() {
			if (!this.latency) {
				this.latency = this.calc_latency();
			}

			var bw = this.calc_bw(),
			    o = {
				    bw:         bw.median_corrected,
				    bw_err:     parseFloat(bw.stderr_corrected, 10),
				    lat:        this.latency.mean,
				    lat_err:    parseFloat(this.latency.stderr, 10),
				    bw_time:    Math.round(BOOMR.now() / 1000)
			    };

			BOOMR.addVar(o);
			if (bw.debug_info.length > 0) {
				BOOMR.addVar("bw_debug", bw.debug_info.join(","));
			}

			// If we have an IP address we can make the BA cookie persistent for a while
			// because we'll recalculate it if necessary (when the user's IP changes).
			if (!isNaN(o.bw) && o.bw > 0) {
				BOOMR.utils.setCookie(this.cookie,
					{
						ba: Math.round(o.bw),
						be: o.bw_err,
						l:  o.lat,
						le: o.lat_err,
						ip: this.user_ip,
						t:  o.bw_time
					},
					(this.user_ip ? this.cookie_exp : 0)
				);
			}

			this.complete = true;

			if (this.block_beacon === true) {
				BOOMR.sendBeacon();
			}

			this.running = false;
		},

		iterate: function() {
			if (!this.aborted) {
				if (!this.runs_left) {
					this.finish();
				}
				else if (this.latency_runs) {
					this.load_img("l", this.latency_runs--, this.lat_loaded);
				}
				else {
					this.results.push({r: []});
					this.load_img(images.start, this.runs_left--, this.img_loaded);
				}
			}
		},

		setVarsFromCookie: function() {
			var cookies, ba, bw_e, lat, lat_e, c_sn, t, p_sn, t_now;

			cookies = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(impl.cookie));

			if (cookies && cookies.ba) {

				ba = parseInt(cookies.ba, 10);
				bw_e = parseFloat(cookies.be, 10);
				lat = parseInt(cookies.l, 10) || 0;
				lat_e = parseFloat(cookies.le, 10) || 0;
				c_sn = cookies.ip.replace(/\.\d+$/, "0");	// Note this is IPv4 only
				t = parseInt(cookies.t, 10);
				p_sn = this.user_ip.replace(/\.\d+$/, "0");

				// We use the subnet instead of the IP address because some people
				// on DHCP with the same ISP may get different IPs on the same subnet
				// every time they log in

				t_now = Math.round(BOOMR.now() / 1000);	// seconds

				// If the subnet changes or the cookie is more than 7 days old,
				// then we recheck the bandwidth, else we just use what's in the cookie
				if (c_sn === p_sn && t >= t_now - this.cookie_exp && ba > 0) {
					this.complete = true;
					BOOMR.addVar({
						bw:      ba,
						lat:     lat,
						bw_err:  bw_e,
						lat_err: lat_e,
						bw_time: t
					});

					return true;
				}
			}

			return false;
		}

	};

	BOOMR.plugins.BW = {
		init: function(config) {
			if (impl.initialized) {
				return this;
			}

			BOOMR.utils.pluginConfig(impl, config, "BW",
							["base_url", "timeout", "nruns", "cookie", "cookie_exp", "test_https", "block_beacon"]);

			if (config && config.user_ip) {
				impl.user_ip = config.user_ip;
			}

			if (!impl.base_url) {
				return this;
			}

			images.start = 0;
			impl.runs_left = impl.nruns;
			impl.latency_runs = 10;
			impl.results = [];
			impl.latencies = [];
			impl.latency = null;
			impl.complete = impl.aborted = false;

			BOOMR.removeVar("ba", "ba_err", "lat", "lat_err");

			if (!impl.setVarsFromCookie()) {
				BOOMR.subscribe("page_ready", this.run, null, this);
			}

			impl.initialized = true;

			return this;
		},

		run: function() {
			var a;
			if (impl.running || impl.complete) {
				return this;
			}

			// Turn image url into an absolute url if it isn't already
			a = BOOMR.window.document.createElement("a");
			a.href = impl.base_url;

			if (!impl.test_https && a.protocol === "https:") {
				// we don't run the test for https because SSL stuff will mess up b/w
				// calculations we could run the test itself over HTTP, but then IE
				// will complain about insecure resources, so the best is to just bail
				// and hope that the user gets the cookie from some other page

				BOOMR.info("HTTPS detected, skipping bandwidth test", "bw");
				impl.complete = true;

				if (impl.block_beacon === true) {
					BOOMR.sendBeacon();
				}

				return this;
			}

			impl.base_url = a.href;
			impl.running = true;

			setTimeout(this.abort, impl.timeout);

			impl.iterate();

			return this;
		},

		abort: function() {
			impl.aborted = true;
			if (impl.running) {
				impl.finish();	// we don't defer this call because it might be called from
						// onunload and we want the entire chain to complete
						// before we return
			}
		},

		is_complete: function() {
			if (impl.block_beacon === true) {
				return impl.complete;
			}
			else {
				return true;
			}
		}
	};

}());
// End of BW plugin
