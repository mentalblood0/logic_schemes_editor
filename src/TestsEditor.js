'use strict';

function filledArray(l, n) {
	return Array.from({length: l}, (_, i) => n);
}

class TestsEditor extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			'inputs': props.inputs,
			'outputs': props.outputs,
			'tests': props.tests,
			'onUnmount': props.onUnmount
		};
	}

	componentWillUnmount() {
		this.state.onUnmount(this.state.tests);
	}

	render() {
		const inputs = this.state.inputs;
		const outputs = this.state.outputs;
		const tests = this.state.tests;
		return <div className="testsEditor">
			<div className="testsTableWrapper inputs">
				<table className="testsTable inputs">
					<tbody>
						<tr>
						<td></td>
						{
							inputs.map((name, i) =>
								<td key={i}>{name}</td>
							)
						}
						</tr>
					{
						tests.map((t, test_i) => 
							<tr key={test_i}>
							<td>
								<div className="removeRowButton animated unselectable"
									onClick={e => {
										const tests_length = this.state.tests.length;
										this.setState(state => {
											if (state.tests.length != tests_length)
												return state;
											delete state.tests[test_i];
										}, () => this.forceUpdate());
									}}>remove</div>
							</td>
							{
								t.slice(0, inputs.length).map(
									(v, input_i) => 
									<td key={input_i}>
										<input type="checkbox" checked={v}
											onChange={e => {
												const value = e.target.checked ? 1 : 0;
												this.setState(state => {
													state.tests[test_i][input_i] = value;
													return state;
												});
											}}></input>
									</td>
								)
							}
							</tr>
						)
					}
					</tbody>
				</table>
			</div>
			<div className="testsTableWrapper outputs">
				<table className="testsTable outputs">
					<tbody>
						<tr>
						{
							outputs.map((name, i) =>
								<td key={i}>{name}</td>
							)
						}
						</tr>
					{
						tests.map((t, test_i) => 
							<tr key={test_i}>
							{
								t.slice(inputs.length, t.length).map(
									(v, output_i) => 
									<td key={output_i}>
										<input type="checkbox" checked={v}
											onChange={e => {
												const value = e.target.checked ? 1 : 0;
												this.setState(state => {
													state.tests[test_i][inputs.length + output_i] = value;
													return state;
												});
											}}></input>
									</td>
								)
							}
							</tr>
						)
					}
					</tbody>
				</table>
			</div>
			<div className="addRowButton animated unselectable"
				onClick={e => {
					const tests_length = this.state.tests.length;
					this.setState(state => {
						if (state.tests.length != tests_length)
							return state;
						const test_length = state.inputs.length + state.outputs.length;
						state.tests.push(filledArray(test_length, 0));
					}, () => this.forceUpdate())
				}}>add</div>
		</div>;
	}
}