import parseType from './typeParser.js'
import ParseError from './parseError.js';
import { parseStmt } from './stmt.js';
import main from '../tokenizer/tokenizer.js'
import * as util from 'util';

// param ::= var `:` type
export const parseParam = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];

    var parseResult;
    if (tokenPos < tokenList.length && token.type == 'variable') {
        const varName = token.data;
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'colon') {
            tokenPos++;
            [parseResult, tokenPos] = parseType(tokenList, tokenPos);
            if (parseResult != null) {
                return [{class:'Param', varName:varName, type:parseResult}, tokenPos];
            }
            else throw new ParseError('Missing Type On Param');
        }
        else throw new ParseError('Missing `:` on Param');
    }
    else return [null, tokenPos];
}

// comma_param ::= [param (`,` param)*]
export const parseCommaParam = (tokenList, tokenPos) => {
    const paramList = [];
    var parseResult;
    [parseResult, tokenPos] = parseParam(tokenList, tokenPos);
    while (parseResult != null) {
        paramList.push(parseResult);
        if (tokenPos >= tokenList.length) break;
        if (tokenList[tokenPos].type == 'rBracket') break;
        if (tokenList[tokenPos].type == 'rParen') break;
        if (tokenList[tokenPos].type == 'comma') {
            tokenPos++;
            [parseResult, tokenPos] = parseParam(tokenList, tokenPos);
            if (parseResult == null) throw new ParseError('Extra Comma Found On Params');
        }
        else throw new ParseError('Missing Comma Between Params');
    }
    return [{class:'CommaParam', list:paramList}, tokenPos]
}

// structdef ::= `struct` structname `{` comma_param `}`
export const parseStructDef = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];

    var commaParams;
    if (tokenPos < tokenList.length && token.type == 'keyword' && token.data == 'struct') {
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'variable') {
            const structName = token.data;
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'lBracket') {
                [commaParams, tokenPos] = parseCommaParam(tokenList, tokenPos + 1);
                token = tokenList[tokenPos];
                if (tokenPos < tokenList.length && token.type == 'rBracket') {
                    tokenPos++;
                    return [{class:'StructDef', structName:structName, params:commaParams}, tokenPos]
                }
                else throw new ParseError('Missing `}` on struct definition');
            }
            else throw new ParseError('Missing `{` on struct definition');
        }
        else throw new ParseError('Missing structname on struct definition');
    }
    else return [null, tokenPos];
}

// abs_methoddef ::= `method` var `(` comma_param `)` `:` type `;`
const parseAbsMethodDef = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];

    var commaParams, typeResult;
    if (tokenPos < tokenList.length && token.type == 'keyword' && token.data == 'method') {
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'variable') {
            const methodName = token.data;
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'lParen') {
                [commaParams, tokenPos] = parseCommaParam(tokenList, tokenPos + 1);
                token = tokenList[tokenPos];
                if (tokenPos < tokenList.length && token.type == 'rParen') {
                    tokenPos++;
                    token = tokenList[tokenPos];
                    if (tokenPos < tokenList.length && token.type == 'colon') {
                        [typeResult, tokenPos] = parseType(tokenList, tokenPos + 1);
                        if (typeResult != null) {
                            token = tokenList[tokenPos];
                            if (tokenPos < tokenList.length && token.type == 'semicolon') {
                                tokenPos++;
                                return [{class:'AbstractMethodDef', methodName:methodName, params:commaParams, type:typeResult}, tokenPos]
                            }
                            else throw new ParseError('Missing `;` on abstract method definition');
                        }
                        else throw new ParseError('Missing type on abstract method definition');
                    }
                    else throw new ParseError('Missing `:` on abstract method definition');
                }
                else throw new ParseError('Missing `)` on abstract method definition');
            }
            else throw new ParseError('Missing `(` on abstract method definition');
        }
        else throw new ParseError('Missing method name on abstract method definition');
    }
    else return [null, tokenPos];
}

// conc_methoddef ::= `method` var `(` comma_param `)` `:` type `{` stmt* `}`
const parseConcMethodDef = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];

    var commaParams, typeResult, stmtResult;
    const stmts = [];
    if (tokenPos < tokenList.length && token.type == 'keyword' && token.data == 'method') {
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'variable') {
            const methodName = token.data;
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'lParen') {
                [commaParams, tokenPos] = parseCommaParam(tokenList, tokenPos + 1);
                token = tokenList[tokenPos];
                if (tokenPos < tokenList.length && token.type == 'rParen') {
                    tokenPos++;
                    token = tokenList[tokenPos];
                    if (tokenPos < tokenList.length && token.type == 'colon') {
                        [typeResult, tokenPos] = parseType(tokenList, tokenPos + 1);
                        if (typeResult != null) {
                            token = tokenList[tokenPos];
                            if (tokenPos < tokenList.length && token.type == 'lBracket') {
                                [stmtResult, tokenPos] = parseStmt(tokenList, tokenPos + 1);
                                while (stmtResult != null) {
                                    stmts.push(stmtResult);
                                    if (tokenPos >= tokenList.length) break;
                                    if (tokenList[tokenPos].type == 'rBracket') break;
                                    [stmtResult, tokenPos] = parseStmt(tokenList, tokenPos);
                                }
                                token = tokenList[tokenPos];
                                if (tokenPos < tokenList.length && token.type == 'rBracket') {
                                    tokenPos++;
                                    return [{class:'ConcreteMethodDef', methodName:methodName, params:commaParams, type:typeResult, stmts:stmts}, tokenPos]
                                }
                                else throw new ParseError('Missing `}` on concrete method definition');
                            }
                            else throw new ParseError('Missing `{` on concrete method definition');
                        }
                        else throw new ParseError('Missing type on concrete method definition');
                    }
                    else throw new ParseError('Missing `:` on concrete method definition');
                }
                else throw new ParseError('Missing `)` on concrete method definition');
            }
            else throw new ParseError('Missing `(` on concrete method definition');
        }
        else throw new ParseError('Missing method name on concrete method definition');
    }
    else return [null, tokenPos];
}

// traitdef ::= `trait` traitname `{` abs_methoddef* `}`
export const parseTraitDef = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];

    const absMethodList = [];
    var absMdParseResult;
    if (tokenPos < tokenList.length && token.type == 'keyword' && token.data == 'trait') {
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'variable') {
            const traitName = token.data;
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'lBracket') {
                [absMdParseResult, tokenPos] = parseAbsMethodDef(tokenList, tokenPos + 1);
                while (tokenPos < tokenList.length && absMdParseResult != null && absMdParseResult.class == 'AbstractMethodDef') {
                    absMethodList.push(absMdParseResult);
                    [absMdParseResult, tokenPos] = parseAbsMethodDef(tokenList, tokenPos);
                }
                token = tokenList[tokenPos];
                if (tokenPos < tokenList.length && token.type == 'rBracket') {
                    tokenPos++;
                    return [{class:'TraitDef', traitName:traitName, absMethodList:absMethodList}, tokenPos]
                }
                else throw new ParseError('Missing `}` on trait definition');
            }
            else throw new ParseError('Missing `{` on trait definition');
        }
        else throw new ParseError('Missing trait name on trait definition');
    }
    else return [null, tokenPos];
}

export const parseImplDef = (tokenList, tokenPos) => {
    
}

// const test = 'method m1(p1:Int, p2:Int):Int { var1 = p1; var2 = var1 + p2; }';
// const tokens = main(test);
// const [parseRes, pos] = parseConcMethodDef(tokens, 0);
// console.log(util.inspect(parseRes, false, null, true));
// console.log(pos);