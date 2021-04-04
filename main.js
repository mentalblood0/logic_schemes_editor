'use strict';

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BlocksArea, null));
  }

}

const rootElement = document.getElementById('root');
ReactDOM.render(React.createElement(Root), rootElement);