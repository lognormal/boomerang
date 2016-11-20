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

function hookHistoryBoomerang() {
	if (window.BOOMR && BOOMR.version) {
		if (BOOMR.plugins && BOOMR.plugins.History) {
			BOOMR.plugins.History.hook(history, hadRouteChange, hookOptions);
		}
		return true;
	}
}

if (!window.reactDisableBoomerangHook) {
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

		var that = this;
		if ( window.nav_routes && window.nav_routes.hasOwnProperty("length") && window.nav_routes.length > 0) {
			if (!subscribed) {
				BOOMR.subscribe("onbeacon", function(beacon) {
					// only continue for SPA beacons
					if (!BOOMR.utils.inArray(beacon["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS)) {
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

		if (typeof window.imgs !== "undefined" && window.imgs.hasOwnProperty("length")) {
			images = window.imgs;
		} else {
			images = [];
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
		var homeXHR = new XMLHttpRequest();
		homeXHR.addEventListener("load", function (homeHtml) {
			if(this.isMounted()) {
				this.setState({
					home: homeHtml.target.response
				});
			}
		}.bind(this));
		homeXHR.open("GET", "support/home.html?rnd=" + (Math.round(Math.random() * 1000)));
		homeXHR.send(null);

		var widgetsXHR = new XMLHttpRequest();
		widgetsXHR.addEventListener("load", function (result) {
			if(this.isMounted()) {
				this.setState({
					widgets: JSON.parse(result.target.response)
				});
			}
		}.bind(this));
		widgetsXHR.open("GET", "support/widgets.json?rnd=" + (Math.round(Math.random() * 1000)));
		widgetsXHR.send(null);
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
	render() {
		var widgetsElements = this.renderWidgets();

		if (!this.state.hide_imgs) {
			var images = [];
			for (var delayIndex in  this.state.imgs) {
				var style = {
					width: 300 + "px",
					height: "auto"
				};
				var src = `/delay?delay=${this.state.imgs[delayIndex]}&file=pages/12-react/support/img.jpg&id=home&rnd=${this.state.rnd}`;
				images.push(<div className="image-home" key={delayIndex}>
				  <img key={delayIndex} src={src} style={style}/>
				</div>);
			}

			return (
				<div className="content">
					<div dangerouslySetInnerHTML={this.cartMarkup()} />
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
		return {
			rnd: '' + (Math.random() * 1000),
			id: this.props.params.id
		};
	},
	componentDidMount() {
		var widgetXHR = new XMLHttpRequest();
		widgetXHR.addEventListener("load", function(widgetHtml) {
			if(this.isMounted()) {
				this.setState({
					widgetHtml: widgetHtml.target.response
				});
			}
		}.bind(this));
		widgetXHR.open("GET", "support/widget.html?rnd=" + (Math.round(Math.random() * 1000)));
		widgetXHR.send(null);
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

		return (
			<div>
				<div dangerouslySetInnerHTML={this.widgetMarkup()} />
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
			</Route>
		</Router>
), document.getElementById("root"));

