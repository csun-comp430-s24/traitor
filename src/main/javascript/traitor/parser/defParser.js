import parseType from './typeParser.js'
import main from '../tokenizer/tokenizer.js'
import * as util from 'util';

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
            else return [null, tokenPos-2];
        }
        else return [null, tokenPos-1];
    }
    else return [null, tokenPos];
}

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
        }
        else throw Error('Parse Error Missing Comma Between Params');
    }
    return [{class:'CommaParam', list:paramList}, tokenPos]
}

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
                else throw Error('Parse Error Missing `}` on struct definition');
            }
            else throw Error('Parse Error Missing `{` on struct definition');
        }
        else throw Error('Parse Error Missing structname on struct definition');
    }
    else return [null, tokenPos];
}

export const parseMethodDef = (tokenList, tokenPos) => {
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
                            else throw Error('Parse Warning Might Be a Concrete Method Def');    // REPLACE WITH CONCRETE METHOD DEF ONCE STMT PARSING IS DONE
                        }
                        else throw Error('Parse Error Missing type on method definition');
                    }
                    else throw Error('Parse Error Missing `:` on method definition');
                }
                else throw Error('Parse Error Missing `)` on method definition');
            }
            else throw Error('Parse Error Missing `(` on method definition');
        }
        else throw Error('Parse Error Missing method name on method definition');
    }
    else return [null, tokenPos];
}

const text = "method m1 (var1: Int) : Int;";
const tokens = main(text);
const [result, pos] = parseMethodDef(tokens, 0);
console.log(util.inspect(result, false, null, true));
console.log(pos);