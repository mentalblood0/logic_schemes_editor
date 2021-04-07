'use strict';

class TestsEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'inputs': props.inputs,
      'outputs': props.outputs,
      'tests': props.tests
    };
  }

  render() {
    const inputs = this.state.inputs;
    const outputs = this.state.outputs;
    const tests = this.state.tests;
    return /*#__PURE__*/React.createElement("div", {
      className: "testsEditor"
    }, /*#__PURE__*/React.createElement("table", {
      className: "testsTable"
    }, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, inputs.map((name, i) => /*#__PURE__*/React.createElement("td", {
      key: i
    }, name)), outputs.map((name, i) => /*#__PURE__*/React.createElement("td", {
      key: i
    }, name))), tests.map((t, i) => /*#__PURE__*/React.createElement("tr", {
      key: i
    }, t.slice(0, inputs.length).map((v, i) => /*#__PURE__*/React.createElement("td", {
      key: i
    }, v)), t.slice(inputs.length, t.length).map((v, i) => /*#__PURE__*/React.createElement("td", {
      key: i
    }, v)))))));
  }

}