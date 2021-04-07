'use strict';

class TestsEditor extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			'inputs': props.inputs,
			'outputs': props.outputs,
			'tests': props.tests
		};
	}

	render() {
		const inputs = this.state.inputs;
		const outputs = this.state.outputs;
		const tests = this.state.tests;
		return <div className="testsEditor">
			<table className="testsTable">
				<tbody>
					<tr>
					{
						inputs.map((name, i) =>
							<td key={i}>{name}</td>
						)
					}
					{
						outputs.map((name, i) =>
							<td key={i}>{name}</td>
						)
					}
					</tr>
				{
					tests.map((t, i) => 
						<tr key={i}>
							{t.slice(0, inputs.length).map((v, i) => <td key={i}>{v}</td>)}
							{t.slice(inputs.length, t.length).map((v, i) => <td key={i}>{v}</td>)}
						</tr>
					)
				}
				</tbody>
			</table>
		</div>;
	}
}