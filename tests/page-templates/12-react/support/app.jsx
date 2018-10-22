import React from 'react';
import { render } from 'react-dom';
import { useBasename } from "history";
import createHashHistory from 'history/lib/createHashHistory';
import createBrowserHistory from 'history/lib/createBrowserHistory';

import { Router, Route, IndexRoute, Link, History } from 'react-router';

var hadRouteChange = false;
var history;
var hookOptions = {};

if (window.html5_mode === true)  {
	history = useBasename(createBrowserHistory)({
		basename: location.pathname
	});
}
else {
	history = createHashHistory();
}

var subscribed = false;

if (window.route_wait) {
	hookOptions.routeChangeWaitFilter = window.route_wait;
}

if (window.history_route_filter) {
	hookOptions.routeFilter = window.history_route_filter;
}

function hookHistoryBoomerang() {
	if (window.BOOMR && BOOMR.version) {
		if (BOOMR.plugins && BOOMR.plugins.History) {
			BOOMR.plugins.History.hook(history, hadRouteChange, hookOptions);
		}
		return true;
	}
}

if (!window.disableBoomerangHook) {
	if (!hookHistoryBoomerang()) {
		if (document.addEventListener) {
			document.addEventListener("onBoomerangLoaded", hookHistoryBoomerang);
		} else if (document.attachEvent) {
			document.attachEvent("onpropertychange", function(e) {
				e = e || window.event;
				if (e && e.propertyName === "onBoomerangLoaded") {
					hookHistoryBoomerang();
				}
			});
		}
	}
}

