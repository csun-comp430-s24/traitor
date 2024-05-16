import { typecheck } from "../../../../main/javascript/traitor/typechecker/typechecker.js";
import { RedeclarationError, UndeclaredError, TypeError } from "../../../../main/javascript/traitor/typechecker/errors.js";
import parse from "../../../../main/javascript/traitor/parser/parser.js";
import tokenize from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import * as util from 'util';

describe('Typechecking Program Items Test', () => {
    it('Declaring struct twice with the same struct name', () => {
        const data = "struct Test {} struct Test {}";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Item has been declared more than once with name: `Test`"));
        }
    })
    it('Declaring struct with two parameters of the same name', () => {
        const data = `
        struct Test {
            value: Int,
            value: Int
        }`;
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Parameter `value` has been declared more than once for struct `Test`"));
        }
    })
    it('Declaring trait twice with the same trait name', () => {
        const data = "trait Test {} trait Test {}";
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Item has been declared more than once with name: `Test`"));
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
            expect(err).toStrictEqual(new UndeclaredError("`IntWrapper` is not defined"));
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

describe('Typechecking statements test', () => {
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
            expect(err).toStrictEqual(new UndeclaredError("`a` is not defined"));
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
            expect(err).toStrictEqual(new UndeclaredError("`IntWrapper` is not defined"));
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
    it('Attempting accessing a non-existent value from struct', () => {
        const data = `
                    struct IntWrapper {
                        value: Int
                    }
                    let a: IntWrapper = new IntWrapper { value: 7 };
                    let b: IntWrapper = a.data;`;
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("`data` cannot be accessed by type IntWrapper"));
        }
    })
    it('Attempting calling method that does not exist', () => {
        const data = `
        trait Addable {
            method add(other: Self): Self;
        }
        impl Addable for Int {
            method add(other: Int): Int {
                return self + other;
            }
        }
        let a1: Int = 3;
        let a2: Int = a1.sub(3);
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors */));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("`sub` cannot be accessed by type IntType"));
        }
    })
    it('Attempting accessing method for non-struct', () => {
        const data = `
        let a1: Int = 3;
        let a2: Int = a1.add(3);
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors */));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("`add` cannot be accessed by type IntType"));
        }
    })
    it('Attempting calling method', () => {
        const data = `
        trait Addable {
            method add(other: Self): Self;
        }
        struct IntWrapper {
            value: Int
        }
        impl Addable for IntWrapper {
            method add(other: IntWrapper): IntWrapper {
                return new IntWrapper { value: self.value + other.value };
            }
        }
        let a1: IntWrapper = new IntWrapper{ value: 3 };
        let a2: Int = (a1.add(new IntWrapper{ value: 3 })).value;
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors */));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new UndeclaredError("Method `sub` does not exist for type IntType"));
        }
    })
    it('Attempting assigning wrong type from function', () => {
        const data = `
        func mult (a: Int, b: Int) : Int {
            return 0;
        }
        let a: Boolean = mult(1, 2);
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Attempted assigning type of IntType to new variable `a` of type BooleanType"));
        }
    })
    it('Attempting calling function with wrong parameter type', () => {
        const data = `
        func mult (a: Int, b: Int) : Int {
            return 0;
        }
        let a: Int = mult(1, true);
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Expected param type IntType for method `mult`; instead received BooleanType"));
        }
    })
    it('Attempting declaration of function with the same name and parameters', () => {
        const data = `
        func mult (a: Int, b: Int) : Int {
            return 0;
        }
        func mult (a: Int, b: Int) : Int {
            return 0;
        }
        `
        try {
            const tokens = tokenize(data);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new RedeclarationError("Item has been declared more than once with name: `mult`"));
        }
    })
    it('Attempting comparison of different types', () => {
        const data1 = `
        let a: Int = 1;
        let b: Boolean = false;
        if (a != b) return;
        `
        try {
            const tokens = tokenize(data1);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Cannot compare expression of type IntType to expression of type BooleanType"));
        }

        const data2 = `
        let a: Int = 1;
        let b: Boolean = false;
        if (a == b) return;
        `
        try {
            const tokens = tokenize(data2);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Cannot compare expression of type IntType to expression of type BooleanType"));
        }

        const data3 = `
        let a: Int = 1;
        let b: Boolean = false;
        if (a < b) return;
        `
        try {
            const tokens = tokenize(data3);
            const ast = parse(tokens);
            // console.log(util.inspect(ast, false, null, true /* enable colors));
            const vars = typecheck(ast);
        } catch(err) {
            expect(err).toStrictEqual(new TypeError("Cannot compare expression of type IntType to expression of type BooleanType"));
        }
    })
})

describe('Successful typecheck of sample program', () => {
    it('Successful typecheck', () => {
        const data = `
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
                println(self);
            }
        }
        
        func mult (x : Int, y : Int) : Int { 
            return x * y; 
        }
        
        let a1: Int = 5;
        let a2: IntWrapper = new IntWrapper { value: 7 };
        let a3: Int = a1.add(2);
        let a4: IntWrapper = a2.add(new IntWrapper { value: 3 });
        let a5: Boolean = true;
        a3.print();
        1 + 2;
        return 3;
        if ( a5 == true ) {
            a5 = false;
        } else {
            a5 = true;
        }
        while (a1 < a3) {
            a1 = a1.add(1);
            break;
        }
        a1 < a3;
        a2 != a4;
        println(a4);
        if (a1 == a3) return;
        `
        const tokens = tokenize(data);
        const ast = parse(tokens);
        // console.log(util.inspect(ast, false, null, true /* enable colors */));
        const vars = typecheck(ast);
        const expected = {
            Variables: {
              mult: 'IntType',
              a1: 'IntType',
              a2: 'IntWrapper',
              a3: 'IntType',
              a4: 'IntWrapper',
              a5: 'BooleanType'
            }
          }
        expect(vars).toStrictEqual(expected);
    })
})