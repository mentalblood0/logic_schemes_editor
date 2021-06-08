/** @jsx h */

function ModalWindow(props) {
	return (
		<div className={props.className}>
			<div className="modalWindowOverlay"
				onClick={props.close_function}></div>
			<div className="modalWindow">
				{props.children}
			</div>
		</div>
	);
}