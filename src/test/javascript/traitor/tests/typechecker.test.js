import { typecheck } from "../../../../main/javascript/traitor/typechecker/typechecker.js";
import { ConditionError, ItemError, RedeclarationError, UndeclaredError } from "../../../../main/javascript/traitor/typechecker/errors.js";
import parse from "../../../../main/javascript/traitor/parser/parser.js";
import tokenize from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import * as util from 'util';

describe('Typechecker Test', () => {
    it('Successful typecheck', () => {
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

        func mult (x : Int, y : Int) : Int { 
            return x * y; 
        }

        let a1: Int = 5;
        let a2: IntWrapper = new IntWrapper { value: 7 };
        let a3: Int = a1.add(2);
        let a4: IntWrapper = a2.add(new IntWrapper { value: 3 });
        a3.print();
        a4.print();
        1 + 2;
        return 3;
        { a4.print(); }
        `
        const tokens = tokenize(text);
        const parsed = parse(tokens);
        // console.log(util.inspect(parsed, false, null, true /* enable colors */));
        const vars = typecheck(parsed);
        // console.log(util.inspect(typecheck(parsed), false, null, true /* enable colors */));

        const expected = {
            Variables: { a1: 'IntType', a2: 'IntWrapper', a3: 'IntType', a4: 'IntWrapper' }
          }
        expect(vars).toStrictEqual(expected);
    })
    it('Declaring struct twice with the same struct name', () => {
        const data = "struct Test {} struct Test {}";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens)
            const vars = typecheck(ast)
        } catch(err) {
            expect(err).toStrictEqual(new ItemError("Item has been declared twice with name: `Test`"));
        }
    })
    it('Declaring trait twice with the same trait name', () => {
        const data = "trait Test {} trait Test {}";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens)
            const vars = typecheck(ast)
        } catch(err) {
            expect(err).toStrictEqual(new ItemError("Item has been declared twice with name: `Test`"));
        }
    })
    it('Redeclaring a variable', () => {
        const data = "let a: Int = 5; let a: Int = 6;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens)
            const vars = typecheck(ast)
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Variable `a` has already been declared"));
        }
    })
    it('Assigning wrong type to a variable', () => {
        const data = "let a: Int = 5; a = true;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens)
            const vars = typecheck(ast)
        } catch(err) {
            expect(err).toStrictEqual(new ConditionError("Attempted assigning type of BooleanType to variable `a` of type IntType"));
        }
    })
    it('Assigning to a variable that was not declared', () => {
        const data = "a = true;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens)
            const vars = typecheck(ast)
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Variable assigned to before declaration: a"));
        }
    })
    it('Variable exp with undeclared variable', () => {
        const data = "a;";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens)
            const vars = typecheck(ast)
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Variable `a` has not been declared"));
        }
    })
});