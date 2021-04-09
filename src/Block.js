'use strict';

function getElementCenter(e) {
	const rect = e.getBoundingClientRect();
	return {
		'x': rect.x + rect.width / 2,
		'y': rect.y + rect.height / 2
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
			'offset': props.offset,
			'x': props.x,
			'y': props.y,
			'scale': props.scale,
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
		}

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
		if (state == undefined)
			state = this.state;
		return {
			'type': state.type,
			'id': state.id,
			'const_id': state.const_id,
			'x': state.x,
			'y': state.y,
			'inputs': state.inputs,
			'outputs': state.outputs,
			'input_connectors_coordinates':
				this.input_connectors_refs.map(r => getElementCenter(r.current)),
			'output_connectors_coordinates':
				this.output_connectors_refs.map(r => getElementCenter(r.current))
		};
	}

	componentDidMount() {
		const content_element = this._ref.current.children[0];
		const name_element = this._ref.current.children[0].children[1];
		const ifDraggableByThis = (e, f) => (
			(e.target === content_element) ||
			(e.target === name_element)
		) ? f(e) : null;
		this.state.event_listeners = [
			[this._ref.current, 'contextmenu', e => e.preventDefault()]
		];
		for (const e_l of this.state.event_listeners)
			e_l[0].addEventListener(e_l[1], e_l[2]);

		if (this.state.dragging) {
			const center = getElementCenter(this._ref.current);
			this.handleMouseDown({
				'clientX': center.x,
				'clientY': center.y
			}, () => {
				const info = this.getInfo()
				this.state.onMount(info);
				this.state.onStateChange(info);
			});
		} else {
			const info = this.getInfo()
			this.state.onMount(info);
			this.state.onStateChange(info);
		}
	}

	componentWillUnmount() {
		for (const e_l of this.state.event_listeners)
			e_l[0].removeEventListener(e_l[1], e_l[2]);
	}

	handleMouseDown(e, function_after) {
		console.log('block handleMouseDown');
		if (e.button === 2) {
			this.state.function_to_delete_self();
			return;
		}
		this.setState({
			'dragging': true,
			'gripX': e.clientX / this.state.scale - this.state.x,
			'gripY': e.clientY / this.state.scale - this.state.y
		}, function_after);
	}

	handleMouseUp(e) {
		console.log('block handleMouseUp');
		if (this.state.initital_dragging)
			this.state.onStopInitialDragging(this.state.const_id);
		if (this.state.dragging)
			this.setState({
				'dragging': false,
				'initital_dragging': false
			});
	}

	handleMouseMove(e) {
		// console.log('block handleMouseMove');
		if (this.state.dragging === true) {
			const newState = Object.assign(this.state, {
				'x': e.clientX / this.state.scale - this.state.gripX,
				'y': e.clientY / this.state.scale - this.state.gripY
			});
			this.setState(state => newState);
			this.state.onStateChange(this.getInfo(newState));
		}
	}

	handleMouseLeave(e) {
		this.handleMouseMove(e);
	}

	handleMouseDownOnInputOutput(type, i, e) {
		if (type == 'input') {
			if (e.button == 0)
				this.state.start_adding_wire_function({
					'to_block_const_id': this.state.const_id,
					'to_input_id': i,
					'from_point': {
						'x': e.clientX,
						'y': e.clientY
					},
					'to_point': getElementCenter(this.input_connectors_refs[i].current)
				})
			else if (e.button == 2)
				this.state.remove_wires_function({
					'to_block_const_id': this.state.const_id,
					'to_input_id': i
				})
		}
		else if (type == 'output') {
			if (e.button == 0)
				this.state.start_adding_wire_function({
					'from_block_const_id': this.state.const_id,
					'from_output_id': i,
					'from_point': getElementCenter(this.output_connectors_refs[i].current),
					'to_point': {
						'x': e.clientX,
						'y': e.clientY
					}
				})
			else if (e.button == 2)
				this.state.remove_wires_function({
					'from_block_const_id': this.state.const_id,
					'from_output_id': i
				})
		}
	}

	render() {
		const x = this.state.x;
		const y = this.state.y;
		const offset = this.state.offset
		const scale = this.state.scale;
		const type = this.state.type;
		const name = this.state.id;
		const visible_name = ((type == 'INPUT') || (type == 'OUTPUT')) ? name : type;
		const max_connectors = Math.max(this.state.inputs.length, this.state.outputs.length);
		return (
			<div className="blockWrapper" key={x + '_' + y + '_' + offset.x + '_' + offset.y}
				style={{
					'transform': 'scale(' + scale + ')',
					'left': x * scale + offset.x,
					'top': y * scale + offset.y,
					'zIndex': this.state.dragging ? 100 : 0
				}}>
				<div ref={this._ref} className="block" key={name}
					onMouseUp={this.handleMouseUp}
					onMouseMove={this.handleMouseMove}
					style={{
					 	'left': 0,
					 	'top': 0
					}}>
					<div className="content"
						onMouseDown={e => {
							if (
								e.target.classList.contains('content') ||
								e.target.classList.contains('name')
							)
								this.handleMouseDown(e)
						}}>
						<div className="inputs">
						{
							this.state.inputs.map(
								(input, i) =>
								<div ref={this.input_connectors_refs[i]} key={i} className="input"
									onMouseDown={e => this.handleMouseDownOnInputOutput('input', i, e)}
									onMouseUp={e => this.state.handle_mouse_up_on_input_output_function({
										'to_block_const_id': this.state.const_id,
										'to_input_id': i
								})}>
								</div>
							)
						}
						</div>
						<div className="name unselectable">{visible_name}</div>
						<div className="outputs">
						{
							this.state.outputs.map(
								(output, i) =>
								<div ref={this.output_connectors_refs[i]} key={i} className="output"
									onMouseDown={e => this.handleMouseDownOnInputOutput('output', i, e)}
									onMouseUp={e => this.state.handle_mouse_up_on_input_output_function({
										'from_block_const_id': this.state.const_id,
										'from_output_id': i
									})}>
								</div>
							)
						}
						</div>
					</div>
				</div>
			</div>
		);
	}
}