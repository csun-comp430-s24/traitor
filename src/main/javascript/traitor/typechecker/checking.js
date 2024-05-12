
import { typecheck } from './typechecker.js';
import * as util from 'util';

import tokenize from '../tokenizer/tokenizer.js';
import parse from '../parser/parser.js';

const text = `
trait Addable {
method add(other: Self): Self;
}

trait Printable {
method print(): Void;
}

struct IntWrapper {
value: Int
}

impl Addable for Int {
method add(other: Int): Int {
    return self + other;
}
}

impl Addable for IntWrapper {
method add(other: IntWrapper): IntWrapper {
    return new IntWrapper { value: self.value + other.value };
}
}

impl Printable for Int {
method print(): Void {
    println(self);
}
}

impl Printable for IntWrapper {
method print(): Void {
    println(self.value);
}
}

let a1: Int = 5;
let a2: IntWrapper = new IntWrapper { value: 7 };
let a3: Int = a1.add(2);
let a4: IntWrapper = a2.add(new IntWrapper { value: 3 });
a3.print();
a4.print();
`
const tokens = tokenize(text);
const parsed = parse(tokens);
// console.log(util.inspect(parsed, false, null, true /* enable colors */));

console.log(util.inspect(typecheck(parsed), false, null, true /* enable colors */));