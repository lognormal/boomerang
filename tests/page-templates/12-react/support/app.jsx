import React from 'react';
import { render } from 'react-dom';
import createHashHistory from 'history/lib/createHashHistory';
import { Router, Route, IndexRoute, Link, History } from 'react-router';

var hadRouteChange = false;
var history = createHashHistory();

function hookHistoryBoomerang() {
	if (window.BOOMR && BOOMR.version) {
		if (BOOMR.plugins && BOOMR.plugins.History) {
			BOOMR.plugins.History.hook(history, hadRouteChange, {});
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
		var state =  {
			imgs: typeof window.imgs !== "undefined" ? window.imgs : [0],
			rnd: Math.random()
		};

		state.hide_imgs = state.imgs[0] === -1;

		return state;
	},
	componentDidMount() {
		$.get("support/home.html", function (homeHtml) {
			if(this.isMounted()) {
				this.setState({
					home: homeHtml
				});
			}
		}.bind(this));
		$.get("support/widgets.json", function (result) {
			if(this.isMounted()) {
				this.setState({
					widgets: result
				});


			}
		}.bind(this));
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
			var x = <Link to={`/widget/${this.state.widgets[widgetIndex].id}`}>Widgets {widgetIndex}</Link>;
			widgetsElements.push(<li key={widgetIndex}>{x}</li>);
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
		return {
			id: this.props.params.id
		};
	},
	componentDidMont() {
		$.get("support/widgets.json", function (result) {
			if(this.isMounted()) {
				this.setState({
					widgets: result,
					rnd: Math.random()
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
		return <div className="image" key={this.state.id}><img key={this.state.id} src={`/delay?delay=${this.state.id}000&file=pages/12-react/support/img.jpg&id=${this.state.id}&rnd=${this.state.rnd}`} style={style}></img></div>;
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

function enter() {
	console.log(this);
}

var routerInstance = render(
	<Router history={history}>
		<Route path="/" component={App} onEnter={enter}>
			<IndexRoute component={Home} />
			<Route path="widget/:id" component={Widget}/>
		</Route>
	</Router>
, document.getElementById("root"));
