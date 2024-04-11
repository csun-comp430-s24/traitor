import parseType from './typeParser.js'
import main from '../tokenizer/tokenizer.js'
import * as util from 'util';

const parseParam = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if (tokenPos >= tokenList.length) return [null, tokenPos];

    var parseResult;
    if (token.type == 'variable') {
        const varName = token.data;
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'colon') {
            tokenPos++;
            [parseResult, tokenPos] = parseType(tokenList, tokenPos);
            if (parseResult != null) {
                return [{class:"Param", varName:varName, type:parseResult}, tokenPos];
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
    return [{class:"CommaParam", list:paramList}]
}

const text = "var1 : (Int, Boolean) => Self, var2 : Boolean";
const tokens = main(text);
const [result, pos] = parseCommaParam(tokens, 0);
console.log(util.inspect(result, false, null, true));
console.log(pos);

const text1 = "whoa : Why, hello : World";
const tokens1 = main(text1);
const [result1, pos1] = parseCommaParam(tokens1, 0);
console.log(util.inspect(result1, false, null, true));
console.log(pos1);
