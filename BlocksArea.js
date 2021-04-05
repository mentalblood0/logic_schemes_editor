'use strict';

const defaultElements = {
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

function getUniqueId(some_dict) {
  return Object.keys(some_dict).length == 0 ? 0 : String(Math.max(...Object.keys(some_dict)) + 1);
}

class BlocksArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'name': 'test',
      'blocks': {},
      'wires': {},
      'adding_block': false,
      'adding_wire': false,
      'adding_wire_info': undefined
    };
    this.onBlockStateChange = this.onBlockStateChange.bind(this);
    this.onBlockMounted = this.onBlockMounted.bind(this);
    this.save = this.save.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.startAddingWire = this.startAddingWire.bind(this);
    this.handleMouseUpOnInputOutput = this.handleMouseUpOnInputOutput.bind(this);
    this.remove_wires = this.remove_wires.bind(this);
    this._ref = React.createRef();
  }

  componentDidMount() {
    this.state.event_listeners = [[this._ref.current, 'contextmenu', e => e.preventDefault()], [this._ref.current, 'mousemove', this.handleMouseMove], [this._ref.current, 'mouseup', this.handleMouseUp], //fucking drag and drop
    [this._ref.current, 'drag', e => e.preventDefault()], [this._ref.current, 'dragstart', e => e.preventDefault()], [this._ref.current, 'dragend', e => e.preventDefault()], [this._ref.current, 'dragover', e => e.preventDefault()], [this._ref.current, 'dragenter', e => e.preventDefault()], [this._ref.current, 'dragleave', e => e.preventDefault()], [this._ref.current, 'drop', e => e.preventDefault()]];

    for (const e_l of this.state.event_listeners) e_l[0].addEventListener(e_l[1], e_l[2]);
  }

  componentWillUnmount() {
    for (const e_l of this.state.event_listeners) e_l[0].removeEventListener(e_l[1], e_l[2]);
  }

  add(data) {
    this.setState(state => {
      if (!('blocks' in data)) return state;

      for (const b of data.blocks) {
        const id = getUniqueId(state.blocks);
        const id_string = String(id);
        if (state.blocks[id_string] != undefined) return state;
        state.blocks[id_string] = {
          'name': b.name,
          'x': b.x,
          'y': b.y
        };

        if (b.dragging) {
          state.blocks[id_string].dragging = true;
        }
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
            'from_block_id': String(w.from_block_id),
            'to_block_id': String(w.to_block_id),
            'from_output_id': w.from_output_id,
            'to_input_id': w.to_input_id
          };
          this.updateWireCoordinates(state, new_id);
        }

        return state;
      });
    });
  }

  updateWireCoordinates(state, wire_id) {
    const wire = state.wires[wire_id];
    const from_block = state.blocks[wire.from_block_id];
    const to_block = state.blocks[wire.to_block_id];
    wire.from_point = from_block.output_connectors_coordinates[wire.from_output_id];
    wire.to_point = to_block.input_connectors_coordinates[wire.to_input_id];
    state.wires[wire_id] = wire;
  }

  onBlockMounted(detail) {
    this.setState(state => {
      state.blocks[detail.id] = detail;
      return state;
    });
  }

  onBlockStateChange(detail) {
    this.setState(state => {
      state.blocks[detail.id] = detail;
      Object.values(state.wires).forEach(w => {
        if (detail.id == w.from_block_id || detail.id == w.to_block_id) this.updateWireCoordinates(state, w.id);
      });
      return state;
    });
  }

  getSaveData() {
    const blocks = this.state.blocks;
    const result = [{
      'name': this.state.name,
      'wires': Object.values(this.state.wires).map(w => ({
        'from': blocks[w.from_block_id].name + '_' + w.from_block_id + '[' + w.from_output_id + ']',
        'to': blocks[w.to_block_id].name + '_' + w.to_block_id + '[' + w.to_input_id + ']'
      }))
    }];
    return result;
  }

  save() {
    const save_data = this.getSaveData();
    const save_data_text = JSON.stringify(save_data, null, '\t');
    const today = new Date();
    const current_date = today.getFullYear().toString() + '-' + (today.getMonth() + 1).toString() + '-' + today.getDate().toString();
    const current_time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    downloadFile('logic-scheme' + '-' + this.state.name + '-' + current_date + '-' + current_time + '.json', save_data_text);
  }

  handleMouseDown(e, element_type) {
    this.add({
      'blocks': [{
        'name': element_type,
        'x': e.clientX,
        'y': e.clientY,
        'dragging': true
      }]
    });
  }

  handleMouseMove(e) {
    if (this.state.adding_wire_info) {
      const info = this.state.adding_wire_info;
      if (info.from_block_id == undefined) this.setState(state => {
        state.adding_wire_info.from_point = {
          'x': e.clientX,
          'y': e.clientY
        };
        return state;
      });else this.setState(state => {
        state.adding_wire_info.to_point = {
          'x': e.clientX,
          'y': e.clientY
        };
        return state;
      });
    }
  }

  handleMouseUp() {
    this.setState({
      'adding_wire': false
    });
  }

  handleMouseUpOnInputOutput(input_output_info) {
    const new_wire_info = Object.assign({}, this.state.adding_wire_info);
    this.setState({
      'adding_wire_info': undefined
    });

    for (const key in input_output_info) new_wire_info[key] = input_output_info[key];

    if (!('to_block_id' in new_wire_info) || !('from_block_id' in new_wire_info)) return;
    console.log('new_wire_info', new_wire_info);
    delete new_wire_info['from_point'];
    delete new_wire_info['to_point'];
    this.add({
      'wires': [new_wire_info]
    });
  }

  deleteBlock(id) {
    this.setState(state => {
      delete state.blocks[id];
      state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k, v]) => v.from_block_id != id && v.to_block_id != id));
      return state;
    });
  }

  startAddingWire(wire_info) {
    this.setState({
      'adding_wire': true,
      'adding_wire_info': wire_info
    });
  }

  remove_wires(mask) {
    console.log('remove_wires', mask);
    this.setState(state => {
      state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k, v]) => {
        console.log('[', k, v, ']');

        for (const mask_key in mask) {
          console.log('mask_key', mask_key, ':', mask[mask_key], v[mask_key]);

          if (mask[mask_key] != v[mask_key]) {
            console.log('true');
            return true;
          }
        }

        console.log('false');
        return false;
      }));
      return state;
    });
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "blocksArea",
      ref: this._ref
    }, /*#__PURE__*/React.createElement("div", {
      className: "sidePanel"
    }, /*#__PURE__*/React.createElement("button", {
      className: "saveButton unselectable",
      onClick: this.save
    }, "save"), Object.entries(defaultElements).map((element_type_and_element, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "block",
      onMouseDown: e => this.handleMouseDown(e, element_type_and_element[0])
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, element_type_and_element[0]))))), Object.entries(this.state.blocks).map(block_id_and_block => /*#__PURE__*/React.createElement(Block, {
      key: block_id_and_block[0],
      id: block_id_and_block[0],
      name: block_id_and_block[1].name,
      x: block_id_and_block[1].x,
      y: block_id_and_block[1].y,
      dragging: block_id_and_block[1].dragging,
      function_to_delete_self: () => this.deleteBlock(block_id_and_block[0]),
      start_adding_wire_function: this.startAddingWire,
      handle_mouse_up_on_input_output_function: this.handleMouseUpOnInputOutput,
      remove_wires_function: this.remove_wires,
      onMount: this.onBlockMounted,
      onStateChange: this.onBlockStateChange
    })), Object.values(this.state.wires).filter(w => w.from_point).map(wire => /*#__PURE__*/React.createElement(Wire, {
      key: wire.id,
      from_point: wire.from_point,
      to_point: wire.to_point
    })), this.state.adding_wire ? /*#__PURE__*/React.createElement(Wire, {
      key: -1,
      from_point: this.state.adding_wire_info.from_point,
      to_point: this.state.adding_wire_info.to_point
    }) : null);
  }

}