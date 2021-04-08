'use strict';

function filledArray(l, n) {
  return Array.from({
    length: l
  }, (_, i) => n);
}

class TestsEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'inputs': props.inputs,
      'outputs': props.outputs,
      'tests': props.tests,
      'onUnmount': props.onUnmount
    };
  }

  componentWillUnmount() {
    this.state.onUnmount(this.state.tests);
  }

  render() {
    const inputs = this.state.inputs;
    const outputs = this.state.outputs;
    const tests = this.state.tests;
    return /*#__PURE__*/React.createElement("div", {
      className: "testsEditor"
    }, /*#__PURE__*/React.createElement("div", {
      className: "testsTableWrapper inputs"
    }, /*#__PURE__*/React.createElement("table", {
      className: "testsTable inputs"
    }, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null), inputs.map((name, i) => /*#__PURE__*/React.createElement("td", {
      key: i
    }, name))), tests.map((t, test_i) => /*#__PURE__*/React.createElement("tr", {
      key: test_i
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      className: "removeRowButton animated unselectable",
      onClick: e => {
        const tests_length = this.state.tests.length;
        this.setState(state => {
          if (state.tests.length != tests_length) return state;
          delete state.tests[test_i];
        }, () => this.forceUpdate());
      }
    }, "remove")), t.slice(0, inputs.length).map((v, input_i) => /*#__PURE__*/React.createElement("td", {
      key: input_i
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: v,
      onChange: e => {
        const value = e.target.checked ? 1 : 0;
        this.setState(state => {
          state.tests[test_i][input_i] = value;
          return state;
        });
      }
    })))))))), /*#__PURE__*/React.createElement("div", {
      className: "testsTableWrapper outputs"
    }, /*#__PURE__*/React.createElement("table", {
      className: "testsTable outputs"
    }, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, outputs.map((name, i) => /*#__PURE__*/React.createElement("td", {
      key: i
    }, name))), tests.map((t, test_i) => /*#__PURE__*/React.createElement("tr", {
      key: test_i
    }, t.slice(inputs.length, t.length).map((v, output_i) => /*#__PURE__*/React.createElement("td", {
      key: output_i
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: v,
      onChange: e => {
        const value = e.target.checked ? 1 : 0;
        this.setState(state => {
          state.tests[test_i][inputs.length + output_i] = value;
          return state;
        });
      }
    })))))))), /*#__PURE__*/React.createElement("div", {
      className: "addRowButton animated unselectable",
      onClick: e => {
        const tests_length = this.state.tests.length;
        this.setState(state => {
          if (state.tests.length != tests_length) return state;
          const test_length = state.inputs.length + state.outputs.length;
          state.tests.push(filledArray(test_length, 0));
        }, () => this.forceUpdate());
      }
    }, "add"));
  }

}