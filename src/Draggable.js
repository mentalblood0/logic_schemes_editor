'use strict'

class Draggable extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			'x': props.x,
			'y': props.y,
			'dragging': false,
			'gripX': undefined,
			'gripY': undefined
		}
	}

	componentDidMount() {
		const content_element = this._ref.current.children[0];
		const name_element = this._ref.current.children[0].children[1];
		const ifDraggableByThis = (e, f) => (
			(e.target === content_element) ||
			(e.target === name_element)
		) ? f(e) : null;
		window.addEventListener('mousedown', e => ifDraggableByThis(e, this.handleMouseDown));
		window.addEventListener('mouseup', e => ifDraggableByThis(e, this.handleMouseUp));
		window.addEventListener('mousemove', e => this.state.dragging ? this.handleMouseMove(e) : null);
	}

	handleMouseDown(e) {
		const newState = {
			'dragging': true,
			'gripX': e.clientX - this.state.x,
			'gripY': e.clientY - this.state.y
		};
		this.setState(newState);
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
}