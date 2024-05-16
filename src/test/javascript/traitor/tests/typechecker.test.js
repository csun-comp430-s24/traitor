import { typecheck, checkImpl } from "../../../../main/javascript/traitor/typechecker/typechecker.js";
import { ConditionError, ItemError, RedeclarationError, UndeclaredError, TypeError } from "../../../../main/javascript/traitor/typechecker/errors.js";
import parse from "../../../../main/javascript/traitor/parser/parser.js";
import tokenize from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import * as util from 'util';

describe('Typechecker Test', () => {
    it('Declaring struct twice with the same struct name', () => {
        const data = "struct Test {} struct Test {}";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new ItemError("Item has been declared twice with name: `Test`"));
        }
    })
    it('Declaring trait twice with the same trait name', () => {
        const data = "trait Test {} trait Test {}";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new ItemError("Item has been declared twice with name: `Test`"));
        }
    })
    it('Redeclaring a variable', () => {
        const data = "let a: Int = 5; let a: Int = 6;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Variable `a` has already been declared"));
        }
    })
    it('Assigning wrong type to a variable', () => {
        const data = "let a: Int = 5; a = true;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted assigning type of BooleanType to variable `a` of type IntType"));
        }
    })
    it('Assigning to a variable that was not declared', () => {
        const data = "a = true;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Variable assigned to before declaration: a"));
        }
    })
    it('Variable exp with undeclared variable', () => {
        const data = "a;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Variable `a` has not been declared"));
        }
    })
    it('Binary operation with mismatching expressions', () => {
        const data = `let a: Int = 1;
                    let b: Boolean = true;
                    a + b;
                    `;
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted binary operation between IntType and BooleanType"));
        }
    })
    it('Attempting assigning a non existent type to a variable', () => {
        const data = `let a: IntWrapper = new IntWrapper { value: 7 };
                    a.value;`;
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted assigning non-existent type `IntWrapper` to variable `a`"));
        }
    })
    it('Attempting assigning wrong type to newly declared variable', () => {
        const data = `
                    struct IntWrapper {
                        value: Int
                    }
                    let a: IntWrapper = new IntWrapper { value: 7 };
                    let b: Boolean = a.value;`;
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted assigning type of IntType to new variable `b` of type BooleanType"));
        }
    })
    it('Attempting impl definition for non existent trait', () => {
        const data = `
        impl Addable for IntWrapper {
            method add(other: Int): Int {
                return self + other;
            }
        }
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors */));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Attempted implementation of non-existent trait `Addable`"));
        }
    })
    it('Attempting impl definition for non existent type', () => {
        const data = `
        trait Addable {
            method add(other: Self): Self;
        }
        impl Addable for IntWrapper {
            method add(other: Int): Int {
                return self + other;
            }
        }
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors */));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted implementation of trait Addable to non-existent type `IntWrapper`"));
        }
    })
    it('Attempting the duplicate impl definition', () => {
        const data = `
        trait Addable {
            method add(other: Self): Self;
        }
        impl Addable for Int {
            method add(other: Int): Int {
                return self + other;
            }
        }
        impl Addable for Int {
            method add(other: Int): Int {
                return self + other;
            }
        }
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors */));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Trait Addable has already been implemented for IntType"));
        }
    })
    it('Attempting impl of method that is not in the trait', () => {
        const data = `
        trait Exponent {
            method square(): Self;
        }
        impl Exponent for Int {
            method square(): Int {
                return self * self;
            }
            method print(): Void {
                println(self);
            }
        }
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Method `print` does not exist in trait Exponent"));
        }
    })
    it('Attempting impl of method with wrong return type', () => {
        const data = `
        trait Exponent {
            method square(): Self;
            method cube(): Self;
        }
        impl Exponent for Int {
            method square(): Int {
                return self * self;
            }
            method cube(): Void {
                return self * self * self;
            }
        }
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted assigning return type of VoidType to method `cube` which needs return type IntType"));
        }
    })
});