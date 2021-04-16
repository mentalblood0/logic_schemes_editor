'use strict';

const sum = m => m.reduce((a, b) => a + b, 0);

const default_elements = {
  'INPUT': {
    'inputs': [],
    'outputs': ['x'],
    'inputs_groups': [],
    'outputs_groups': [1]
  },
  'OUTPUT': {
    'inputs': ['x'],
    'outputs': [],
    'inputs_groups': [1],
    'outputs_groups': []
  },
  'NOT': {
    'inputs': ['x'],
    'outputs': ['!x'],
    'inputs_groups': [1],
    'outputs_groups': [1]
  },
  'AND': {
    'inputs': ['x', 'y'],
    'outputs': ['x && y'],
    'inputs_groups': [1, 1],
    'outputs_groups': [1]
  },
  'OR': {
    'inputs': ['x', 'y'],
    'outputs': ['x || y'],
    'inputs_groups': [1, 1],
    'outputs_groups': [1]
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

function joinWithNext(array, i) {
  if (array.length > i + 1) {
    array[i] += array[i + 1];
    array.splice(i + 1, 1);
  }

  return array;
}

function unjoinToNext(array, i) {
  if (array[i] > 1) {
    array[i] -= 1;
    array.splice(i + 1, 0, 1);
  }

  return array;
}

function cutToSum(array, sum) {
  const result = [];
  let left = sum;

  for (let n of array) {
    if (left == 0) break;
    if (n > left) n = left;
    left -= n;
    result.push(n);
  }

  for (let i = 0; i < left; i++) result.push(1);

  return result;
}

function numberOr(x, i) {
  x = Number.parseInt(x, 10);
  return isNaN(x) ? i : x;
}

class BlocksArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'name': 'test',
      'custom_elements': {},
      'new_element': {
        'type': 'new',
        'inputs': [''],
        'outputs': [''],
        'inputs_groups': [1],
        'outputs_groups': [1]
      },
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
        const new_number = state.new_element.inputs.length + delta;
        if (new_number < 1) return state;
        state.new_element.inputs = filledArray(new_number, '');
        state.new_element.inputs_groups = cutToSum(state.new_element.inputs_groups, new_number);
        return state;
      });
    }], [this.outputs_number_ref.current, 'wheel', e => {
      e.preventDefault();
      const delta = -e.deltaY / 100;
      this.setState(state => {
        const new_number = numberOr(state.new_element.outputs.length, 1) + delta;
        if (new_number < 1) return state;
        state.new_element.outputs = filledArray(new_number, '');
        state.new_element.outputs_groups = cutToSum(state.new_element.outputs_groups, new_number);
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
        const current_const_ids = Object.values(state.blocks).map(v => v.const_id);
        const const_id = current_const_ids.length == 0 ? 1 : Math.max(...current_const_ids) + 1;
        if (state.blocks[const_id] != undefined) return state;

        if (b.type == 'INPUT') {
          b.id = b.type + ' ' + (state.inputs_number + 1);
          state.inputs_number += 1;
        } else if (b.type == 'OUTPUT') {
          b.id = b.type + ' ' + (state.outputs_number + 1);
          state.outputs_number += 1;
        } else {
          const dict_with_blocks_with_such_name = Object.fromEntries(Object.entries(this.state.blocks).filter(([k, v]) => v.type == b.type));
          b.id = b.type + ' ' + (Object.keys(dict_with_blocks_with_such_name).length + 1);
        }

        state.blocks[const_id] = b;
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
          state.blocks[w.to_block_const_id] = b_to.getInfo();
          state.blocks[w.from_block_const_id] = b_from.getInfo();
          this.updateWireCoordinates(state, new_id, wire_type_relative_to_block, true);
        }

        return state;
      }, () => console.log('after add:', this.state));
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
    if (type_name in default_elements) return Object.assign({}, default_elements[type_name]);else if (type_name in this.state.custom_elements) return Object.assign({}, this.state.custom_elements[type_name]);
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
      'new_element': this.state.new_element,
      'inputs_number': this.state.inputs_number,
      'outputs_number': this.state.outputs_number,
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
      const from_block = blocks[w.from_block_const_id];
      const to_block = blocks[w.to_block_const_id];
      const group_size = from_block.outputs_groups[w.from_output_id];
      const from_block_type = blocks[w.from_block_const_id].type;
      const to_block_type = blocks[w.to_block_const_id].type;
      const outputs_before_output = blocks[w.from_block_const_id].outputs_groups.slice(0, w.from_output_id);
      const first_output_index = sum(outputs_before_output);
      const inputs_before_input = blocks[w.to_block_const_id].inputs_groups.slice(0, w.to_input_id);
      const first_input_index = sum(inputs_before_input);

      for (let i = 0; i < group_size; i++) {
        const from_output_id = first_output_index + i;
        const to_input_id = first_input_index + i;
        const new_unpucked_wire = {};

        if (from_block_type == 'INPUT' && from_block.id.includes('-')) {
          const n = from_block.id.split(' ')[1];
          const n_splited = n.split('-');
          const n_from = Number.parseInt(n_splited[0], 10);
          new_unpucked_wire.from = 'INPUT ' + (n_from + i);
        } else {
          const id_splited = from_block.id.split(' ');
          new_unpucked_wire.from = id_splited[0] + '_' + id_splited[1] + '[' + (from_output_id + 1) + ']';
        }

        if (to_block_type == 'OUTPUT' && to_block.id.includes('-')) {
          const n = to_block.id.split('_')[1];
          const n_splited = n.split('-');
          const n_from = Number.parseInt(n_splited[0], 10);
          new_unpucked_wire.to = 'OUTPUT_' + (n_from + i);
        } else {
          const id_splited = to_block.id.split(' ');
          new_unpucked_wire.to = id_splited[0] + '_' + id_splited[1] + '[' + (to_input_id + 1) + ']';
        }

        unpacked_wires.push(new_unpucked_wire);
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

  handleMouseDown(e, element_type, element_info) {
    if (e.button != 0) return;
    this.add({
      'blocks': [Object.assign(element_info, {
        'type': element_type,
        'x': e.clientX,
        'y': e.clientY,
        'dragging': true
      })]
    });
  }

  handleBlockMouseDown(b, mouse_x, mouse_y, button, function_after) {
    if (button === 2) {
      b.state.removeBlock();
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
    if (!this.state.adding_wire) return;
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
      const id = state.blocks[const_id].id;
      const number = Number.parseInt(id.split(' ').pop(), 10);
      state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k, v]) => v.from_block_const_id != const_id && v.to_block_const_id != const_id));
      let delta = undefined;

      if (type == 'INPUT') {
        delta = -sum(state.blocks[const_id].getOutputsGroups());
        state.inputs_number += delta;
      } else if (type == 'OUTPUT') {
        delta = -sum(state.blocks[const_id].getInputsGroups());
        state.outputs_number += delta;
      } else delta = -1;

      delete state.blocks[const_id];
      this.shiftBlocksIds(state, type, const_id, delta);
      return state;
    });
  }

  updateInputsOutputsNames(type, const_id, delta) {
    this.setState(state => {
      const current_n = state.blocks[const_id].id.split(' ')[1];
      let new_current_n = undefined;

      if (current_n.includes('-')) {
        const current_n_splited = current_n.split('-');
        const current_n_from = Number.parseInt(current_n_splited[0], 10);
        const current_n_to = Number.parseInt(current_n_splited[1], 10);
        const new_n_to = current_n_to + delta;
        if (new_n_to == current_n_from) new_current_n = '' + current_n_from;else new_current_n = current_n_from + '-' + (current_n_to + delta);
      } else {
        const current_n_int = Number.parseInt(current_n, 10);
        new_current_n = current_n_int + '-' + (current_n_int + delta);
      }

      state.blocks[const_id].id = type + ' ' + new_current_n;
      this.shiftBlocksIds(state, type, const_id, delta);
      if (type == 'INPUT') state.inputs_number += delta;else if (type = 'OUTPUT') state.outputs_number += delta;
      return state;
    });
  }

  shiftBlocksIds(state, type, from_const_id, delta) {
    for (const k in state.blocks) if (state.blocks[k].type == type) if (state.blocks[k].const_id > from_const_id) {
      const n = state.blocks[k].id.split(' ')[1];
      let new_n = undefined;

      if (n.includes('-')) {
        const n_splited = n.split('-');
        const n_from = Number.parseInt(n_splited[0], 10);
        const n_to = Number.parseInt(n_splited[1], 10);
        new_n = n_from + delta + '-' + (n_to + delta);
      } else {
        const n_int = Number.parseInt(n, 10);
        new_n = '' + (n_int + delta);
      }

      state.blocks[k].id = type + ' ' + new_n;
    }
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

  handleMouseWheel(e) {
    const delta = 1 + -e.deltaY / 1000;
    const mouse_x = e.clientX;
    const mouse_y = e.clientY;
    this.setState(state => {
      state.scale *= delta;
      state.offset.x -= (delta - 1) * (mouse_x - state.offset.x);
      state.offset.y -= (delta - 1) * (mouse_y - state.offset.y);
      return state;
    });
  }

  handleAddBlockButtonClick() {
    const name = this.state.new_element.type;
    const inputs_number = this.state.new_element.inputs_number;
    const outputs_number = this.state.new_element.outputs_number;
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

  wireHere(block_const_id, type, index) {
    const connectedTo = (const_id, t, i) => w => t == 'output' && const_id == w.from_block_const_id && i == w.from_output_id || t == 'input' && const_id == w.to_block_const_id && i == w.to_input_id;

    return Object.values(this.state.wires).some(connectedTo(block_const_id, type, index));
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
      onChange: e => this.setState({
        'name': e.target.value
      })
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
      id: tests_number + ' ' + max_tests_number
    }, "Coverage:", /*#__PURE__*/React.createElement("br", null), tests_number, "/", max_tests_number, " (", Math.floor(tests_number / max_tests_number * 100), "%)") : null, /*#__PURE__*/React.createElement("button", {
      className: "editTestsButton animated animated-lightblue unselectable",
      onClick: () => this.setState({
        'tests_editor_opened': true
      })
    }, "edit tests")), /*#__PURE__*/React.createElement("div", {
      className: "newBlockConfiguration"
    }, /*#__PURE__*/React.createElement("div", {
      className: "block blockToAdd",
      onMouseDown: e => this.handleMouseDown(e, this.state.new_element.type, this.state.new_element)
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "name",
      value: this.state.new_element.type,
      onChange: e => this.setState(state => {
        state.new_element.type = e.target.value;
        return state;
      }),
      onMouseDown: e => e.stopPropagation()
    }))), /*#__PURE__*/React.createElement("div", {
      className: "inputsOutputsNumber"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputsNumber"
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "1",
      ref: this.inputs_number_ref,
      value: this.state.new_element.inputs.length,
      onChange: e => this.setState(state => {
        const new_length = numberOr(e.target.value, 1);
        state.new_element.inputs = filledArray(new_length, '');
        state.new_element.inputs_groups = cutToSum(state.new_element.inputs_groups, new_length);
        return state;
      })
    })), /*#__PURE__*/React.createElement("div", {
      className: "outputsNumber"
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "1",
      ref: this.outputs_number_ref,
      value: this.state.new_element.outputs.length,
      onChange: e => this.setState(state => {
        const new_length = numberOr(e.target.value, 1);
        state.new_element.outputs = filledArray(new_length, '');
        state.new_element.outputs_groups = cutToSum(state.new_element.outputs_groups, new_length);
        return state;
      })
    }))), /*#__PURE__*/React.createElement("div", {
      className: "inputsOutputsGroups"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inputsGroups"
    }, this.state.new_element.inputs_groups.map((g, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "inputGroup unselectable",
      onMouseDown: e => {
        let f = undefined;
        if (e.button == 0) f = joinWithNext;else if (e.button == 2) f = unjoinToNext;else return state;
        this.setState(state => {
          state.new_element.inputs_groups = f(state.new_element.inputs_groups, i);
          return state;
        });
      },
      onContextMenu: e => e.preventDefault()
    }, g))), /*#__PURE__*/React.createElement("div", {
      className: "outputsGroups"
    }, this.state.new_element.outputs_groups.map((g, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "outputGroup unselectable",
      onMouseDown: e => {
        let f = undefined;
        if (e.button == 0) f = joinWithNext;else if (e.button == 2) f = unjoinToNext;else return state;
        this.setState(state => {
          state.new_element.outputs_groups = f(state.new_element.outputs_groups, i);
          return state;
        });
      },
      onContextMenu: e => e.preventDefault()
    }, g)))), /*#__PURE__*/React.createElement("button", {
      className: "addBlockButton animated animated-green unselectable",
      onClick: this.handleAddBlockButtonClick
    }, "+")), /*#__PURE__*/React.createElement("div", {
      className: "blocks"
    }, Object.entries(this.state.custom_elements).map((element_type_and_element, i) => /*#__PURE__*/React.createElement("div", {
      key: element_type_and_element[0],
      className: "block",
      onMouseDown: e => this.handleMouseDown(e, element_type_and_element[0], element_type_and_element[1])
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, element_type_and_element[0])))), Object.entries(default_elements).map((element_type_and_element, i) => /*#__PURE__*/React.createElement("div", {
      key: element_type_and_element[0],
      className: "block",
      onMouseDown: e => this.handleMouseDown(e, element_type_and_element[0], element_type_and_element[1])
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
      key: block_id_and_block[1].type == 'INPUT' || block_id_and_block[1].type == 'OUTPUT' ? block_id_and_block[0] + ' ' + block_id_and_block[1].id : block_id_and_block[0],
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
      inputs_groups: block_id_and_block[1].inputs_groups,
      outputs_groups: block_id_and_block[1].outputs_groups,
      removeBlock: () => this.removeBlock(block_id_and_block[0]),
      startAddingWire: this.startAddingWire,
      handleMouseUpOnInputOutput: this.handleMouseUpOnInputOutput,
      removeWires: this.removeWires,
      onMount: this.onBlockMounted,
      onStateChange: this.onBlockStateChange,
      onStopInitialDragging: this.onBlockStopInitialDragging,
      updateInputsOutputsNames: this.updateInputsOutputsNames.bind(this),
      wireHere: this.wireHere.bind(this),
      type_info: this.getTypeInfo(block_id_and_block[1].type)
    })), Object.values(this.state.wires).map(wire => /*#__PURE__*/React.createElement(Wire, {
      key: wire.from_point.x + ' ' + wire.from_point.y + ' ' + wire.to_point.x + ' ' + wire.to_point.y,
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