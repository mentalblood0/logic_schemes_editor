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

		if ((inputs.length == 0) || (outputs.length == 0))
			return <div className="testsEditor">
				<div className="noInputsOutputsMessage">There should be inputs and outputs to add tests</div>
			</div>
		
		return <div className="testsEditor">
			<div className="tables">
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
												state.tests.splice(test_i, 1);
												return state;
											});
										}}>-</div>
								</td>
								{
									t.slice(0, inputs.length).map(
										(v, input_i) => 
										<td key={input_i}
											className={'checkbox ' + (tests[test_i][input_i] ? 'checked' : 'unchecked')} onClick={e => {
													this.setState(state => {
														state.tests[test_i][input_i] = state.tests[test_i][input_i] ? 0 : 1;
														return state;
													});
												}}>
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
										<td key={output_i}
											className={'checkbox ' + (tests[test_i][inputs.length + output_i] ? 'checked' : 'unchecked')} onClick={e => {
													this.setState(state => {
														state.tests[test_i][inputs.length + output_i] = state.tests[test_i][inputs.length + output_i] ? 0 : 1;
														return state;
													});
												}}>
										</td>
									)
								}
								</tr>
							)
						}
						</tbody>
					</table>
				</div>
			</div>
			<div className="addRowButton animated unselectable"
				onClick={e => {
					const tests_length = this.state.tests.length;
					this.setState(state => {
						if (state.tests.length != tests_length)
							return state;
						const test_length = state.inputs.length + state.outputs.length;
						state.tests.push(filledArray(test_length, 0));
						return state;
					})
				}}>+</div>
		</div>;
	}
}