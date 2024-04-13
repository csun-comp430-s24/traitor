import tokenize from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import parseType from "../../../../main/javascript/traitor/parser/typeParser.js"
import { parseFuncDef, parseImplDef, parseStructDef, parseTraitDef } from "../../../../main/javascript/traitor/parser/defParser.js";
import parseExp from "../../../../main/javascript/traitor/parser/expParser.js";
import ParseError from "../../../../main/javascript/traitor/parser/parseError.js";
import parse from "../../../../main/javascript/traitor/parser/parser.js"
import * as util from 'util';

describe('Type Parsing Test', () => {
    it('Testing super high order func', () => {
        const test = "(IntWrapper, (Void), () => Boolean) => () => (Int) => (Boolean) => (Self)";
        const tokens = tokenize(test);
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
        const tokens = tokenize(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError("Unknown Type: +"));
        }
    })
    it('Testing missing right paren in ParenType parsing', () => {
        const test = "(IntWrapper ";
        const tokens = tokenize(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            // console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError("No Right Paren On ParenType"));
        }
    })
    it('Testing missing right paren in FuncType parsing', () => {
        const test = "(Void, Int, Boolean";
        const tokens = tokenize(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            // console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError("No Right Paren On FuncType"));
        }
    })
    it('Testing missing right arrow in FuncType parsing', () => {
        const test = "(Int, Void)";
        const tokens = tokenize(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError("Missing Right Arrow On FuncType"));
        }
    })
    it('Testing missing exit in FuncType parsing', () => {
        const test = "(Int) => ";
        const tokens = tokenize(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError("No Exit On FuncType"));
        }
    })
    it('Testing missing comma in comma type', () => {
        const test = "(Int Void)";
        const tokens = tokenize(test);
        var parseResult;
        var pos = 0;
        try { 
            [parseResult, pos] = parseType(tokens, pos);
            console.log(parseResult);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError("Missing Comma Between Types"));
        }
    })
})

