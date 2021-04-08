'use strict'

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
}
const custom_elements = {}
function getTypeInfo(type_name) {
	if (type_name in default_elements)
		return default_elements[type_name];
	else if (type_name in custom_elements)
		return custom_elements[type_name];
}

function getUniqueId(some_dict) {
	return (Object.keys(some_dict).length == 0) ? 0 : (Math.max(...Object.keys(some_dict)) + 1);
}

class BlocksArea extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			'name': 'test',
			'new_element_type': 'new',
			'new_element_inputs_number': 1,
			'new_element_outputs_number': 1,
			'inputs_number': 0,
			'outputs_number': 0,
			'blocks': {},
			'wires': {},
			'adding_block': false,
			'adding_wire': false,
			'adding_wire_info': undefined,
			'scale': 1,
			'offset_x': 0,
			'offset_y': 0,
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
		this.remove_wires = this.remove_wires.bind(this);

		this._ref = React.createRef();
	}

	componentDidMount() {
		this.state.event_listeners = [
			[this._ref.current, 'contextmenu', e => e.preventDefault()],
			[this._ref.current, 'mousemove', this.handleMouseMove],
			[this._ref.current, 'mouseup', this.handleMouseUp],
			//fucking drag and drop
			[this._ref.current, 'drag', e => e.preventDefault()],
			[this._ref.current, 'dragstart', e => e.preventDefault()],
			[this._ref.current, 'dragend', e => e.preventDefault()],
			[this._ref.current, 'dragover', e => e.preventDefault()],
			[this._ref.current, 'dragenter', e => e.preventDefault()],
			[this._ref.current, 'dragleave', e => e.preventDefault()],
			[this._ref.current, 'drop', e => e.preventDefault()]
		];
		for (const e_l of this.state.event_listeners)
			e_l[0].addEventListener(e_l[1], e_l[2]);
	}

	componentWillUnmount() {
		for (const e_l of this.state.event_listeners)
			e_l[0].removeEventListener(e_l[1], e_l[2]);
	}

	add(data) {
		this.setState(state => {
			if (!('blocks' in data))
				return state;
			for (const b of data.blocks) {
				const dict_with_blocks_with_such_name = Object.fromEntries(
					Object.entries(this.state.blocks).filter(([k,v]) => 
					v.type == b.type
				));
				const current_const_ids = Object.values(state.blocks).map(v => v.const_id);
				const const_id = (current_const_ids.length == 0) ? 1 : (Math.max(...current_const_ids) + 1);
				const id = b.type + '_' + (Object.keys(dict_with_blocks_with_such_name).length + 1);
				if (state.blocks[const_id] != undefined)
					return state;
				const block = {
					'id': id,
					'type': b.type,
					'x': b.x,
					'y': b.y,
					'inputs': b.inputs,
					'outputs': b.outputs
				};
				if (b.dragging)
					block['dragging'] = true;
				state.blocks[const_id] = block;
				if (b.type == 'INPUT')
					state.inputs_number += 1;
				else if (b.type == 'OUTPUT')
					state.outputs_number += 1;
			}
			return state;
		}, () => {
			if (!('wires' in data))
				return;
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
					this.updateWireCoordinates(state, new_id);
				}
				return state;
			});
		});
	}

	updateWireCoordinates(state, wire_id) {
		const wire = state.wires[wire_id];
		const from_block = state.blocks[wire.from_block_const_id];
		const to_block = state.blocks[wire.to_block_const_id];
		wire.from_point =
			from_block.output_connectors_coordinates[wire.from_output_id];
		wire.to_point =
			to_block.input_connectors_coordinates[wire.to_input_id];
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
			state.blocks[detail.const_id] = Object.assign(detail);
			Object.values(state.wires).forEach(w => {
				if ((detail.const_id == w.from_block_const_id) || (detail.const_id == w.to_block_const_id))
					this.updateWireCoordinates(state, w.id);
			});
			return state;
		});
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
			'new_element_type': this.state.new_element_type,
			'new_element_inputs_number': this.state.new_element_inputs_number,
			'new_element_outputs_number': this.state.new_element_outputs_number,
			'inputs_number': this.state.inputs_number,
			'outputs_number': this.state.outputs_number,
			'blocks': this.state.blocks,
			'wires': this.state.wires,
			'tests': this.state.tests
		};
	}

	getSaveName() {
		const today = new Date();
		const current_date = today.getFullYear().toString()
			+ '-' + (today.getMonth() + 1).toString()
			+ '-' + today.getDate().toString();
		const current_time = today.getHours()
			+ ":" + today.getMinutes()
			+ ":" + today.getSeconds();
		return 'logic-scheme'
			+ '-' + this.state.name
			+ '-' + current_date
			+ '-' + current_time
			+ '.json';
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
		const data = {
			[this.state.name]: {
				'wires': Object.values(this.state.wires).map(w => ({
					'from': blocks[w.from_block_const_id].id + '[' + (w.from_output_id + 1) + ']',
					'to': blocks[w.to_block_const_id].id + '[' + (w.to_input_id + 1) + ']'
				})),
			}
		}
		if (tests.length > 0)
			data[this.state.name]['tests'] = tests.map(t => ({
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
		if (e.button != 0)
			return;
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

	handleMouseMove(e) {
		if (this.state.adding_wire_info) {
			const info = this.state.adding_wire_info;
			if (info.from_block_const_id == undefined)
				this.setState(state => {
					state.adding_wire_info.from_point = {
						'x': e.clientX,
						'y': e.clientY
					}
					return state;
				});
			else
				this.setState(state => {
					state.adding_wire_info.to_point = {
						'x': e.clientX,
						'y': e.clientY
					}
					return state;
				});
		}
	}

	handleMouseUp() {
		this.setState({'adding_wire': false});
	}

	handleMouseUpOnInputOutput(input_output_info) {
		const new_wire_info = Object.assign({}, this.state.adding_wire_info);
		this.setState({'adding_wire_info': undefined});
		for (const key in input_output_info)
			new_wire_info[key] = input_output_info[key];
		if (!('to_block_const_id' in new_wire_info) || !('from_block_const_id' in new_wire_info))
			return;
		delete new_wire_info['from_point'];
		delete new_wire_info['to_point'];
		this.add({'wires': [new_wire_info]});
	}

	removeBlock(const_id) {
		this.setState(state => {
			if (!state.blocks[const_id])
				return state;
			const type = state.blocks[const_id].type;
			if (type == 'INPUT')
				state.inputs_number -= 1;
			else if (type == 'OUTPUT')
				state.outputs_number -= 1;
			const id = state.blocks[const_id].id;
			const number = Number.parseInt(id.split('_').pop(), 10);
			delete state.blocks[const_id];
			state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k,v]) => 
				(
					(v.from_block_const_id != const_id) &&
					(v.to_block_const_id != const_id)
				)
			));
			for (const k in state.blocks)
				if (state.blocks[k].type == type)
					if (state.blocks[k].id > id) {
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

	remove_wires(mask) {
		this.setState(state => {
			state.wires = Object.fromEntries(Object.entries(state.wires).filter(([k,v]) => {
				for (const mask_key in mask)
					if (mask[mask_key] != v[mask_key])
						return true;
				return false;
			}));
			return state;
		});
	}

	handleSchemeNameInputChange(e) {
		this.setState({'name': e.target.value});
	}

	handleNewElementNameInputChange(e) {
		this.setState({'new_element_type': e.target.value});
	}

	handleNewElementInputsNumberInputChange(e) {
		this.setState({'new_element_inputs_number': e.target.value});
	}

	handleNewElementOutputsNumberInputChange(e) {
		this.setState({'new_element_outputs_number': e.target.value});
	}

	handleMouseWheel(e) {
		const delta = e.deltaY;
		this.setState(state => {
			state.scale += delta / 1000;
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
		custom_elements[name] = new_element_info;
		this.forceUpdate();
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
		const inputs_number = this.state.inputs_number;
		const outputs_number = this.state.outputs_number;
		const tests_number = this.state.tests.length;
		const max_tests_number = 2 ** inputs_number;
		let inputs = undefined;
		let outputs = undefined;
		if (this.state.tests_editor_opened) {
			inputs = Object.values(this.state.blocks).filter(b => b.type == 'INPUT').map(b => b.id);
			outputs = Object.values(this.state.blocks).filter(b => b.type == 'OUTPUT').map(b => b.id);
		}

		return <div className="blocksArea" ref={this._ref}>
			<div className="sidePanel">
				<div className="controls">
					<input type="text" className="schemeName unselectable"
						value={this.state.name} onChange={this.handleSchemeNameInputChange}></input>
					<button className="exportButton animated animated-lightblue unselectable"
						onClick={this.export}>export</button>
					<button className="saveButton animated animated-green unselectable"
						onClick={this.save}>save</button>
					<button className="loadButton animated animated-blue unselectable"
						onClick={this.load}>load</button>
					<button className="clearButton animated animated-red unselectable"
						onClick={this.clear}>clear</button>
				</div>
				<div className="tests">
				{
					((inputs_number > 0) && (outputs_number > 0)) ?
					<div className="coverageInfo unselectable" id={tests_number + '_' + max_tests_number}>
						Coverage:<br></br>{tests_number}/{max_tests_number} ({Math.floor(tests_number / max_tests_number * 100)}%)
					</div>
					: null
				}
					<button className="editTestsButton animated animated-lightblue unselectable"
						onClick={() => this.setState({'tests_editor_opened': true})}>edit tests</button>
				</div>
				<div className="blocks">
					<div className="block blockToAdd"
						onMouseDown={e => this.handleMouseDown(
							e,
							this.state.new_element_type,
							this.state.new_element_inputs_number,
							this.state.new_element_outputs_number
						)}>
						<div className="content">
							<input type="text" className="name"
								value={this.state.new_element_type}
								onChange={this.handleNewElementNameInputChange}
								onMouseDown={e => {e.stopPropagation()}}></input>
						</div>
					</div>
					<div className="inputsOutputsNumber">
						<div className="inputsNumber">
							<input type="number" min="1"
								value={this.state.new_element_inputs_number}
								onChange={this.handleNewElementInputsNumberInputChange}></input>
						</div>
						<div className="outputsNumber">
							<input type="number" min="1"
								value={this.state.new_element_outputs_number}
								onChange={this.handleNewElementOutputsNumberInputChange}></input>
						</div>
					</div>
					<button className="addBlockButton animated animated-green unselectable" onClick={this.handleAddBlockButtonClick}>+</button>
				{
					Object.entries(custom_elements).map(
						(element_type_and_element, i) =>
						<div key={element_type_and_element[0]} className="block"
							onMouseDown={e => this.handleMouseDown(e, element_type_and_element[0])}>
							<div className="content">
								<div className="name unselectable">{element_type_and_element[0]}</div>
							</div>
						</div>
					)
				}
				{
					Object.entries(default_elements).map(
						(element_type_and_element, i) =>
						<div key={element_type_and_element[0]} className="block"
							onMouseDown={e => this.handleMouseDown(e, element_type_and_element[0])}>
							<div className="content">
								<div className="name unselectable">{element_type_and_element[0]}</div>
							</div>
						</div>
					)
				}
				</div>
			</div>
		{
			this.state.tests_editor_opened ?
			<ModalWindow
				close_function={() => this.setState({'tests_editor_opened': false})}>
				<TestsEditor
					inputs={inputs}
					outputs={outputs}
					tests={this.state.tests.map(
						t => t.slice(0, inputs.length).concat(t.slice(-outputs.length))
					)}
					onUnmount={tests => this.setState({'tests': tests})}></TestsEditor>
			</ModalWindow>
			: null
		}
			<div className="schemeArea" onWheel={this.handleMouseWheel}>
			{
				Object.entries(this.state.blocks).map(
					(block_id_and_block, i) =>
					<Block key={block_id_and_block[0] + '_' + block_id_and_block[1].id + '_' + scale}
						const_id={block_id_and_block[0]}
						id={block_id_and_block[1].id}
						type={block_id_and_block[1].type}
						x={block_id_and_block[1].x}
						y={block_id_and_block[1].y}
						scale={scale}
						dragging={block_id_and_block[1].dragging}
						inputs={block_id_and_block[1].inputs}
						outputs={block_id_and_block[1].outputs}
						function_to_delete_self={() => this.removeBlock(block_id_and_block[0])}
						start_adding_wire_function={this.startAddingWire}
						handle_mouse_up_on_input_output_function={this.handleMouseUpOnInputOutput}
						remove_wires_function={this.remove_wires}
						onMount={this.onBlockMounted}
						onStateChange={this.onBlockStateChange}
						onStopInitialDragging={this.onBlockStopInitialDragging}></Block>
				)
			}
			{
				Object.values(this.state.wires).filter(w => w.from_point).map(
					wire =>
					<Wire key={wire.id} from_point={wire.from_point} to_point={wire.to_point}
						scale={scale}></Wire>
				)
			}
			{
				this.state.adding_wire ?
				<Wire key={-1}
					from_point={this.state.adding_wire_info.from_point}
					to_point={this.state.adding_wire_info.to_point}
					scale={scale}></Wire>
				: null
			}
			</div>
		</div>;
	}
}