'use strict';

function getElementCenter(e) {
  const rect = e.getBoundingClientRect();
  const parent_rect = e.parentElement.parentElement.parentElement.parentElement.getBoundingClientRect();
  return {
    'x': rect.x - parent_rect.x + rect.width / 2,
    'y': rect.y - parent_rect.y + rect.height / 2
  };
}

function getElementRelativeCenter(e) {
  const rect = e.getBoundingClientRect();
  return {
    'x': rect.width / 2,
    'y': rect.height / 2
  };
}

class Block extends React.Component {
  constructor(props) {
    console.log('block constructor');
    super(props);
    const type_info = getTypeInfo(props.type);
    this.state = {
      'const_id': props.const_id,
      'id': props.id,
      'type': props.type,
      'x': props.x,
      'y': props.y,
      'dragging': props.dragging || false,
      'initital_dragging': props.dragging || false,
      'gripX': undefined,
      'gripY': undefined,
      'inputs': props.inputs ? props.inputs : type_info['inputs'],
      'outputs': props.outputs ? props.outputs : type_info['outputs'],
      'onStateChange': props.onStateChange,
      'onMount': props.onMount,
      'onStopInitialDragging': props.onStopInitialDragging,
      'function_to_delete_self': props.function_to_delete_self,
      'start_adding_wire_function': props.start_adding_wire_function,
      'handle_mouse_up_on_input_output_function': props.handle_mouse_up_on_input_output_function,
      'remove_wires_function': props.remove_wires_function
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseDownOnInputOutput = this.handleMouseDownOnInputOutput.bind(this);
    this._ref = React.createRef();
    this.input_connectors_refs = Array(Object.keys(this.state.inputs).length).fill(undefined).map(e => React.createRef());
    this.output_connectors_refs = Array(this.state.outputs.length).fill(undefined).map(e => React.createRef());
  }

  getInfo(state) {
    if (state == undefined) state = this.state;

    let get_info_function = state => this.getInfo(state);

    get_info_function = get_info_function.bind(this);
    return {
      'type': state.type,
      'id': state.id,
      'const_id': state.const_id,
      'x': state.x,
      'y': state.y,
      'inputs': state.inputs,
      'outputs': state.outputs,
      'input_connectors_coordinates': this.input_connectors_refs.map(r => getElementCenter(r.current)),
      'output_connectors_coordinates': this.output_connectors_refs.map(r => getElementCenter(r.current)),
      'get_info_function': get_info_function
    };
  }

  componentDidMount() {
    const content_element = this._ref.current.children[0];
    const name_element = this._ref.current.children[0].children[1];

    const ifDraggableByThis = (e, f) => e.target === content_element || e.target === name_element ? f(e) : null;

    this.state.event_listeners = [[this._ref.current, 'contextmenu', e => e.preventDefault()], [window, 'mousewheel', this.handleMouseWheel.bind(this)]];

    for (const e_l of this.state.event_listeners) e_l[0].addEventListener(e_l[1], e_l[2]);

    if (this.state.dragging) {
      const self_rect = this._ref.current.getBoundingClientRect();

      const center = {
        'x': this.state.x - self_rect.width / 2,
        'y': this.state.y - self_rect.height / 2
      };
      this.setState(state => {
        state.x = center.x;
        state.y = center.y;
        return state;
      }, () => this.handleMouseDown({
        'clientX': center.x + self_rect.width / 2,
        'clientY': center.y + self_rect.height / 2
      }, () => {
        const info = this.getInfo();
        this.state.onMount(info);
        this.state.onStateChange(info);
      }));
    } else {
      const info = this.getInfo();
      this.state.onMount(info);
      this.state.onStateChange(info);
    }
  }

  componentWillUnmount() {
    for (const e_l of this.state.event_listeners) e_l[0].removeEventListener(e_l[1], e_l[2]);
  }

  handleMouseDown(e, function_after) {
    if (e.button === 2) {
      this.state.function_to_delete_self();
      return;
    }

    this.setState({
      'dragging': true,
      'gripX': e.clientX - this.state.x,
      'gripY': e.clientY - this.state.y
    }, function_after);
  }

  handleMouseUp(e) {
    if (this.state.initital_dragging) this.state.onStopInitialDragging(this.state.const_id);
    if (this.state.dragging) this.setState({
      'dragging': false,
      'initital_dragging': false
    });
  }

  handleMouseMove(e) {
    const blocks_wrapper_element = this._ref.current.parentElement;
    const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();
    const mouse_x = e.clientX - blocks_wrapper_rect.x;
    const mouse_y = e.clientY - blocks_wrapper_rect.y;

    if (this.state.dragging === true) {
      this.setState(state => {
        state.x = mouse_x - this.state.gripX;
        state.y = mouse_y - this.state.gripY;
        return state;
      }, () => this.state.onStateChange(this.getInfo(this.state)));
    }
  }

  handleMouseLeave(e) {
    this.handleMouseMove(e);
  }

  handleMouseDownOnInputOutput(type, i, e) {
    const blocks_wrapper_element = this._ref.current.parentElement;
    const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();

    if (type == 'input') {
      if (e.button == 0) this.state.start_adding_wire_function({
        'to_block_const_id': this.state.const_id,
        'to_input_id': i,
        'from_point': {
          'x': e.clientX - blocks_wrapper_rect.x,
          'y': e.clientY - blocks_wrapper_rect.y
        },
        'to_point': getElementCenter(this.input_connectors_refs[i].current)
      });else if (e.button == 2) this.state.remove_wires_function({
        'to_block_const_id': this.state.const_id,
        'to_input_id': i
      });
    } else if (type == 'output') {
      if (e.button == 0) this.state.start_adding_wire_function({
        'from_block_const_id': this.state.const_id,
        'from_output_id': i,
        'from_point': getElementCenter(this.output_connectors_refs[i].current),
        'to_point': {
          'x': e.clientX - blocks_wrapper_rect.x,
          'y': e.clientY - blocks_wrapper_rect.y
        }
      });else if (e.button == 2) this.state.remove_wires_function({
        'from_block_const_id': this.state.const_id,
        'from_output_id': i
      });
    }
  }

  handleMouseWheel() {
    this.state.onStateChange(this.getInfo(this.state));
  }

  render() {
    const x = this.state.x;
    const y = this.state.y;
    const type = this.state.type;
    const name = this.state.id;
    const visible_name = type == 'INPUT' || type == 'OUTPUT' ? name : type;
    const max_connectors = Math.max(this.state.inputs.length, this.state.outputs.length);
    return /*#__PURE__*/React.createElement("div", {
      ref: this._ref,
      className: "block",
      onMouseUp: this.handleMouseUp,
      onMouseMove: this.handleMouseMove,
      style: {
        'position': 'absolute',
        'left': x,
        'top': y,
        'zIndex': this.state.dragging ? 101 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "content",
      onMouseDown: e => {
        if (e.target.classList.contains('content') || e.target.classList.contains('name')) this.handleMouseDown(e);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputs"
    }, this.state.inputs.map((input, i) => /*#__PURE__*/React.createElement("div", {
      ref: this.input_connectors_refs[i],
      key: i,
      className: "input",
      onMouseDown: e => this.handleMouseDownOnInputOutput('input', i, e),
      onMouseUp: e => this.state.handle_mouse_up_on_input_output_function({
        'to_block_const_id': this.state.const_id,
        'to_input_id': i
      })
    }))), /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, visible_name), /*#__PURE__*/React.createElement("div", {
      className: "outputs"
    }, this.state.outputs.map((output, i) => /*#__PURE__*/React.createElement("div", {
      ref: this.output_connectors_refs[i],
      key: i,
      className: "output",
      onMouseDown: e => this.handleMouseDownOnInputOutput('output', i, e),
      onMouseUp: e => this.state.handle_mouse_up_on_input_output_function({
        'from_block_const_id': this.state.const_id,
        'from_output_id': i
      })
    })))));
  }

}