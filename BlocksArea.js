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
      'adding_block': false
    };
    this.onBlockStateChange = this.onBlockStateChange.bind(this);
    this.onBlockMounted = this.onBlockMounted.bind(this);
    this.saveToJson = this.saveToJson.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.startAddingWire = this.startAddingWire.bind(this);
    this._ref = React.createRef();
  }

  componentDidMount() {
    this.add({
      'blocks': [{
        'name': 'INPUT',
        'x': 250,
        'y': 150
      }, {
        'name': 'INPUT',
        'x': 250,
        'y': 150
      }, {
        'name': 'OUTPUT',
        'x': 250,
        'y': 150
      }, {
        'name': 'AND',
        'x': 250,
        'y': 150
      }],
      'wires': [{
        'from_block_id': 0,
        'to_block_id': 3,
        'from_output_id': 0,
        'to_input_id': 0
      }, {
        'from_block_id': 1,
        'to_block_id': 3,
        'from_output_id': 0,
        'to_input_id': 1
      }, {
        'from_block_id': 3,
        'to_block_id': 2,
        'from_output_id': 0,
        'to_input_id': 0
      }]
    });
    this.state.event_listeners = [[this._ref.current, 'contextmenu', e => e.preventDefault()]];

    for (const e_l of this.state.event_listeners) e_l[0].addEventListener(e_l[1], e_l[2]);
  }

  componentWillUnmount() {
    for (const e_l of this.state.event_listeners) e_l[0].removeEventListener(e_l[1], e_l[2]);
  }

  add(data, function_after_adding) {
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
      }, function_after_adding);
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

  saveToJson() {
    const blocks = this.state.blocks;
    const data_for_save = {
      'name': this.state.name,
      'wires': Object.values(this.state.wires).map(w => ({
        'from': blocks[w.from_block_id].name + '_' + w.from_block_id + '[' + w.from_output_id + ']',
        'to': blocks[w.to_block_id].name + '_' + w.to_block_id + '[' + w.to_input_id + ']'
      }))
    };
    console.log(data_for_save);
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
    if (this.state.adding_block) {
      this.state.adding_block_ref;
    }
  }

  deleteBlock(id) {
    this.setState(state => {
      delete state.blocks[id];
      state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k, v]) => v.from_block_id != id && v.to_block_id != id));
      return state;
    });
  }

  startAddingWire(wire_info) {
    console.log('startAddingWire', wire_info);
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "blocksArea",
      ref: this._ref
    }, /*#__PURE__*/React.createElement("div", {
      className: "sidePanel"
    }, /*#__PURE__*/React.createElement("button", {
      className: "saveButton unselectable",
      onClick: this.saveToJson
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
      startAddingWire: this.startAddingWire,
      onMount: this.onBlockMounted,
      onStateChange: this.onBlockStateChange
    })), Object.values(this.state.wires).filter(w => w.from_point).map(wire => /*#__PURE__*/React.createElement(Wire, {
      key: wire.id,
      from_point: wire.from_point,
      to_point: wire.to_point
    })));
  }

}