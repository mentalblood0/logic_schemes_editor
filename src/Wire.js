'use strict';

function distance(a, b) {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function Wire(props) {
	const scale = props.scale;
	const from_point = props.from_point;
	const to_point = props.to_point;
	const length = distance(from_point, to_point);
	const angle = Math.atan2(to_point.y - from_point.y, to_point.x - from_point.x);
	return (
		<div className="wire" style={{
			'left': 'calc(' + from_point.x + 'px' + ' + ' + '0vmin)',
			'top': 'calc(' + from_point.y + 'px' + ' - ' + 7 * scale + 'px)',
			'width': length - 12 * 2 * scale + 'px',
			'height': 14 * scale + 'px',
			'transform': 'rotate(' + angle + 'rad) translate(' + 12 * scale + 'px, 0)',
			'background': 'linear-gradient(90deg, deepskyblue ' + 3 * scale + 'px, limegreen calc(100% - ' + 3 * scale + 'px))'
		}}></div>
	)
}