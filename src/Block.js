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
		super(props);

		this.state = {
			'id': props.id,
			'name': props.name,
			'x': props.x,
			'y': props.y,
			'dragging': false,
			'initital_dragging': props.dragging || false,
			'gripX': undefined,
			'gripY': undefined,
			'inputs': defaultElements[props.name].inputs,
			'outputs': defaultElements[props.name].outputs,
			'onStateChange': props.onStateChange,
			'onMount': props.onMount,
			'function_to_delete_self': props.function_to_delete_self,
			'startAddingWire': props.startAddingWire
		}

		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);

		this._ref = React.createRef();
		this.input_connectors_refs = Array(Object.keys(this.state.inputs).length).fill(undefined).map(e => React.createRef());
		this.output_connectors_refs = Array(this.state.outputs.length).fill(undefined).map(e => React.createRef());
	}

	getInfo(state) {
		if (state == undefined)
			state = this.state;
		return {
			'id': state.id,
			'name': state.name,
			'width': state.width,
			'height': state.height,
			'x': state.x,
			'y': state.y,
			'input_connectors_coordinates':
				this.input_connectors_refs.map(r => getElementCenter(r.current)),
			'output_connectors_coordinates':
				this.output_connectors_refs.map(r => getElementCenter(r.current))
		};
	}

	componentDidMount() {
		this.state.width = this._ref.current.offsetWidth;
		this.state.height = this._ref.current.offsetHeight;
		this.state.onMount(this.getInfo());

		const content_element = this._ref.current.children[0];
		const name_element = this._ref.current.children[0].children[1];
		const ifDraggableByThis = (e, f) => (
			(e.target === content_element) ||
			(e.target === name_element)
		) ? f(e) : null;
		this.state.event_listeners = [
			[window, 'mousedown', e => ifDraggableByThis(e, this.handleMouseDown)],
			[this._ref.current, 'mouseup', this.handleMouseUp],
			[window, 'mousemove', this.handleMouseMove],
			[this._ref.current, 'contextmenu', e => e.preventDefault()]
		];
		for (const e_l of this.state.event_listeners)
			e_l[0].addEventListener(e_l[1], e_l[2]);

		if (this.state.initital_dragging) {
			this.render();
			const center = getElementCenter(this._ref.current);
			this.handleMouseDown({
				'clientX': center.x,
				'clientY': center.y
			});
		}
	}

	componentWillUnmount() {
		for (const e_l of this.state.event_listeners)
			e_l[0].removeEventListener(e_l[1], e_l[2]);
	}

	handleMouseDown(e) {
		if (e.button === 2) {
			this.state.function_to_delete_self();
			return;
		}
		this.setState({
			'dragging': true,
			'gripX': e.clientX - this.state.x,
			'gripY': e.clientY - this.state.y
		});
	}

	handleMouseUp(e) {
		this.setState({'dragging': false});
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
		return (
			<div ref={this._ref} className="block"
				style={{
					'position': 'absolute',
				 	'left': x,
				 	'top': y
				}}>
				<div className="content">
					<div className="inputs">
					{
						this.state.inputs.map(
							(input, i) =>
							<div ref={this.input_connectors_refs[i]} key={i} className="input"
								onMouseDown={e => this.state.startAddingWire({
									'from_block_id': undefined,
									'to_block_id': this.state.id,
									'from_input_id': undefined,
									'to_output_id': i,
									'from_point': {
										'x': e.clientX,
										'y': e.clientY
									},
									'to_point': getElementCenter(this.input_connectors_refs[i].current)
								})}></div>
						)
					}
					</div>
					<div className="name unselectable">{name}</div>
					<div className="outputs">
						{
							this.state.outputs.map(
								(output, i) =>
								<div ref={this.output_connectors_refs[i]} key={i} className="output"
									onMouseDown={e => this.state.startAddingWire({
									'from_block_id': this.state.id,
									'to_block_id': undefined,
									'from_input_id': i,
									'to_output_id': undefined,
									'from_point': getElementCenter(this.output_connectors_refs[i].current),
									'to_point': {
										'x': e.clientX,
										'y': e.clientY
									}
								})}></div>
							)
						}
					</div>
				</div>
			</div>
		);
	}
}