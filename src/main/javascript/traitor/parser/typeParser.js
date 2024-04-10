import main from "../tokenizer/tokenizer.js";
import * as util from 'util';

const parseBuiltIn = (tokenList, tokenPos) => {
    const token = tokenList[tokenPos];
    if (token.type == 'typeKeyword') {
        const actualType = token.data;
        switch (actualType) {
            case 'Int':
                return [{type:'IntType'}, tokenPos+1];
            case 'Void':
                return [{type:'VoidType'}, tokenPos+1];
            case 'Boolean':
                return [{type:'BooleanType'}, tokenPos+1];
            case 'Self':
                return [{type:'SelfType'}, tokenPos+1];
        }
    }
    else if (token.type == 'variable') {
        return [{type:'StructType', name:token.data}, tokenPos+1];
    }
    else return [null, tokenPos];
}

const parseParenType = (tokenList, tokenPos) => {
    var parseResult;
    var token = tokenList[tokenPos];
    if (token.type == 'lParen') {
        [parseResult, tokenPos] = parseType(tokenList, tokenPos+1);
        if (parseResult != null) {
            token = tokenList[tokenPos];
            if (token.type == 'rParen') {
                return [{type:'ParenType', value:parseResult}, tokenPos+1];
            }
            else throw Error('Parse Error');
        }
        else return [null, tokenPos-1];
    }
    else return [null, tokenPos];
}

const parseFunctionType = (tokenList, tokenPos) => {
    var parseResult;
    var token = tokenList[tokenPos];
    if (token.type == 'lParen') {
        tokenPos++;
        token = tokenList[tokenPos];
        if (token.type == 'rParen') {
            tokenPos++;
            token = tokenList[tokenPos];
            if (token.type == 'rightArrow') {
                [parseResult, tokenPos] = parseType(tokenList, tokenPos+1);
                if (parseResult != null) {
                    return [{type:'FuncType', out:parseResult}, tokenPos];
                }
            }
            else throw Error('Parse Error');
        }
        else throw Error('Parse Error');
    }
    else return [null, tokenPos];
}

const parseType = (tokenList, tokenPos) => {
    var parseResult;

    if (tokenList[tokenPos] == null) throw Error('Parse Error');

    [parseResult, tokenPos] = parseBuiltIn(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parseParenType(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parseFunctionType(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    else return [null, tokenPos];
}

// TESTING CODE
const test = "IntWrapper Void Boolean Self (Int) () => () => (Int)";
const tokens = main(test);
var parseResult;
var pos = 0;
while (pos < tokens.length) {
    [parseResult, pos] = parseType(tokens, pos);
    console.log(util.inspect(parseResult, false, null, true))
}
