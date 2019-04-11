import test from 'ava';
import build from '../src/simple-math-ast';
import formula, {nativeFormula} from '../dist';
import reduceAst from '../dist/reduce-ast';
import Animated from 'react-native-reanimated';

test('Simple arithmetic addition', t => {
	const value = reduceAst(build('2 + 2'), {}, 'native');
	t.is(value, 4);
});

test('Addition using variables', t => {
	const y = 3;
	t.is(nativeFormula`2 + ${y}`, 5);
});

test('Subtraction using variables', t => {
	const y = 10;
	t.is(nativeFormula`0-${y}`, -10);
});

test('Should do Multiplication before addition', t => {
	const x = 5;
	const y = 2;
	const z = 10;
	t.is(nativeFormula`${x} + ${y} * ${z}`, 25);
	t.is(nativeFormula`${x} + (${y} * ${z})`, 25);
	t.is(nativeFormula`(${x} + ${y}) * ${z}`, 70);
});

test('Animated.Value addition', t => {
	const a = new Animated.Value(1);
	const b = new Animated.Value(1);
	const added = formula`${a} + ${b}`;
	// @ts-ignore
	t.is(added.__value, 2);
});

test('Should reject string placeholders', t => {
	const a = {a: 'invalid'};
	t.throws(() => formula`${a} + 1`, /was passed as a value/);
	const b = '2';
	t.throws(() => formula`${b} + 1`, /was passed as a value/);
});

test('Mixed Animated.Value and raw numbers', t => {
	const a = 1;
	const b = new Animated.Value(2);
	t.is(formula`${a}+${2}`.__value, 3);
});

test('Invalid math should throw', t => {
	const a = 1;
	t.throws(() => formula`1++2`, /Expression 1\+\+2 could not be parsed/);
	t.throws(
		() => formula`${a}++2`,
		/Expression <variable>\+\+2 could not be parsed/
	);
});

test('Should do sin() function', t => {
	const a = 0.5;
	t.is(formula`sin(${a})`.__value, Math.sin(0.5));
	t.throws(() => formula`sin(a++1)`);
});

test('Should do geometric functions', t => {
	const a = 0.5;
	t.is(
		formula`cos(${a}) + sin(${a}) + tan(${a})`.__value,
		Math.cos(a) + Math.sin(a) + Math.tan(a)
	);
	t.is(formula`cot(${a})`.__value, 1 / Math.tan(a));
});

test('Should do square root', t => {
	const a = 4;
	t.is(formula`sqrt(4)`.__value, 2);
});

test('Should throw on unsupported function', t => {
	t.throws(() => formula`randomfunction()`);
});

test('Should throw on unrecognized variable', t => {
	const a = 2;
	t.throws(() => formula`${a} + x`);
});
});
test.todo('Should throw on unrecognized variable');
test.todo('Should support min()');
test.todo('Should support array for min()');
test.todo('Should support max()');
test.todo('Should support array for ()');
test.todo('Should support ternary');
test.todo('Should support PI and other constants');
test.todo('Should support ^ operator');
test.todo('Should handle function with no arguments');
