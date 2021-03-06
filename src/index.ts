import reduceAst, {Variables} from './reduce-ast';
import build from './simple-math-ast';
import Animated from 'react-native-reanimated';
import {InvalidExpressionError} from './InvalidExpressionError';
import ASTNode from './simple-math-ast/parse/node';
import logPrefix from './log-prefix';

type Placeholder = number | Animated.Value<number | string | boolean>;

const makeAst = (
	args: TemplateStringsArray,
	...placeholder: Placeholder[]
): [ASTNode, Variables] => {
	let variableMap = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if (args.length > variableMap.length) {
		throw new TypeError(
			`Not more than ${
				variableMap.length
			} variables are supported per expression.`
		);
	}
	let intersect: string[] = [];
	let variables: Variables = {};
	for (let i = 0; i < args.length; i++) {
		intersect.push(args[i]);
		if (i !== args.length - 1) {
			const variable = variableMap[i];
			intersect.push(variable);
			variables[variable] = placeholder[i];
		}
		intersect = intersect.filter(Boolean);
	}
	const ast = build(intersect.join(''), variables);
	return [ast, variables];
};

const validateArgs = (placeholders: Placeholder[]) => {
	const check = [
		(p: unknown) => p instanceof Animated.Node,
		(p: unknown) => typeof p === 'number',
		(p: unknown) => p instanceof Animated.Value
	];
	for (let placeholder of placeholders) {
		if (
			![
				...check,
				(p: unknown) =>
					Array.isArray(p) && p.every(_p => check.some(f => f(_p)))
			].some(f => f(placeholder))
		) {
			throw new TypeError(
				`${logPrefix} ${JSON.stringify(
					placeholder
				)} was passed as a value but only numbers and Animated.Value's are accepted.`
			);
		}
	}
};

export const nativeFormula = (
	args: TemplateStringsArray,
	...placeholders: number[]
) => {
	const argArray = args || [];

	validateArgs(placeholders);
	const [ast, variables] = makeAst(argArray, ...placeholders);
	const result = reduceAst(ast, variables, 'native');
	if (Array.isArray(result)) {
		throw new InvalidExpressionError('Result is an array');
	}
	return result;
};

const formula = (
	args: TemplateStringsArray,
	...placeholders: Placeholder[]
) => {
	const argArray = args || [];
	validateArgs(placeholders);
	try {
		const [ast, variables] = makeAst(argArray, ...placeholders);
		const result = reduceAst(ast, variables, 'reanimated');
		if (Array.isArray(result)) {
			throw new InvalidExpressionError('Result is an array');
		}
		return result;
	} catch (err) {
		if (err.name === 'InvalidExpressionError') {
			throw new InvalidExpressionError(
				`${logPrefix} Expression ${
					argArray.length > 0
						? argArray.join('<variable>')
						: placeholders.join(',')
				} could not be parsed: ${err.message}`
			);
		} else {
			throw err;
		}
	}
};

export default formula;
