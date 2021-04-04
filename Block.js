'use strict';

function getElementCenter(e) {
  const rect = e.getBoundingClientRect();
  return {
    'x': rect.x + rect.width / 2,
    'y': rect.y + rect.height / 2
  };
}

class Block extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'id': props.id,
      'name': props.name,
      'width': undefined,
      'height': undefined,
      'x': 250,
      'y': 150,
      'dragging': false,
      'gripX': undefined,
      'gripY': undefined,
      'inputs': defaultElements[props.name].inputs,
      'outputs': defaultElements[props.name].outputs,
      'onStateChange': props.onStateChange,
      'onMount': props.onMount
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this._ref = React.createRef();
    this.input_connectors_refs = Array(Object.keys(this.state.inputs).length).fill(undefined).map(e => React.createRef());
    this.output_connectors_refs = Array(this.state.outputs.length).fill(undefined).map(e => React.createRef());
  }

  getInfo(state) {
    if (state == undefined) state = this.state;
    return {
      'id': state.id,
      'name': state.name,
      'width': state.width,
      'height': state.height,
      'x': state.x,
      'y': state.y,
      'input_connectors_coordinates': this.input_connectors_refs.map(r => getElementCenter(r.current)),
      'output_connectors_coordinates': this.output_connectors_refs.map(r => getElementCenter(r.current))
    };
  }

  componentDidMount() {
    this.state.width = this._ref.current.offsetWidth;
    this.state.height = this._ref.current.offsetHeight;
    this.state.onMount(this.getInfo());
    const content_element = this._ref.current.children[0];
    const name_element = this._ref.current.children[0].children[1];

    const ifDraggableByThis = (e, f) => e.target === content_element || e.target === name_element ? f(e) : null;

    window.addEventListener('mousedown', e => ifDraggableByThis(e, this.handleMouseDown));
    window.addEventListener('mouseup', e => ifDraggableByThis(e, this.handleMouseUp));
    window.addEventListener('mousemove', e => this.state.dragging ? this.handleMouseMove(e) : null);
  }

  componentWillUnmount() {}

  handleMouseDown(e) {
    const newState = {
      'dragging': true,
      'gripX': e.clientX - this.state.x,
      'gripY': e.clientY - this.state.y
    };
    this.setState(newState);
  }

  handleMouseUp(e) {
    this.setState({
      'dragging': false
    });
  }

  handleMouseMove(e) {
    if (this.state.dragging === true) {
      const newState = Object.assign(this.state, {
        'x': e.clientX - this.state.gripX,
        'y': e.clientY - this.state.gripY
      });
      this.setState(state => newState);
      this.state.onStateChange(this.getInfo(newState));
    }
  }

  handleMouseLeave(e) {
    this.handleMouseMove(e);
  }

  render() {
    const x = this.state.x;
    const y = this.state.y;
    const name = this.state.name;
    return /*#__PURE__*/React.createElement("div", {
      ref: this._ref,
      className: "block",
      style: {
        'position': 'absolute',
        'left': x,
        'top': y
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputs"
    }, this.state.inputs.map((input, i) => /*#__PURE__*/React.createElement("div", {
      ref: this.input_connectors_refs[i],
      key: i,
      className: "input"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, name), /*#__PURE__*/React.createElement("div", {
      className: "outputs"
    }, this.state.outputs.map((output, i) => /*#__PURE__*/React.createElement("div", {
      ref: this.output_connectors_refs[i],
      key: i,
      className: "output"
    })))));
  }

}