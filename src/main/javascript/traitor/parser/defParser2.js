import ParseError from "./parseError.js"
import { parseCommaParam } from "./defParser.js";
import parseType from "./typeParser.js";
import main from "../tokenizer/tokenizer.js"
import * as util from 'util';

const eatToken = (tokenList, tokenPos, expectedType, expectedData, isIdentifier) => {
    const actualToken = tokenList[tokenPos];
    if (tokenPos < tokenList.length && actualToken.type === expectedType && (!isIdentifier ? (actualToken.data === expectedData):(true)))
        return tokenPos;
    else {
        throw new ParseError('Expected `' + expectedData + '` instead Received ' + (actualToken != null ? ('`' + actualToken.data + '`') : 'nothing'));
    }
}

// abs_methoddef ::= `method` var `(` comma_param `)` `:` type `;`
const parseAbsMethodDef = (tokenList, tokenPos) => {
    const firstToken = tokenList[tokenPos];
    var commaParams, type;
    if (tokenPos < tokenList.length && firstToken.type === 'keyword' && firstToken.data === 'method') {
        tokenPos = eatToken(tokenList, tokenPos + 1, 'variable', 'varname', true);
        const varName = tokenList[tokenPos].data;
        tokenPos = eatToken(tokenList, tokenPos + 1, 'lParen', '(', false);

        [commaParams, tokenPos] = parseCommaParam(tokenList, tokenPos + 1);

        tokenPos = eatToken(tokenList, tokenPos, 'rParen', ')', false);
        tokenPos = eatToken(tokenList, tokenPos + 1, 'colon', ':', false);

        [type, tokenPos] = parseType(tokenList, tokenPos + 1);
        if (type != null) {
            tokenPos = eatToken(tokenList, tokenPos, 'semicolon', ';', false);
            return [{class:'AbstractMethodDef', varname:varName, params:commaParams, type:type}, tokenPos + 1]
        }
        else throw new ParseError('Missing type on abstract method definition');
    }
    else return [null, tokenPos];
}

const test = 'method var1 (p1 : Int) : Int;';
const tokens = main(test);
const [res, pos] = parseAbsMethodDef(tokens, 0);
// console.log(util.inspect(res, false, null, true));
// console.log(pos);