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

class BlocksArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'name': 'test',
      'blocks': {},
      'wires': {}
    };
    this.onBlockStateChange = this.onBlockStateChange.bind(this);
    this.onBlockMounted = this.onBlockMounted.bind(this);
    this.saveToJson = this.saveToJson.bind(this);
    this.building_queue = false;
  }

  componentDidMount() {
    this.add({
      'blocks': [{
        'id': 1,
        'name': 'INPUT'
      }, {
        'id': 2,
        'name': 'INPUT'
      }, {
        'id': 3,
        'name': 'OUTPUT'
      }, {
        'id': 4,
        'name': 'AND'
      }],
      'wires': [{
        'from_block_id': 1,
        'to_block_id': 4,
        'from_output_id': 0,
        'to_input_id': 0
      }, {
        'from_block_id': 2,
        'to_block_id': 4,
        'from_output_id': 0,
        'to_input_id': 1
      }, {
        'from_block_id': 4,
        'to_block_id': 3,
        'from_output_id': 0,
        'to_input_id': 0
      }]
    });
  }

  add(data) {
    this.setState(state => {
      for (const b of data.blocks) {
        const id = b.id;
        const id_string = String(id);
        if (state.blocks[id_string] != undefined) return state;
        state.blocks[id_string] = {
          'name': b.name
        };
      }

      return state;
    }, () => {
      this.render();
      this.setState(state => {
        for (const w of data.wires) {
          const new_id = Object.keys(state.wires).length == 0 ? 0 : String(Math.max(...Object.keys(state.wires)) + 1);
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

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "blocksArea"
    }, /*#__PURE__*/React.createElement("button", {
      className: "saveButton",
      onClick: this.saveToJson
    }, "save"), /*#__PURE__*/React.createElement("div", {
      className: "sidePanel"
    }, Object.entries(defaultElements).map((element_type_and_element, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "block"
    }, /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "name unselectable"
    }, element_type_and_element[0]))))), Object.entries(this.state.blocks).map(block_id_and_block => /*#__PURE__*/React.createElement(Block, {
      key: block_id_and_block[0],
      id: block_id_and_block[0],
      name: block_id_and_block[1].name,
      onMount: this.onBlockMounted,
      onStateChange: this.onBlockStateChange
    })), Object.values(this.state.wires).filter(w => w.from_point).map(wire => /*#__PURE__*/React.createElement(Wire, {
      key: wire.id,
      from_point: wire.from_point,
      to_point: wire.to_point
    })));
  }

}