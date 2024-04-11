import main from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import parseType from "../../../../main/javascript/traitor/parser/typeParser.js"
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