const App = React.createClass({
	getInitialState() {
		var that = this;
		if ( window.nav_routes && window.nav_routes.hasOwnProperty("length") && window.nav_routes.length > 0) {
			if (!subscribed) {
				BOOMR.subscribe("beacon", function(beacon) {
					// only continue for SPA beacons
					if (!BOOMR.utils.inArray(beacon["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS) && !window.call_page_ready) {
						return;
					}

					if(window.nav_routes.length > 0) {
						var newRoute = window.nav_routes.shift();
						setTimeout(function() {
							history.pushState(null, `${newRoute}`);
						}, 100);
					}
				});
			}
			subscribed = true;
		}

		return {};
	},
	render(){
		return (
			<div>
				<Link to="/">Home</Link>
				{this.props.children}
			</div>
		);
	}
});

const Home = React.createClass({
	getInitialState() {
		var images;

		// these overwrite what was in the HTML
		window.custom_metric_1 = 11;
		window.custom_metric_2 = function() {
			return 22;
		};

		window.custom_timer_1 = 11;
		window.custom_timer_2 = function() {
			return 22;
		};

		if (typeof window.performance !== "undefined" &&
			typeof window.performance.mark === "function") {
			window.performance.mark("mark_usertiming");
		}

		if (typeof window.imgs !== "undefined" && window.imgs.hasOwnProperty("length")) {
			images = window.imgs;
		} else {
			images = [0];
		}

		var state =  {
			imgs: images,
			rnd: '' + (Math.random() * 1000)
		};

		if (images[0] === -1) {
			state.hide_imgs = true;
		}

		hadRouteChange = true;
		return state;
	},
	componentDidMount() {
		if (!window.use_fetch) {
			var homeXHR = new XMLHttpRequest();
			homeXHR.addEventListener("load", function(homeHtml) {
				if (this.isMounted()) {
					this.setState({
						home: homeHtml.target.response
					});
				}
			}.bind(this));
			homeXHR.open("GET", "support/home.html?rnd=" + (Math.round(Math.random() * 1000)));
			homeXHR.send(null);

			var widgetsXHR = new XMLHttpRequest();
			widgetsXHR.addEventListener("load", function(result) {
				if (this.isMounted()) {
					this.setState({
						widgets: JSON.parse(result.target.response)
					});
				}
			}.bind(this));
			widgetsXHR.open("GET", "support/widgets.json?rnd=" + (Math.round(Math.random() * 1000)));
			widgetsXHR.send(null);
		}
		else {
			var that = this;
			fetch("support/home.html?rnd=" + (Math.round(Math.random() * 1000)))
				.then((response) => response.text())
				.then(function(data) {
					if (that.isMounted()) {
						that.setState({
							home: data
						});
					}
				});

			fetch("support/widgets.json?rnd=" + (Math.round(Math.random() * 1000)))
				.then((response) => response.json())
				.then(function(data) {
					if (that.isMounted()) {
						that.setState({
							widgets: data
						});
					}
				});
		}
	},
	cartMarkup() {
		return { __html: this.state.home };
	},
	renderWidgets() {
		var widgetsElements = [];
		for (var widgetIndex in this.state.widgets ) {
			var link = <Link to={`/widgets/${this.state.widgets[widgetIndex].id}`}>Widgets {widgetIndex}</Link>;
			widgetsElements.push(<li key={widgetIndex}>{link}</li>);
		}
		return widgetsElements;
	},
	imageOnload() {
		if (window.call_page_ready && !window.boomr_t_done) {
			window.boomr_t_done = BOOMR.now();
			BOOMR.page_ready();
		}
	},
	render() {
		var widgetsElements = this.renderWidgets();
		if (window.window.late_imgs && !this.state.addedLates) {
			var rnd = this.state.rnd;
			this.state.addedLates = true;
			setTimeout(function() {
				var content = document.getElementById("root");

				window.window.late_imgs.forEach(function(imgDelay) {
					var img = document.createElement("img");
					if (imgDelay > 0) {
						img.src = `/delay?delay=${imgDelay}&id=late&file=pages/12-react/support/img.jpg&id=home&rnd=${rnd}`;
						content.appendChild(img);
					}
				});
			}, 500);
		}
		if (!this.state.hide_imgs) {
			var images = [];
			for (var delayIndex in  this.state.imgs) {
				var style = {
					width: 300 + "px",
					height: "auto"
				};
				var src = `/delay?delay=${this.state.imgs[delayIndex]}&file=pages/12-react/support/img.jpg&id=home&rnd=${this.state.rnd}`;
				images.push(<div className="image-home" key={delayIndex}>
				  <img onLoad={this.imageOnload} key={delayIndex} src={src} style={style}/>
				</div>);
			}
			return (
				<div className="content">
					<div dangerouslySetInnerHTML={this.cartMarkup()} />
					<div className="cart-container" style={{display: "none"}}>
						<div id="cart-total">$444.44</div>
					</div>
					{images}
					<div>
						<ul>
							{widgetsElements}
						</ul>
					</div>
				</div>
			);
		} else {
			return (
				<div>
					<div dangerouslySetInnerHTML={this.cartMarkup()} />
					<div>
						<ul>
							{widgetsElements}
						</ul>
					</div>
				</div>
			);
		}
	}
});

const Widget = React.createClass({
	getInitialState() {
		var wid = this.props.params.id;

		// these overwrite what was in the HTML
		window.custom_metric_1 = wid;
		window.custom_metric_2 = function() {
			return 10 * wid;
		};

		window.custom_timer_1 = wid;
		window.custom_timer_2 = function() {
			return 10 * wid;
		};

		return {
			rnd: '' + (Math.random() * 1000),
			id: wid
		};
	},
	componentDidMount() {
		var url;
		if (this.props.params.delay) {
			url = "/delay?delay=" + this.props.params.delay + "&file=/pages/12-react/support/widget.html?rnd=" + (Math.round(Math.random() * 1000));
		}
		else {
			url = "support/widget.html?rnd=" + (Math.round(Math.random() * 1000));
		}

		if (!window.use_fetch) {
			var widgetXHR = new XMLHttpRequest();
			widgetXHR.addEventListener("load", function(widgetHtml) {
				if (this.isMounted()) {
					this.setState({
						widgetHtml: widgetHtml.target.response
					});
				}
			}.bind(this));
			widgetXHR.open("GET", url);
			widgetXHR.send(null);
		}
		else {
			var that = this;
			fetch(url)
			.then((response) => response.text())
			.then(function(data) {
				if (that.isMounted()) {
					that.setState({
						widgetHtml: data
					});
				}
			});
		}
	},
	widgetMarkup() {
		return { __html: this.state.widgetHtml };
	},
	render() {
		var style = {
			width: 300 + "px",
			height: "auto"
		};
		var image = <div className="image" key={this.props.params.id}><img key={this.props.params.id} src={`/delay?delay=${this.props.params.id}000&file=pages/12-react/support/img.jpg&id=${this.props.params.id}&rnd=${this.state.rnd}`} style={style}></img></div>;
		var carttotal = this.props.params.id * 11.11;
		return (
			<div>
				<div dangerouslySetInnerHTML={this.widgetMarkup()} />
				<div className="cart-container" style={{display: "none"}}>
					<div id="cart-total">${carttotal}</div>
				</div>
				{image}
			</div>
		);
	}
});

var routerInstance = render((
		<Router history={history}>
			<Route path="/" component={App}>
				<IndexRoute component={Home}/>
				<Route path="widgets/:id" component={Widget}/>
				<Route path="delay/:delay/widgets/:id" component={Widget}/>
			</Route>
		</Router>
), document.getElementById("root"));
