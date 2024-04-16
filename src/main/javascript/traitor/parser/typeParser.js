import ParseError from "./parseError.js";

// type ::= `Int` | `Void` | `Boolean` | `Self` | structname
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
        return [{class:'StructType', structName:token.data}, tokenPos+1];
    }
    else if (token.type == 'lParen' || token.type == 'rParen' || token.type == 'rightArrow' || token.type == 'comma') {
        return [null, tokenPos];
    }
    else throw new ParseError("Unknown Type: " + token.data);
}

// type ::= `(` type `)`
const parseParenType = (tokenList, tokenPos) => {
    var parseResult;
    var token = tokenList[tokenPos];
    if (tokenPos < tokenList.length && token.type == 'lParen') {
        [parseResult, tokenPos] = parseType(tokenList, tokenPos+1);

        // No need to check if type object exists in paren because parseFunc only passes to parseParen when there is exactly one type object in the paren
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'rParen') {
            return [{class:'ParenType', type:parseResult}, tokenPos+1];
        }
        else {
            throw new ParseError('No Right Paren On ParenType');
        }    
    }
    else return [null, tokenPos];
}

// comma_type ::= [type (`,` type)*]
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
        else throw new ParseError('Missing Comma Between Types');
    }
    return [{class:'CommaType', list:resultList}, tokenPos];
}

// type ::= `(` comma_type `)` `=>` type
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
                    return [{class:'FuncType', paramTypes:inParseResult, outputType:outParseResult}, tokenPos];
                }
                else throw new ParseError('No Exit On FuncType');
            }
            else {
                if (inParseResult.list.length == 1) {
                    return [null, tokenPos - 3];
                }
                else throw new ParseError('Missing Right Arrow On FuncType');
            }
        }
        else {
            if (inParseResult.list.length == 1) {
                return [null, tokenPos - 2];
            }
            else throw new ParseError('No Right Paren On FuncType');
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