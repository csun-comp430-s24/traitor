import parseType from './typeParser.js'
import main from '../tokenizer/tokenizer.js'
import * as util from 'util';

const parseParam = (tokenList, tokenPos) => {
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

const parseCommaParam = (tokenList, tokenPos) => {
    const paramList = [];
    var parseResult;
    [parseResult, tokenPos] = parseParam(tokenList, tokenPos);
    while (parseResult != null) {
        paramList.push(parseResult);
        if (tokenPos >= tokenList.length) break;
        if (tokenList[tokenPos].type == 'comma') {
            tokenPos++;
        }
        [parseResult, tokenPos] = parseParam(tokenList, tokenPos);
    }
    return [{class:'CommaParam', list:paramList}, tokenPos]
}

const parseStructDef = (tokenList, tokenPos) => {
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

const text = "var1 : (Int, Boolean) => Self, var2 : Boolean";
const tokens = main(text);
const [result, pos] = parseCommaParam(tokens, 0);
console.log(util.inspect(result, false, null, true));
console.log(pos);

const text1 = "struct myStruct {var1: Int, var2: Int}";
const tokens1 = main(text1);
const [result1, pos1] = parseStructDef(tokens1, 0);
console.log(util.inspect(result1, false, null, true));
console.log(pos1);
