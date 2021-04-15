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
    this.state = {
      'const_id': props.const_id,
      'id': props.id,
      'type': props.type,
      'x': props.x,
      'y': props.y,
      'scale': props.scale,
      'handleMouseDown': props.handleMouseDown,
      'handleMouseMove': props.handleMouseMove,
      'dragging': props.dragging || false,
      'initital_dragging': props.dragging || false,
      'gripX': undefined,
      'gripY': undefined,
      'inputs': props.inputs ? props.inputs : props.type_info['inputs'],
      'outputs': props.outputs ? props.outputs : props.type_info['outputs'],
      'inputs_groups': props.inputs_groups,
      'outputs_groups': props.outputs_groups,
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
    return {
      'get_info_function': this.getInfo.bind(this),
      'type': state.type,
      'id': state.id,
      'const_id': state.const_id,
      'x': state.x,
      'y': state.y,
      'inputs': state.inputs,
      'outputs': state.outputs,
      'outputs_groups': state.outputs_groups,
      'inputs_groups': state.inputs_groups,
      'input_connectors_coordinates': this.input_connectors_refs.slice(0, this.state.inputs_groups.length).map(r => getElementCenter(r.current)),
      'output_connectors_coordinates': this.output_connectors_refs.slice(0, this.state.outputs_groups.length).map(r => getElementCenter(r.current))
    };
  }

  componentDidMount() {
    const content_element = this._ref.current.children[0];
    const name_element = this._ref.current.children[0].children[1];

    const ifDraggableByThis = (e, f) => e.target === content_element || e.target === name_element ? f(e) : null;

    this.state.event_listeners = [[this._ref.current.parentElement.parentElement, 'mousemove', this.handleMouseMove], [this._ref.current, 'mousedown', e => e.preventDefault()]];

    for (const e_l of this.state.event_listeners) e_l[0].addEventListener(e_l[1], e_l[2]);

    if (this.state.dragging) {
      const mouse_x = this.state.x;
      const mouse_y = this.state.y;
      const scale = this.state.scale;

      const self_rect = this._ref.current.getBoundingClientRect();

      const blocks_wrapper_element = this._ref.current.parentElement;
      const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();
      const center = {
        'x': (this.state.x - self_rect.width / 2 - blocks_wrapper_rect.x) / scale,
        'y': (this.state.y - self_rect.height / 2 - blocks_wrapper_rect.y) / scale
      };
      this.setState(state => {
        state.x = center.x;
        state.y = center.y;
        return state;
      }, () => this.handleMouseDown({
        'clientX': mouse_x,
        'clientY': mouse_y,
        'button': 0
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
    this.state.handleMouseDown(this, e.clientX, e.clientY, e.button, function_after);
  }

  handleMouseUp(e) {
    if (this.state.initital_dragging) this.state.onStopInitialDragging(this.state.const_id);
    if (this.state.dragging) this.setState({
      'dragging': false,
      'initital_dragging': false
    });
  }

  handleMouseMove(e) {
    this.state.handleMouseMove(this, e.clientX, e.clientY);
  }

  handleMouseLeave(e) {
    this.handleMouseMove(e);
  }

  handleMouseDownOnInputOutput(type, i, e) {
    const blocks_wrapper_element = this._ref.current.parentElement;
    const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();

    if (type == 'input') {
      if (e.button == 0) this.state.start_adding_wire_function({
        'group_size': this.state.inputs_groups[i],
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
        'group_size': this.state.outputs_groups[i],
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
      onMouseUp: e => e.button == 0 ? this.handleMouseUp(e) : null,
      onContextMenu: e => e.preventDefault(),
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
    }, this.state.inputs_groups.map((input_group, i) => /*#__PURE__*/React.createElement("div", {
      ref: this.input_connectors_refs[i],
      key: i,
      className: "input",
      onMouseDown: e => this.handleMouseDownOnInputOutput('input', i, e),
      onMouseUp: e => e.button == 0 ? this.state.handle_mouse_up_on_input_output_function({
        'group_size': input_group,
        'to_block_const_id': this.state.const_id,
        'to_input_id': i
      }) : null
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputGroupSize unselectable"
    }, input_group)))), /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, visible_name), /*#__PURE__*/React.createElement("div", {
      className: "outputs"
    }, this.state.outputs_groups.map((output_group, i) => /*#__PURE__*/React.createElement("div", {
      ref: this.output_connectors_refs[i],
      key: i,
      className: "output",
      onMouseDown: e => this.handleMouseDownOnInputOutput('output', i, e),
      onMouseUp: e => e.button == 0 ? this.state.handle_mouse_up_on_input_output_function({
        'group_size': output_group,
        'from_block_const_id': this.state.const_id,
        'from_output_id': i
      }) : null
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputGroupSize unselectable"
    }, output_group))))));
  }

}