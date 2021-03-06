import {forEach, last} from 'ramda';

import {
	isNumber,
	isConstant,
	isVariable,
	isOperator,
	isNamedFunction,
	isLeftParenthesis,
	isRightParenthesis
} from '../queries';

import ASTNode from './node';
import {Token} from '../config';
import {Variables} from '../../reduce-ast';
import {InvalidExpressionError} from '../../InvalidExpressionError';

const addOperandNode = (nodes: ASTNode[], token: Token) => {
	const node = new ASTNode(token);

	nodes.push(node);
};

const addOperatorNode = (nodes: ASTNode[], token: Token) => {
	const node = new ASTNode(token);

	if (token.args && token.args > 1) {
		node.setRight(nodes.pop() || null);
	}
	node.setLeft(nodes.pop() || null);

	nodes.push(node);
};

const parse = (tokens: Token[], variables: Variables) => {
	const ops: Token[] = [];
	const nodes: ASTNode[] = [];

	forEach(token => {
		if (isVariable(token) && !variables[token.value as string]) {
			throw new TypeError(`Could not find variable ${token.value}`);
		}
		if (isNumber(token) || isVariable(token) || isConstant(token)) {
			addOperandNode(nodes, token);
		}

		if (isLeftParenthesis(token)) {
			ops.push(token);
		}

		if (isRightParenthesis(token)) {
			while (last(ops) && !isLeftParenthesis(last(ops))) {
				addOperatorNode(nodes, ops.pop() as Token);
			}

			ops.pop();
		}

		if (isOperator(token) || isNamedFunction(token)) {
			while (
				last(ops) &&
				((last(ops) as Token).precedence as number) >=
					(token.precedence as number) &&
				!isLeftParenthesis(token)
			) {
				addOperatorNode(nodes, ops.pop() as Token);
			}

			ops.push(token);
		}
	}, tokens);

	while (ops.length > 0) {
		addOperatorNode(nodes, ops.pop() as Token);
	}
	if (nodes.length > 1) {
		throw new InvalidExpressionError('Could not parse, too many nodes');
	}
	return nodes.pop() as ASTNode;
};

export default parse;
