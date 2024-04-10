import main from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import parseType from "../../../../main/javascript/traitor/parser/typeParser.js"
import * as util from 'util';

describe('Type Parsing Test', () => {
    it('Testing super high order func', () => {
        const test = "(IntWrapper, Void, Boolean) => () => (Int) => (Boolean) => (Self)";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        [parseResult, pos] = parseType(tokens, pos);
        const expected = {
            type: 'FuncType',
            in: {
              type: 'CommaType',
              list: [
                { type: 'StructType', name: 'IntWrapper' },
                { type: 'VoidType' },
                { type: 'BooleanType' }
              ]
            },
            out: {
              type: 'FuncType',
              in: { type: 'CommaType', list: [] },
              out: {
                type: 'FuncType',
                in: { type: 'CommaType', list: [ { type: 'IntType' } ] },
                out: {
                  type: 'FuncType',
                  in: { type: 'CommaType', list: [ { type: 'BooleanType' } ] },
                  out: { type: 'ParenType', value: { type: 'SelfType' } }
                }
              }
            }
        }
        // console.log(util.inspect(parseResult, false, null, true));
        expect(parseResult).toStrictEqual(expected);
    })
    it('Testing wrong token in type parsing', () => {
        const test = "(IntWrapper + Void)";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            // console.log(util.inspect(parseResult, false, null, true));
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
            // console.log(util.inspect(parseResult, false, null, true));
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error No Right Paren On ParenType"));
        }
    })
    it('Testing missing exit in FuncType parsing', () => {
        const test = "(Int) => ";
        const tokens = main(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            // console.log(util.inspect(parseResult, false, null, true));
        } catch(err) {
            expect(err).toStrictEqual(new Error("Parse Error No Exit On FunctionType"));
        }
    })
})