"use strict";

/** @jsx h */
function filledArray(l, n) {
  return Array.from({
    length: l
  }, (_, i) => n);
}

class TestsEditor extends preact.Component {
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
    if (inputs.length == 0 || outputs.length == 0) return h("div", {
      className: "testsEditor"
    }, h("div", {
      className: "noInputsOutputsMessage"
    }, "There should be inputs and outputs to add tests"));
    return h("div", {
      className: "testsEditor"
    }, h("div", {
      className: "tables"
    }, h("div", {
      className: "testsTableWrapper inputs"
    }, h("table", {
      className: "testsTable inputs"
    }, h("tbody", null, h("tr", null, h("td", null), inputs.map((name, i) => h("td", {
      key: i
    }, name))), tests.map((t, test_i) => h("tr", {
      key: test_i
    }, h("td", null, h("div", {
      className: "removeRowButton animated unselectable",
      onClick: e => {
        const tests_length = this.state.tests.length;
        this.setState(state => {
          if (state.tests.length != tests_length) return state;
          state.tests.splice(test_i, 1);
          return state;
        });
      }
    }, "-")), t.slice(0, inputs.length).map((v, input_i) => h("td", {
      key: input_i,
      className: 'checkbox ' + (tests[test_i][input_i] ? 'checked' : 'unchecked'),
      onClick: e => {
        this.setState(state => {
          state.tests[test_i][input_i] = state.tests[test_i][input_i] ? 0 : 1;
          return state;
        });
      }
    }))))))), h("div", {
      className: "testsTableWrapper outputs"
    }, h("table", {
      className: "testsTable outputs"
    }, h("tbody", null, h("tr", null, outputs.map((name, i) => h("td", {
      key: i
    }, name))), tests.map((t, test_i) => h("tr", {
      key: test_i
    }, t.slice(inputs.length, t.length).map((v, output_i) => h("td", {
      key: output_i,
      className: 'checkbox ' + (tests[test_i][inputs.length + output_i] ? 'checked' : 'unchecked'),
      onClick: e => {
        this.setState(state => {
          state.tests[test_i][inputs.length + output_i] = state.tests[test_i][inputs.length + output_i] ? 0 : 1;
          return state;
        });
      }
    })))))))), h("div", {
      className: "addRowButton animated unselectable",
      onClick: e => {
        const tests_length = this.state.tests.length;
        this.setState(state => {
          if (state.tests.length != tests_length) return state;
          const test_length = state.inputs.length + state.outputs.length;
          state.tests.push(filledArray(test_length, 0));
          return state;
        });
      }
    }, "+"));
  }

}