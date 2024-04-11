const parseBuiltIn = (tokenList, tokenPos) => {
    const token = tokenList[tokenPos];
    if (tokenPos >= tokenList.length) return [null, tokenPos];

    if (token.type == 'typeKeyword') {
        const actualType = token.data;
        switch (actualType) {
            case 'Int':
                return [{class:'IntType'}, tokenPos+1];
            case 'Void':
                return [{class:'VoidType'}, tokenPos+1];
            case 'Boolean':
                return [{class:'BooleanType'}, tokenPos+1];
            case 'Self':
                return [{class:'SelfType'}, tokenPos+1];
        }
    }
    else if (token.type == 'variable') {
        return [{class:'StructType', name:token.data}, tokenPos+1];
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

        // No need to check if type object exists in paren because parseFunc only passes to parseParen when there is exactly one type object in the paren
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'rParen') {
            return [{class:'ParenType', value:parseResult}, tokenPos+1];
        }
        else {
            throw Error('Parse Error No Right Paren On ParenType');
        }    
    }
    else return [null, tokenPos];
}

const parseCommaType = (tokenList, tokenPos) => {
    const resultList = [];
    var parseResult;
    [parseResult, tokenPos] = parseType(tokenList, tokenPos);
    while (parseResult != null) {
        resultList.push(parseResult);
        if (tokenPos >= tokenList.length) break;
        if (tokenList[tokenPos].type == 'rParen') break;
        if (tokenList[tokenPos].type == 'comma') {
            tokenPos++;
            [parseResult, tokenPos] = parseType(tokenList, tokenPos);
        }
        else throw Error('Parse Error Missing Comma Between Types');
    }
    return [{class:'CommaType', list:resultList}, tokenPos];
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
                    return [{class:'FuncType', in:inParseResult, out:outParseResult}, tokenPos];
                }
                else throw Error('Parse Error No Exit On FuncType');
            }
            else {
                if (inParseResult.list.length == 1) {
                    return [null, tokenPos - 3];
                }
                else throw Error('Parse Error Missing Right Arrow On FuncType');
            }
        }
        else {
            if (inParseResult.list.length == 1) {
                return [null, tokenPos - 2];
            }
            else throw Error('Parse Error No Right Paren On FuncType');
        }
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