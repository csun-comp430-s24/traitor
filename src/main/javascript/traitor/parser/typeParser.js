const parseBuiltIn = (tokenList, tokenPos) => {
    const token = tokenList[tokenPos];
    if (tokenPos >= tokenList.length) return [null, tokenPos];

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
    else if (token.type == 'lParen' || token.type == 'rParen' || token.type == 'rightArrow' || token.type == 'comma') {
        return [null, tokenPos];
    }
    else throw Error("Parse Error Unknown Type: " + token.data);
}

const parseParenType = (tokenList, tokenPos) => {
    var parseResult;
    var token = tokenList[tokenPos];
    if (tokenPos < tokenList.length && token.type == 'lParen') {
        [parseResult, tokenPos] = parseType(tokenList, tokenPos+1);
        if (tokenPos < tokenList.length && parseResult != null) {
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'rParen') {
                return [{type:'ParenType', value:parseResult}, tokenPos+1];
            }
            else throw Error('Parse Error No Right Paren On ParenType');
        }
        else return [null, tokenPos-1];
    }
    else return [null, tokenPos];
}

const parseCommaType = (tokenList, tokenPos) => {
    const resultList = [];
    var parseResult;
    [parseResult, tokenPos] = parseType(tokenList, tokenPos);
    while (tokenPos < tokenList.length && parseResult != null) {
        resultList.push(parseResult);
        if (tokenList[tokenPos].type == 'comma') {
            tokenPos++;
        }
        [parseResult, tokenPos] = parseType(tokenList, tokenPos);
    }
    return [{type:'CommaType', list:resultList}, tokenPos];
}

const parseFunctionType = (tokenList, tokenPos) => {
    var inParseResult, outParseResult;
    var token = tokenList[tokenPos];
    if (tokenPos < tokenList.length && token.type == 'lParen') {
        tokenPos++;
        [inParseResult, tokenPos] = parseCommaType(tokenList, tokenPos);
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'rParen') {
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'rightArrow') {
                [outParseResult, tokenPos] = parseType(tokenList, tokenPos+1);
                if (outParseResult != null) {
                    return [{type:'FuncType', in:inParseResult, out:outParseResult}, tokenPos];
                }
                else throw Error('Parse Error No Exit On FunctionType');
            }
            else return [null, tokenPos - 3];
        }
        else return [null, tokenPos - 2];
    }
    else return [null, tokenPos];
}

const parseType = (tokenList, tokenPos) => {
    var parseResult;

    [parseResult, tokenPos] = parseBuiltIn(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parseFunctionType(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parseParenType(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    
    else return [null, tokenPos];
}

export default parseType;