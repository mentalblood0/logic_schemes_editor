'use strict'

class Root extends React.Component {
	constructor(props) {
		super(props);

		this.state = {

		};
	}

	render() {
		return (<React.Fragment>
			<BlocksArea></BlocksArea>
		</React.Fragment>);
	}
}

const rootElement = document.getElementById('root');
ReactDOM.render(React.createElement(Root), rootElement);