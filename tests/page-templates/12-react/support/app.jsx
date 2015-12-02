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
			console.log("React-App: ", window.nav_routes);
			if (!subscribed) {
				BOOMR.subscribe("onbeacon", function() {
					if(window.nav_routes.length > 0) {
						setTimeout(function() {
							var newRoute = window.nav_routes.shift();
							that.history.pushState(null, `${newRoute}`);
						}, 1000);
					}
				});
			}
			subscribed = true;
		}
		
		return {};
	},
	mixins: [History],
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
		homeXHR.open("GET", "support/home.html");
		homeXHR.send();

		var widgetsXHR = new XMLHttpRequest();
		widgetsXHR.addEventListener("load", function (result) {
			if(this.isMounted()) {
				this.setState({
					widgets: JSON.parse(result.target.response)
				});
			}
		}.bind(this));
		widgetsXHR.open("GET", "support/widgets.json");
		widgetsXHR.send();
	},
	cartMarkup() {
		return { __html: this.state.home };
	},
	renderImages() {
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

		return images;
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
			var images = this.renderImages();
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
		console.log("React-App: ", this.props.params);
		return {
			id: this.props.params.id
		};
	},
	componentDidMont() {
		console.log("React-App: ", this.props.params);
		$.get("support/widgets.json", function (result) {
			if(this.isMounted()) {
				this.setState({
					widgets: result,
					rnd: '' + (Math.random() * 1000)
				});
			}
		}.bind(this));

		$.get("support/widget.html", function (widgetHtml) {
			if (this.isMounted()) {
				this.setState({
					widgetHtml: widgetHtml
				});
			}
		}.bind(this));
	},
	widgetMarkup() {
		return { __html: this.state.widgetHtml };
	},
	renderImage() {
		var style = {
			width: 300 + "px",
			height: "auto"
		};
		console.log("React-App: ", this.props.params.id);
		return <div className="image" key={this.props.params.id}><img key={this.props.params.id} src={`/delay?delay=${this.props.params.id}000&file=pages/12-react/support/img.jpg&id=${this.props.params.id}&rnd=${'' + Math.random() * 1000}`} style={style}></img></div>;
	},
	render() {
		return (
			<div>
				<div dangerouslySetInnerHTML={this.widgetMarkup()} />
				{this.renderImage()}
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