describe('Def Parsing Test', () => {
    it('Testing struct definition', () => {
        const test = "struct myStruct {var1: Int, var2: Int}";
        const tokens = tokenize(test);
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
        const tokens = tokenize(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError('Missing `}` on struct definition'));
        }
    })
    it('Testing missing comma from struct def params', () => {
        const test = "struct myStruct {var1: Int var2: Int}";
        const tokens = tokenize(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError('Missing Comma Between Params'));
        }
    })
    it('Testing missing left bracket from struct def', () => {
        const test = "struct myStruct var1: Int, var2: Int}";
        const tokens = tokenize(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError('Missing `{` on struct definition'));
        }
    })
    it('Testing missing structname from struct def', () => {
        const test = "struct {var1: Int, var2: Int}";
        const tokens = tokenize(test);
        try {
            const [parseResult, pos] = parseStructDef(tokens, 0);
        } catch(err) {
            expect(err).toStrictEqual(new ParseError('Missing structname on struct definition'));
        }
    })
    it('Testing empty params from struct def', () => {
        const test = "struct myStruct {}";
        const tokens = tokenize(test);
        const [parseResult, pos] = parseStructDef(tokens, 0);
        const expected = {
            class: 'StructDef',
            structName: 'myStruct',
            params: { class: 'CommaParam', list: [] }
          }
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(4);
    })
    it('Testing param with missing :', () => {
      const test = "struct myStruct {param1 Int}";
      const tokens = tokenize(test);
      try {
        const [parseResult, pos] = parseStructDef(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing `:` on Param'));
      }
    })
    it('Testing param with missing type', () => {
      const test = "struct myStruct {param1 :";
      const tokens = tokenize(test);
      try {
        const [parseResult, pos] = parseStructDef(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing Type On Param'));
      }
    })
    it('Testing trait definition', () => {
        const test = "trait Addable { method print(): Void; method add(a:Int, b:Int): Int; }";
        const tokens = tokenize(test);
        const [parseResult, pos] = parseTraitDef(tokens, 0);
        const expected = {
            class: 'TraitDef',
            traitName: 'Addable',
            absMethods: [
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
    it('Testing trait definition with no methods', () => {
      const test = "trait Addable {}";
      const tokens = tokenize(test);
      const [parseResult, pos] = parseTraitDef(tokens, 0);
      const expected = {
          class: 'TraitDef',
          traitName: 'Addable',
          absMethods: []
        }
      expect(parseResult).toStrictEqual(expected);
      expect(pos).toStrictEqual(4);
    })
    it('Testing trait definition with missing traitname', () => {
      const test = "trait {}";
      const tokens = tokenize(test);
      try {
        const [parseResult, pos] = parseTraitDef(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing trait name on trait definition'));
      }
    })
    it('Testing trait definition with missing right bracket', () => {
      const test = "trait Addable {";
      const tokens = tokenize(test);
      try {
        const [parseResult, pos] = parseTraitDef(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing `}` on trait definition'));
      }
    })
    it('Testing trait definition with missing left bracket', () => {
      const test = "trait Addable";
      const tokens = tokenize(test);
      try {
        const [parseResult, pos] = parseTraitDef(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing `{` on trait definition'));
      }
    })
    it('Testing abstract method with missing semicolon', () => {
      const test = "trait Addable { method print() : Void }";
      const tokens = tokenize(test);
      try {
        const [parseResult, pos] = parseTraitDef(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing `;` on abstract method definition'));
      }
    })
    it('Testing impl definition', () => {
      const test = "impl Addable for Int { method add(other: Int): Int { return self + other; } }"
      const tokens = tokenize(test);
      const [res, pos] = parseImplDef(tokens, 0);
      const expected = {
        class: 'ImplDef',
        traitName: 'Addable',
        type: { class: 'IntType' },
        concMethods: [
          {
            class: 'ConcreteMethodDef',
            methodName: 'add',
            params: {
              class: 'CommaParam',
              list: [
                {
                  class: 'Param',
                  varName: 'other',
                  type: { class: 'IntType' }
                }
              ]
            },
            type: { class: 'IntType' },
            stmts: [
              {
                class: 'ReturnExpStmt',
                exp: {
                  class: 'BinOpExp',
                  op: '+',
                  left: { class: 'SelfExp' },
                  right: { class: 'VarExp', name: 'other' }
                }
              }
            ]
          }
        ]
      }
      expect(res).toStrictEqual(expected);
      expect(pos).toStrictEqual(22);
    })
    it('Testing function definition', () => {
      const test = "func var1 ( p : Int ) : Int { return 5; }";
      const tokens = tokenize(test);
      const [res, pos] = parseFuncDef(tokens, 0);
      // console.log(util.inspect(res, false, null, true));
      const expected = {
        class: 'FuncDef',
        varName: 'var1',
        params: {
          class: 'CommaParam',
          list: [ { class: 'Param', varName: 'p', type: { class: 'IntType' } } ]
        },
        type: { class: 'IntType' },
        stmts: [ { class: 'ReturnExpStmt', exp: { class: 'IntLitExp', value: 5 } } ]
      }
      expect(res).toStrictEqual(expected);
      expect(pos).toStrictEqual(14);
    })
})

describe('Exp Parsing Test', () => {
    it('Testing expression parsing with int literals', () => {
        const test = "(1 + 2) - 3 * 4 < 2 != 3 < 4";
        const tokens = tokenize(test);
        const [parseResult, pos] = parseExp(tokens, 0);
        const expected = {
          class: 'NotEqualsExp',
          left: {
            class: 'LessThanExp',
            left: {
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
            },
            right: { class: 'IntLitExp', value: 2 }
          },
          right: {
            class: 'LessThanExp',
            left: { class: 'IntLitExp', value: 3 },
            right: { class: 'IntLitExp', value: 4 }
          }
        }
        // console.log(util.inspect(parseResult, false, null, true));
        expect(parseResult).toStrictEqual(expected);
        expect(pos).toStrictEqual(15);
    })
    it('Testing parsing invalid expression', () => {
        const test = "=>";
        const tokens = tokenize(test);
        try {
            const [parseResult, pos] = parseExp(tokens, 0);
        }
        catch (err) {
            expect(err).toStrictEqual(new ParseError('Expected Expression, Received: =>'))
        }
    })
    it('Testing parsing empty expression', () => {
        const test = "";
        const tokens = tokenize(test);
        const [parseResult, pos] = parseExp(tokens, 0);
        expect(parseResult).toStrictEqual(null);
        expect(pos).toStrictEqual(0);
    })
    it('Testing parsing chained dot expressions and chained call expressions', () => {
        const test = "var1.var2.var3(1, 2, 3)()";
        const tokens = tokenize(test);
        const [parseResult, pos] = parseExp(tokens, 0);
        // console.log(util.inspect(parseResult, false, null, true));
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
    it('Parsing new struct instantiation', () => {
        const test = 'new IntWrapper { value1: 7, value2: true, value3: false, value4: self }';
        const tokens = tokenize(test);
        const [parseRes, pos] = parseExp(tokens, 0);
        const expected = {
          class: 'NewStructExp',
          structName: 'IntWrapper',
          params: {
            class: 'StructParams',
            list: [
              {
                class: 'StructParam',
                varName: 'value1',
                exp: { class: 'IntLitExp', value: 7 }
              },
              {
                class: 'StructParam',
                varName: 'value2',
                exp: { class: 'TrueExp' }
              },
              {
                class: 'StructParam',
                varName: 'value3',
                exp: { class: 'FalseExp' }
              },
              {
                class: 'StructParam',
                varName: 'value4',
                exp: { class: 'SelfExp' }
              }
            ]
          }
        }
        // console.log(util.inspect(parseRes, false, null, true));
        expect(parseRes).toStrictEqual(expected);
        expect(pos).toStrictEqual(19);
    })
    it('Testing missing right paren on paren exp', () => {
      const test = '((1 + 2) * 3';
      const tokens = tokenize(test);
      try {
        const [parseRes, pos] = parseExp(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing `)` In Parenthesized Expression'));
      }
    })
    it('Testing missing expression on paren exp', () => {
      const test = '(1 + 2) * ()';
      const tokens = tokenize(test);
      try {
        const [parseRes, pos] = parseExp(tokens, 0);
      } catch (err) {
        expect(err).toStrictEqual(new ParseError('Missing Expression In Parenthesized Expression'));
      }
    })
    it('Parsing new struct instantiation no params', () => {
      const test = 'new IntWrapper {}';
      const tokens = tokenize(test);
      const [parseRes, pos] = parseExp(tokens, 0);
      const expected = {
        class: 'NewStructExp',
        structName: 'IntWrapper',
        params: {
          class: 'StructParams',
          list: []
        }
      }
      // console.log(util.inspect(parseRes, false, null, true));
      expect(parseRes).toStrictEqual(expected);
      expect(pos).toStrictEqual(4);
    })
    it('Parsing double equals exp', () => {
      const test = '2 == 2';
      const tokens = tokenize(test);
      const [parseRes, pos] = parseExp(tokens, 0);
      const expected = {
        class: 'DoubleEqualsExp',
        left: { class: 'IntLitExp', value: 2 },
        right: { class: 'IntLitExp', value: 2 }
      }
      // console.log(util.inspect(parseRes, false, null, true));
      expect(parseRes).toStrictEqual(expected);
      expect(pos).toStrictEqual(3);
    })
})

describe('Stmt Parsing Test', () => {
})

// console.log(util.inspect(parseRes, false, null, true));

describe('Program Parsing Test', () => {
  var pos = 0;
  it('Testing program_items followed by stmt', () => {
      const test = 'struct s {} trait t { } impl t1 for Void {} func foo () : Int { return 5; } { x = 7;}';
      const tokens = tokenize(test);
      const parseResult = parse(tokens);
      const expected =       
      {
        class: 'Program',
        programItems: [
          {
            class: 'StructDef',
            structName: 's',
            params: { class: 'CommaParam', list: [] }
          },
          { class: 'TraitDef', traitName: 't', absMethods: [] },
          {
            class: 'ImplDef',
            traitName: 't1',
            type: { class: 'VoidType' },
            concMethods: []
          },
          {
            class: 'FuncDef',
            varName: 'foo',
            params: { class: 'CommaParam', list: [] },
            type: { class: 'IntType' },
            stmts: [
              {
                class: 'ReturnExpStmt',
                exp: { class: 'IntLitExp', value: 5 }
              }
            ]
          }
        ],
        stmts: [
          {
            class: 'BlockStmt',
            stmtList: [
              {
                class: 'VarStmt',
                varName: 'x',
                exp: { class: 'IntLitExp', value: 7 }
              }
            ]
          }
        ]
      };
      //console.log(util.inspect(parseResult, false, null, true));
      expect(parseResult).toStrictEqual(expected);
  })
})