import main from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import parseType from "../../../../main/javascript/traitor/parser/typeParser.js"
import { parseStructDef, parseTraitDef } from "../../../../main/javascript/traitor/parser/defParser.js";
import parseExp from "../../../../main/javascript/traitor/parser/expParser.js";
import * as util from 'util';

describe('Type Parsing Test', () => {
    it('Testing super high order func', () => {
        const test = "(IntWrapper, (Void), () => Boolean) => () => (Int) => (Boolean) => (Self)";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        [parseResult, pos] = parseType(tokens, pos);
        const expected = {
            class: 'FuncType',
            in: {
              class: 'CommaType',
              list: [
                { class: 'StructType', name: 'IntWrapper' },
                { class: 'ParenType', value: { class: 'VoidType' } },
                {
                  class: 'FuncType',
                  in: { class: 'CommaType', list: [] },
                  out: { class: 'BooleanType' }
                }
              ]
            },
            out: {
              class: 'FuncType',
              in: { class: 'CommaType', list: [] },
              out: {
                class: 'FuncType',
                in: { class: 'CommaType', list: [ { class: 'IntType' } ] },
                out: {
                  class: 'FuncType',
                  in: { class: 'CommaType', list: [ { class: 'BooleanType' } ] },
                  out: { class: 'ParenType', value: { class: 'SelfType' } }
                }
              }
            }
          }
        // console.log(util.inspect(parseResult, false, null, true));
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(27);
    })
    it('Testing wrong token in type parsing', () => {
        const test = "(IntWrapper, + Void)";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error Unknown Type: +"));
        }
    })
    it('Testing missing right paren in ParenType parsing', () => {
        const test = "(IntWrapper ";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            // console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error No Right Paren On ParenType"));
        }
    })
    it('Testing missing right paren in FuncType parsing', () => {
        const test = "(Void, Int, Boolean";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            // console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error No Right Paren On FuncType"));
        }
    })
    it('Testing missing right arrow in FuncType parsing', () => {
        const test = "(Int, Void)";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error Missing Right Arrow On FuncType"));
        }
    })
    it('Testing missing exit in FuncType parsing', () => {
        const test = "(Int) => ";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error No Exit On FuncType"));
        }
    })
    it('Testing missing comma in comma type', () => {
        const test = "(Int Void)";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error Missing Comma Between Types"));
        }
    })
})

describe('Def Parsing Test', () => {
    it('Testing struct definition', () => {
        const test = "struct myStruct {var1: Int, var2: Int}";
        const tokens = main(test);
        const [parseResult, pos] = parseStructDef(tokens, 0);
        const expected = {
            class: 'StructDef',
            structName: 'myStruct',
            params: {
              class: 'CommaParam',
              list: [
                { class: 'Param', varName: 'var1', type: { class: 'IntType' } },
                { class: 'Param', varName: 'var2', type: { class: 'IntType' } }
              ]
            }
          }
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(11);
    })
    it('Testing missing right bracket from struct def', () => {
        const test = "struct myStruct {var1: Int, var2: Int";
        const tokens = main(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new Error('Parse Error Missing `}` on struct definition'));
        }
    })
    it('Testing missing comma from struct def params', () => {
        const test = "struct myStruct {var1: Int var2: Int}";
        const tokens = main(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new Error('Parse Error Missing Comma Between Params'));
        }
    })
    it('Testing missing left bracket from struct def', () => {
        const test = "struct myStruct var1: Int, var2: Int}";
        const tokens = main(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new Error('Parse Error Missing `{` on struct definition'));
        }
    })
    it('Testing missing structname from struct def', () => {
        const test = "struct {var1: Int, var2: Int}";
        const tokens = main(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new Error('Parse Error Missing structname on struct definition'));
        }
    })
    it('Testing empty params from struct def', () => {
        const test = "struct myStruct {}";
        const tokens = main(test);
        const [parseResult, pos] = parseStructDef(tokens, 0);
        const expected = {
            class: 'StructDef',
            structName: 'myStruct',
            params: { class: 'CommaParam', list: [] }
          }
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(4);
    })
    it('Testing trait definition', () => {
        const test = "trait Addable { method print(): Void; method add(a:Int, b:Int): Int; }";
        const tokens = main(test);
        const [parseResult, pos] = parseTraitDef(tokens, 0);
        const expected = {
            class: 'TraitDef',
            traitName: 'Addable',
            absMethodList: [
              {
                class: 'AbstractMethodDef',
                methodName: 'print',
                params: { class: 'CommaParam', list: [] },
                type: { class: 'VoidType' }
              },
              {
                class: 'AbstractMethodDef',
                methodName: 'add',
                params: {
                  class: 'CommaParam',
                  list: [
                    { class: 'Param', varName: 'a', type: { class: 'IntType' } },
                    { class: 'Param', varName: 'b', type: { class: 'IntType' } }
                  ]
                },
                type: { class: 'IntType' }
              }
            ]
          }
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(25);
    })
})

describe('Exp Parsing Test', () => {
    it('Testing arithmetic parsing', () => {
        const test = "(1 + 2) - 3 * 4";
        const tokens = main(test);
        const [parseResult, pos] = parseExp(tokens, 0);
        const expected = {
            class: 'BinOpExp',
            op: '-',
            left: {
              class: 'ParenExp',
              exp: {
                class: 'BinOpExp',
                op: '+',
                left: { class: 'IntLitExp', value: 1 },
                right: { class: 'IntLitExp', value: 2 }
              }
            },
            right: {
              class: 'BinOpExp',
              op: '*',
              left: { class: 'IntLitExp', value: 3 },
              right: { class: 'IntLitExp', value: 4 }
            }
          }
        // console.log(util.inspect(parseResult, false, null, true));
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(9);
    })
    it('Testing parsing invalid expression', () => {
        const test = "=>";
        const tokens = main(test);
        try {
            const [parseResult, pos] = parseExp(tokens, 0);
        }
        catch (err) {
            expect(err).toStrictEqual(new Error('Parse Error Expected Expression, Received: =>'))
        }
    })
    it('Testing parsing empty expression', () => {
        const test = "";
        const tokens = main(test);
        const [parseResult, pos] = parseExp(tokens, 0);
        expect(parseResult).toStrictEqual(null);
        expect(pos).toStrictEqual(0);
    })
    it('Testing parsing chained dot expressions and chained call expressions', () => {
        const test = "var1.var2.var3(1, 2, 3)()";
        const tokens = main(test);
        const [parseResult, pos] = parseExp(tokens, 0);
        console.log(util.inspect(parseResult, false, null, true));
        const expected = {
            class: 'CallExp',
            call: {
              class: 'CallExp',
              call: {
                class: 'DotExp',
                primary: {
                  class: 'DotExp',
                  primary: { class: 'VarExp', name: 'var1' },
                  varName: 'var2'
                },
                varName: 'var3'
              },
              params: {
                class: 'CommaExp',
                list: [
                  { class: 'IntLitExp', value: 1 },
                  { class: 'IntLitExp', value: 2 },
                  { class: 'IntLitExp', value: 3 }
                ]
              }
            },
            params: { class: 'CommaExp', list: [] }
          }
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(14);
    })
})