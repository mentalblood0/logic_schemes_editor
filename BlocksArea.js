'use strict';

const sum = m => m.reduce((a, b) => a + b, 0);

const default_elements = {
  'INPUT': {
    'inputs': [],
    'outputs': ['x']
  },
  'OUTPUT': {
    'inputs': ['x'],
    'outputs': []
  },
  'NOT': {
    'inputs': ['x'],
    'outputs': ['!x']
  },
  'AND': {
    'inputs': ['x', 'y'],
    'outputs': ['x && y']
  },
  'OR': {
    'inputs': ['x', 'y'],
    'outputs': ['x || y']
  }
};

function scalePoint(point, scale) {
  return {
    'x': point.x * scale,
    'y': point.y * scale
  };
}

function getUniqueId(some_dict) {
  return Object.keys(some_dict).length == 0 ? 0 : Math.max(...Object.keys(some_dict)) + 1;
}

class BlocksArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'name': 'test',
      'custom_elements': {},
      'new_element_type': 'new',
      'new_element_inputs_number': 1,
      'new_element_outputs_number': 1,
      'inputs_number': 0,
      'outputs_number': 0,
      'blocks': {},
      'wires': {},
      'adding_wire': false,
      'adding_wire_info': undefined,
      'dragging_block': false,
      'scale': 1,
      'offset': {
        'x': 0,
        'y': 0
      },
      'dragging_scheme': false,
      'dragging_scheme_from_point': undefined,
      'tests_editor_opened': false,
      'tests': []
    };
    this.onBlockStateChange = this.onBlockStateChange.bind(this);
    this.onBlockMounted = this.onBlockMounted.bind(this);
    this.onBlockStopInitialDragging = this.onBlockStopInitialDragging.bind(this);
    this.save = this.save.bind(this);
    this.load = this.load.bind(this);
    this.export = this.export.bind(this);
    this.clear = this.clear.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseDownOnSchemeArea = this.handleMouseDownOnSchemeArea.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.startAddingWire = this.startAddingWire.bind(this);
    this.handleMouseUpOnInputOutput = this.handleMouseUpOnInputOutput.bind(this);
    this.handleSchemeNameInputChange = this.handleSchemeNameInputChange.bind(this);
    this.handleNewElementNameInputChange = this.handleNewElementNameInputChange.bind(this);
    this.handleNewElementInputsNumberInputChange = this.handleNewElementInputsNumberInputChange.bind(this);
    this.handleNewElementOutputsNumberInputChange = this.handleNewElementOutputsNumberInputChange.bind(this);
    this.handleAddBlockButtonClick = this.handleAddBlockButtonClick.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.removeWires = this.removeWires.bind(this);
    this.getTypeInfo = this.getTypeInfo.bind(this);
    this._ref = React.createRef();
    this.inputs_number_ref = React.createRef();
    this.outputs_number_ref = React.createRef();
    this.state.blocks_wrapper_ref = React.createRef();
  }

  componentDidMount() {
    this.state.event_listeners = [[this.inputs_number_ref.current, 'wheel', e => {
      e.preventDefault();
      const delta = -e.deltaY / 100;
      this.setState(state => {
        const new_value = Number.parseInt(state.new_element_inputs_number, 10) + delta;
        if (new_value >= 1) state.new_element_inputs_number = new_value;
        return state;
      });
    }], [this.outputs_number_ref.current, 'wheel', e => {
      e.preventDefault();
      const delta = -e.deltaY / 100;
      this.setState(state => {
        const new_value = state.new_element_outputs_number + delta;
        if (new_value >= 1) state.new_element_outputs_number = new_value;
        return state;
      });
    }], //fucking drag and drop
    [this._ref.current, 'drag', e => e.preventDefault()], [this._ref.current, 'dragstart', e => e.preventDefault()], [this._ref.current, 'dragend', e => e.preventDefault()], [this._ref.current, 'dragover', e => e.preventDefault()], [this._ref.current, 'dragenter', e => e.preventDefault()], [this._ref.current, 'dragleave', e => e.preventDefault()], [this._ref.current, 'drop', e => e.preventDefault()]];

    for (const e_l of this.state.event_listeners) e_l[0].addEventListener(e_l[1], e_l[2]);
  }

  componentWillUnmount() {
    for (const e_l of this.state.event_listeners) e_l[0].removeEventListener(e_l[1], e_l[2]);
  }

  add(data, wire_type_relative_to_block) {
    this.setState(state => {
      if (!('blocks' in data)) return state;

      for (const b of data.blocks) {
        const dict_with_blocks_with_such_name = Object.fromEntries(Object.entries(this.state.blocks).filter(([k, v]) => v.type == b.type));
        const current_const_ids = Object.values(state.blocks).map(v => v.const_id);
        const const_id = current_const_ids.length == 0 ? 1 : Math.max(...current_const_ids) + 1;
        const id = b.type + '_' + (Object.keys(dict_with_blocks_with_such_name).length + 1);
        if (state.blocks[const_id] != undefined) return state;
        const block = {
          'id': id,
          'type': b.type,
          'x': b.x,
          'y': b.y,
          'inputs': b.inputs,
          'outputs': b.outputs
        };
        if (b.dragging) block['dragging'] = true;
        state.blocks[const_id] = block;
        if (b.type == 'INPUT') state.inputs_number += 1;else if (b.type == 'OUTPUT') state.outputs_number += 1;
      }

      return state;
    }, () => {
      if (!('wires' in data)) return;
      this.render();
      this.setState(state => {
        for (const w of data.wires) {
          const new_id = getUniqueId(state.wires);
          state.wires[new_id] = {
            'id': new_id,
            'from_block_const_id': String(w.from_block_const_id),
            'to_block_const_id': String(w.to_block_const_id),
            'from_output_id': w.from_output_id,
            'to_input_id': w.to_input_id
          };
          const b_to = state.blocks[w.to_block_const_id];
          const b_from = state.blocks[w.from_block_const_id];
          state.blocks[w.to_block_const_id] = b_to.get_info_function();
          state.blocks[w.from_block_const_id] = b_from.get_info_function();
          this.updateWireCoordinates(state, new_id, wire_type_relative_to_block, true);
        }

        return state;
      });
    });
  }

  updateWireCoordinates(state, wire_id, type_relative_to_block, convert = true) {
    const wire = state.wires[wire_id];
    const from_block = state.blocks[wire.from_block_const_id];
    const to_block = state.blocks[wire.to_block_const_id];
    const blocks_wrapper_element = this._ref.current.parentElement;
    const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();
    const scale = this.state.scale;
    const convertCoordinates = convert ? p => ({
      'x': p.x / scale,
      'y': p.y / scale
    }) : p => p;
    if (type_relative_to_block != 'to') wire.from_point = convertCoordinates(from_block.output_connectors_coordinates[wire.from_output_id]);
    if (type_relative_to_block != 'from') wire.to_point = convertCoordinates(to_block.input_connectors_coordinates[wire.to_input_id]);
    state.wires[wire_id] = wire;
  }

  onBlockMounted(detail) {
    this.setState(state => {
      state.blocks[detail.const_id] = Object.assign(detail);
      return state;
    });
  }

  onBlockStateChange(detail) {
    this.setState(state => {
      state.blocks[detail.const_id] = detail;
      Object.values(state.wires).forEach(w => {
        if (detail.const_id == w.from_block_const_id) {
          this.updateWireCoordinates(state, w.id, 'from', true);
        } else if (detail.const_id == w.to_block_const_id) {
          this.updateWireCoordinates(state, w.id, 'to', true);
        }
      });
      return state;
    });
  }

  getTypeInfo(type_name) {
    if (type_name in default_elements) return default_elements[type_name];else if (type_name in this.state.custom_elements) return this.state.custom_elements[type_name];
  }

  onBlockStopInitialDragging(block_id) {
    this.setState(state => {
      state.blocks[block_id].dragging = false;
      return state;
    });
  }

  getSaveData() {
    return {
      'name': this.state.name,
      'custom_elements': this.state.custom_elements,
      'new_element_type': this.state.new_element_type,
      'new_element_inputs_number': Number.parseInt(this.state.new_element_inputs_number, 10),
      'new_element_outputs_number': Number.parseInt(this.state.new_element_outputs_number, 10),
      'inputs_number': Number.parseInt(this.state.inputs_number, 10),
      'outputs_number': Number.parseInt(this.state.outputs_number, 10),
      'blocks': this.state.blocks,
      'wires': this.state.wires,
      'tests': this.state.tests
    };
  }

  getSaveName() {
    const today = new Date();
    const current_date = today.getFullYear().toString() + '-' + (today.getMonth() + 1).toString() + '-' + today.getDate().toString();
    const current_time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return 'logic-scheme' + '-' + this.state.name + '-' + current_date + '-' + current_time + '.json';
  }

  save() {
    const data = this.getSaveData();
    const data_text = JSON.stringify(data, null, '\t');
    const name = this.getSaveName();
    downloadFile(name, data_text);
  }

  setLoadData(data) {
    this.setState(data);
  }

  load() {
    uploadFile('json', jsonText => {
      const data = JSON.parse(jsonText);
      this.setLoadData(data);
    });
  }

  getExportData() {
    const blocks = this.state.blocks;
    const tests = this.state.tests;
    const inputs_number = Object.values(this.state.blocks).filter(b => b.type == 'INPUT').length;
    const outputs_number = Object.values(this.state.blocks).filter(b => b.type == 'OUTPUT').length;
    const unpacked_wires = [];
    Object.values(this.state.wires).forEach(w => {
      const group_size = blocks[w.from_block_const_id].outputs_groups[w.from_output_id];
      const outputs_before_output = blocks[w.from_block_const_id].outputs_groups.slice(0, w.from_output_id);
      const first_output_index = sum(outputs_before_output);
      const inputs_before_input = blocks[w.to_block_const_id].inputs_groups.slice(0, w.to_input_id);
      const first_input_index = sum(inputs_before_input);

      for (let i = 0; i < group_size; i++) {
        const from_output_id = first_output_index + i;
        const to_input_id = first_input_index + i;
        unpacked_wires.push({
          'from': blocks[w.from_block_const_id].id + '[' + (from_output_id + 1) + ']',
          'to': blocks[w.to_block_const_id].id + '[' + (to_input_id + 1) + ']'
        });
      }
    });
    const data = {
      [this.state.name]: {
        // 'wires': Object.values(this.state.wires).map(w => ({
        // 	'from': blocks[w.from_block_const_id].id + '[' + (w.from_output_id + 1) + ']',
        // 	'to': blocks[w.to_block_const_id].id + '[' + (w.to_input_id + 1) + ']'
        // })),
        'wires': unpacked_wires
      }
    };
    if (tests.length > 0) data[this.state.name]['tests'] = tests.map(t => ({
      'inputs': t.slice(0, inputs_number),
      'outputs': t.slice(-outputs_number)
    }));
    return data;
  }

  getExportName() {
    return this.state.name + '.json';
  }

  export() {
    const data = this.getExportData();
    const data_text = JSON.stringify(data, null, '\t');
    const name = this.getExportName();
    downloadFile(name, data_text);
  }

  handleMouseDown(e, element_type, inputs_number, outputs_number) {
    if (e.button != 0) return;
    const blocks_wrapper_rect = this.state.blocks_wrapper_ref.current.getBoundingClientRect();
    const scale = this.state.scale;
    this.add({
      'blocks': [{
        'type': element_type,
        'x': e.clientX,
        'y': e.clientY,
        'dragging': true,
        'inputs': inputs_number ? filledArray(inputs_number, '') : undefined,
        'outputs': inputs_number ? filledArray(outputs_number, '') : undefined
      }]
    });
  }

  handleBlockMouseDown(b, mouse_x, mouse_y, button, function_after) {
    if (button === 2) {
      b.state.function_to_delete_self();
      return;
    }

    this.setState({
      'dragging_block': true
    });
    const blocks_wrapper_element = b._ref.current.parentElement;
    const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();
    const scale = this.state.scale;
    b.setState(state => {
      state.dragging = true;
      state.gripX = (mouse_x - blocks_wrapper_rect.x) / scale - state.x;
      state.gripY = (mouse_y - blocks_wrapper_rect.y) / scale - state.y;
      return state;
    }, function_after);
  }

  handleMouseDownOnSchemeArea(e) {
    if (!e.target.classList.contains('schemeArea')) return;
    const mouse_x = e.clientX;
    const mouse_y = e.clientY;
    this.setState(state => ({
      'dragging_scheme': true,
      'dragging_scheme_from_point': {
        'x': mouse_x - state.offset.x,
        'y': mouse_y - state.offset.y
      }
    }));
  }

  handleMouseMove(e) {
    const mouse_x = e.clientX;
    const mouse_y = e.clientY;

    if (this.state.dragging_scheme) {
      this.setState(state => ({
        'offset': {
          'x': mouse_x - state.dragging_scheme_from_point['x'],
          'y': mouse_y - state.dragging_scheme_from_point['y']
        }
      }));
    } else if (this.state.adding_wire_info) {
      const blocks_wrapper_element = this.state.blocks_wrapper_ref.current;
      const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();
      const info = this.state.adding_wire_info;
      if (info.from_block_const_id == undefined) this.setState(state => {
        state.adding_wire_info.from_point = {
          'x': mouse_x - blocks_wrapper_rect.x,
          'y': mouse_y - blocks_wrapper_rect.y
        };
        return state;
      });else this.setState(state => {
        state.adding_wire_info.to_point = {
          'x': mouse_x - blocks_wrapper_rect.x,
          'y': mouse_y - blocks_wrapper_rect.y
        };
        return state;
      });
    }
  }

  handleBlockMouseMove(b, mouse_x, mouse_y) {
    const blocks_wrapper_element = b._ref.current.parentElement;
    const blocks_wrapper_rect = blocks_wrapper_element.getBoundingClientRect();
    const scale = this.state.scale;

    if (b.state.dragging === true) {
      b.setState(state => {
        state.x = (mouse_x - blocks_wrapper_rect.x) / scale - state.gripX;
        state.y = (mouse_y - blocks_wrapper_rect.y) / scale - state.gripY;
        return state;
      }, () => b.state.onStateChange(b.getInfo(b.state)));
    }
  }

  handleMouseUp() {
    this.setState({
      'adding_wire': false,
      'dragging_block': false,
      'dragging_scheme': false,
      'dragging_scheme_from_point': undefined
    });
  }

  handleMouseUpOnInputOutput(input_output_info) {
    if (this.state.adding_wire_info.group_size != input_output_info.group_size) return;
    const new_wire_info = Object.assign({}, this.state.adding_wire_info);
    this.setState({
      'adding_wire_info': undefined
    });

    for (const key in input_output_info) new_wire_info[key] = input_output_info[key];

    if (!('to_block_const_id' in new_wire_info) || !('from_block_const_id' in new_wire_info) || new_wire_info.to_block_const_id == new_wire_info.from_block_const_id) return;
    delete new_wire_info['from_point'];
    delete new_wire_info['to_point'];
    this.add({
      'wires': [new_wire_info]
    });
  }

  removeBlock(const_id) {
    this.setState(state => {
      if (!state.blocks[const_id]) return state;
      const type = state.blocks[const_id].type;
      if (type == 'INPUT') state.inputs_number -= 1;else if (type == 'OUTPUT') state.outputs_number -= 1;
      const id = state.blocks[const_id].id;
      const number = Number.parseInt(id.split('_').pop(), 10);
      delete state.blocks[const_id];
      state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k, v]) => v.from_block_const_id != const_id && v.to_block_const_id != const_id));

      for (const k in state.blocks) if (state.blocks[k].type == type) if (state.blocks[k].id > id) {
        const n = Number.parseInt(state.blocks[k].id.split('_').pop(), 10);
        state.blocks[k].id = state.blocks[k].type + '_' + (n - 1);
      }

      return state;
    });
  }

  startAddingWire(wire_info) {
    this.setState({
      'adding_wire': true,
      'adding_wire_info': wire_info
    });
  }

  removeWires(mask) {
    this.setState(state => {
      state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k, v]) => {
        for (const mask_key in mask) if (mask[mask_key] != v[mask_key]) return true;

        return false;
      }));
      return state;
    });
  }

  handleSchemeNameInputChange(e) {
    this.setState({
      'name': e.target.value
    });
  }

  handleNewElementNameInputChange(e) {
    this.setState({
      'new_element_type': e.target.value
    });
  }

  handleNewElementInputsNumberInputChange(e) {
    this.setState({
      'new_element_inputs_number': Number.parseInt(e.target.value, 10)
    });
  }

  handleNewElementOutputsNumberInputChange(e) {
    this.setState({
      'new_element_outputs_number': Number.parseInt(e.target.value, 10)
    });
  }

  handleMouseWheel(e) {
    const delta = 1 + -e.deltaY / 1000;
    const mouse_x = e.clientX;
    const mouse_y = e.clientY;
    this.setState(state => {
      state.scale *= delta;
      state.offset.x -= (delta - 1) * (window.innerWidth / 2 - state.offset.x);
      state.offset.y -= (delta - 1) * (window.innerHeight / 2 - state.offset.y);
      return state;
    });
  }

  handleAddBlockButtonClick() {
    const name = this.state.new_element_type;
    const inputs_number = this.state.new_element_inputs_number;
    const outputs_number = this.state.new_element_outputs_number;
    const new_element_info = {
      'inputs': filledArray(inputs_number, ''),
      'outputs': filledArray(outputs_number, '')
    };
    this.setState(state => {
      this.state.custom_elements[name] = new_element_info;
      return state;
    }, () => this.forceUpdate());
  }

  clear() {
    this.setState({
      'blocks': {},
      'wires': {},
      'tests': []
    });
  }

  render() {
    const scale = this.state.scale;
    const offset = this.state.offset;
    const inputs_number = this.state.inputs_number;
    const outputs_number = this.state.outputs_number;
    const tests_number = this.state.tests.length;
    const max_tests_number = 2 ** inputs_number;
    return /*#__PURE__*/React.createElement("div", {
      className: "blocksArea",
      ref: this._ref
    }, /*#__PURE__*/React.createElement("div", {
      className: "sidePanel",
      style: {
        'zIndex': 10,
        'display': this.state.dragging_block ? 'none' : 'block'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "controls"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "schemeName unselectable",
      value: this.state.name,
      onChange: this.handleSchemeNameInputChange
    }), /*#__PURE__*/React.createElement("button", {
      className: "exportButton animated animated-lightblue unselectable",
      onClick: this.export
    }, "export"), /*#__PURE__*/React.createElement("button", {
      className: "saveButton animated animated-green unselectable",
      onClick: this.save
    }, "save"), /*#__PURE__*/React.createElement("button", {
      className: "loadButton animated animated-blue unselectable",
      onClick: this.load
    }, "load"), /*#__PURE__*/React.createElement("button", {
      className: "clearButton animated animated-red unselectable",
      onClick: this.clear
    }, "clear")), /*#__PURE__*/React.createElement("div", {
      className: "tests"
    }, inputs_number > 0 && outputs_number > 0 ? /*#__PURE__*/React.createElement("div", {
      className: "coverageInfo unselectable",
      id: tests_number + '_' + max_tests_number
    }, "Coverage:", /*#__PURE__*/React.createElement("br", null), tests_number, "/", max_tests_number, " (", Math.floor(tests_number / max_tests_number * 100), "%)") : null, /*#__PURE__*/React.createElement("button", {
      className: "editTestsButton animated animated-lightblue unselectable",
      onClick: () => this.setState({
        'tests_editor_opened': true
      })
    }, "edit tests")), /*#__PURE__*/React.createElement("div", {
      className: "blocks"
    }, /*#__PURE__*/React.createElement("div", {
      className: "block blockToAdd",
      onMouseDown: e => this.handleMouseDown(e, this.state.new_element_type, this.state.new_element_inputs_number, this.state.new_element_outputs_number)
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "name",
      value: this.state.new_element_type,
      onChange: this.handleNewElementNameInputChange,
      onMouseDown: e => {
        e.stopPropagation();
      }
    }))), /*#__PURE__*/React.createElement("div", {
      className: "inputsOutputsNumber"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputsNumber"
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "1",
      ref: this.inputs_number_ref,
      value: this.state.new_element_inputs_number,
      onChange: this.handleNewElementInputsNumberInputChange
    })), /*#__PURE__*/React.createElement("div", {
      className: "outputsNumber"
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "1",
      ref: this.outputs_number_ref,
      value: this.state.new_element_outputs_number,
      onChange: this.handleNewElementOutputsNumberInputChange
    }))), /*#__PURE__*/React.createElement("button", {
      className: "addBlockButton animated animated-green unselectable",
      onClick: this.handleAddBlockButtonClick
    }, "+"), Object.entries(this.state.custom_elements).map((element_type_and_element, i) => /*#__PURE__*/React.createElement("div", {
      key: element_type_and_element[0],
      className: "block",
      onMouseDown: e => this.handleMouseDown(e, element_type_and_element[0])
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, element_type_and_element[0])))), Object.entries(default_elements).map((element_type_and_element, i) => /*#__PURE__*/React.createElement("div", {
      key: element_type_and_element[0],
      className: "block",
      onMouseDown: e => this.handleMouseDown(e, element_type_and_element[0])
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, element_type_and_element[0])))))), this.state.tests_editor_opened ? /*#__PURE__*/React.createElement(ModalWindow, {
      close_function: () => this.setState({
        'tests_editor_opened': false
      })
    }, /*#__PURE__*/React.createElement(TestsEditor, {
      inputs: Array.from({
        length: inputs_number
      }, (_, i) => i + 1),
      outputs: Array.from({
        length: outputs_number
      }, (_, i) => i + 1),
      tests: this.state.tests.map(t => t.slice(0, inputs_number).concat(t.slice(-outputs_number))),
      onUnmount: tests => this.setState({
        'tests': tests
      })
    })) : null, /*#__PURE__*/React.createElement("div", {
      className: "schemeArea",
      onWheel: this.handleMouseWheel,
      onMouseDown: this.handleMouseDownOnSchemeArea,
      onMouseMove: this.handleMouseMove,
      onMouseUp: this.handleMouseUp,
      onContextMenu: e => e.preventDefault()
    }, /*#__PURE__*/React.createElement("div", {
      className: "blocksWrapper",
      ref: this.state.blocks_wrapper_ref,
      style: {
        'left': offset.x,
        'top': offset.y,
        'transform': 'scale(' + scale + ')'
      }
    }, Object.entries(this.state.blocks).map((block_id_and_block, i) => /*#__PURE__*/React.createElement(Block, {
      key: block_id_and_block[1].type == 'INPUT' || block_id_and_block[1] == 'OUTPUT' ? block_id_and_block[0] + '_' + block_id_and_block[1].id : block_id_and_block[0],
      const_id: block_id_and_block[0],
      id: block_id_and_block[1].id,
      type: block_id_and_block[1].type,
      x: block_id_and_block[1].x,
      y: block_id_and_block[1].y,
      scale: this.state.scale,
      handleMouseMove: this.handleBlockMouseMove.bind(this),
      handleMouseDown: this.handleBlockMouseDown.bind(this),
      dragging: block_id_and_block[1].dragging,
      inputs: block_id_and_block[1].inputs,
      outputs: block_id_and_block[1].outputs,
      function_to_delete_self: () => this.removeBlock(block_id_and_block[0]),
      start_adding_wire_function: this.startAddingWire,
      handle_mouse_up_on_input_output_function: this.handleMouseUpOnInputOutput,
      remove_wires_function: this.removeWires,
      onMount: this.onBlockMounted,
      onStateChange: this.onBlockStateChange,
      onStopInitialDragging: this.onBlockStopInitialDragging,
      type_info: this.getTypeInfo(block_id_and_block[1].type)
    })), Object.values(this.state.wires).map(wire => /*#__PURE__*/React.createElement(Wire, {
      key: wire.from_point.x + '_' + wire.from_point.y + '_' + wire.to_point.x + '_' + wire.to_point.y,
      from_point: wire.from_point,
      to_point: wire.to_point,
      scale: scale
    })), this.state.adding_wire ? /*#__PURE__*/React.createElement(Wire_f, {
      from_point: scalePoint(this.state.adding_wire_info.from_point, 1 / scale),
      to_point: scalePoint(this.state.adding_wire_info.to_point, 1 / scale),
      scale: scale
    }) : null)));
  }

}