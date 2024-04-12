import ParseError from './parseError.js';
import main from '../tokenizer/tokenizer.js'
import * as util from 'util';

// primary_exp ::= i | var | `true` | `false` | `self`
const parsePrimarySingle = (tokenList, tokenPos) => {
    if (tokenPos >= tokenList.length) return [null, tokenPos];

    const token = tokenList[tokenPos];
    const tokenType = token.type;
    switch (tokenType) {
        case 'number':
            return [{class:'IntLitExp', value:parseInt(token.data)}, tokenPos + 1];
        case 'variable':
            return [{class:'VarExp', name:token.data}, tokenPos + 1];
        case 'keyword':
            if (token.data == 'true') {
                return [{class:'TrueExp'}, tokenPos + 1];
            }
            else if (token.data == 'false') {
                return [{class:'FalseExp'}, tokenPos + 1];
            }
            else if (token.data == 'self') {
                return [{class:'SelfExp'}, tokenPos + 1];
            }
        case 'rParen':
            return [null, tokenPos];
        default:
            break;
    }

    throw new ParseError('Expected Expression, Received: ' + token.data);
}

// primary_exp ::= `(` exp `)`
const parsePrimaryParen = (tokenList, tokenPos) => {
    var expResult;

    var token = tokenList[tokenPos];
    if (tokenPos < tokenList.length && token.type == 'lParen') {
        [expResult, tokenPos] = parseExp(tokenList, tokenPos + 1);
        if (expResult != null) {
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'rParen') {
                tokenPos++;
                return [{class:'ParenExp', exp:expResult}, tokenPos];
            }
            else throw new ParseError('Missing `)` In Parenthesized Expression');
        }
        else throw new ParseError('Missing Expression In Parenthesized Expression');
    }
    else return [null, tokenPos];
}

// struct_actual_param ::= var `:` exp
const parseStructActualParam = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];

    var expResult;
    if (tokenPos < tokenList.length && token.type == 'variable') {
        const varName = token.data;
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'colon') {
            [expResult, tokenPos] = parseExp(tokenList, tokenPos + 1);
            if (expResult != null) {
                return [{class:'StructParam', varName:varName, exp:expResult}, tokenPos];
            }
            else throw new ParseError("Missing Expression on Struct Param");
        }
        else throw new ParseError("Missing `:` on Struct Param");
    }
    else return [null, tokenPos];
}

// struct_actual_params ::= [struct_actual_param (`,` struct_actual_param)*]
const parseStructActualParams = (tokenList, tokenPos) => {
    const paramList = [];
    var paramResult;
    [paramResult, tokenPos] = parseStructActualParam(tokenList, tokenPos);
    while (paramResult != null) {
        paramList.push(paramResult);
        if (tokenPos >= tokenList.length) break;
        if (tokenList[tokenPos].type == 'rBracket') break;
        if (tokenList[tokenPos].type == 'comma') {
            tokenPos++;
            [paramResult, tokenPos] = parseStructActualParam(tokenList, tokenPos);
        }
        else throw new ParseError('Missing Comma Between Params');
    }
    return [{class:'StructParams', list:paramList}, tokenPos];
}

// primary_exp ::= `new` structname `{` struct_actual_params `}`
const parseNewStructInstance = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    var structParams;

    if (tokenPos < tokenList.length && token.type == 'keyword' && token.data == 'new') {
        tokenPos++;
        token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'variable') {
            const structName = token.data;
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'lBracket') {
                [structParams, tokenPos] = parseStructActualParams(tokenList, tokenPos + 1);
                token = tokenList[tokenPos];
                if (tokenPos < tokenList.length && token.type == 'rBracket') {
                    tokenPos++;
                    return [{class:'NewStructExp', structName:structName, params:structParams}, tokenPos]
                }
                else throw new ParseError('Missing `}` on Struct Instantiation');
            }
            else throw new ParseError('Missing `{` on Struct Instantiation');
        }
        else throw new ParseError('Missing Struct Name on Struct Instantiation');
    }
    else return [null, tokenPos]
}

// primary_exp ::= i | var | `true` | `false` | `self` | `(` exp `)` | `new` structname `{` struct_actual_params `}`
const parsePrimaryExp = (tokenList, tokenPos) => {
    var parseResult;
    
    [parseResult, tokenPos] = parsePrimaryParen(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parseNewStructInstance(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parsePrimarySingle(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    else return [null, tokenPos];
}

// dot_exp ::= primary_exp (`.` var)*
const parseDotExp = (tokenList, tokenPos) => {
    var primaryResult;
    [primaryResult, tokenPos] = parsePrimaryExp(tokenList, tokenPos);
    
    if (primaryResult != null) {
        var token = tokenList[tokenPos];
        while (tokenPos < tokenList.length && token.type == 'dot') {
            tokenPos++;
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'variable') {
                const varName = token.data;
                primaryResult = {class:'DotExp', primary:primaryResult, varName:varName};
                tokenPos++;
                token = tokenList[tokenPos];
            }
            else throw new ParseError('Missing variable on Dot Expression');
        }
        return [primaryResult, tokenPos];
    }
    else return [null, tokenPos];
}

// comma_exp ::= [exp (`,` exp)*]
const parseCommaExp = (tokenList, tokenPos) => {
    const resultList = [];
    var parseResult;
    [parseResult, tokenPos] = parseExp(tokenList, tokenPos);
    while (parseResult != null) {
        resultList.push(parseResult);
        if (tokenPos >= tokenList.length) break;
        if (tokenList[tokenPos].type == 'rParen') break;
        if (tokenList[tokenPos].type == 'comma') {
            tokenPos++;
            [parseResult, tokenPos] = parseExp(tokenList, tokenPos);
        }
        else throw new ParseError('Missing Comma Between Expressions');
    }
    return [{class:'CommaExp', list:resultList}, tokenPos];
}

// call_exp ::= dot_exp (`(` comma_exp `)`)*
const parseCallExp = (tokenList, tokenPos) => {
    var dotResult;
    [dotResult, tokenPos] = parseDotExp(tokenList, tokenPos);
    
    if (dotResult != null) {
        var token = tokenList[tokenPos];
        while (tokenPos < tokenList.length && token.type == 'lParen') {
            var commaResult;
            [commaResult, tokenPos] = parseCommaExp(tokenList, tokenPos + 1);
            token = tokenList[tokenPos];
            if (tokenPos < tokenList.length && token.type == 'rParen') {
                dotResult = {class:'CallExp', call:dotResult, params:commaResult};
                tokenPos++;
                token = tokenList[tokenPos];
            }
            else throw new ParseError('Missing `)` on Call Expression');
        }
        return [dotResult, tokenPos];
    }
    else return [null, tokenPos];
}

// mult_exp ::= call_exp ((`*` | `/`) call_exp)*
const parseMultExp = (tokenList, tokenPos) => {
    var leftResult;
    [leftResult, tokenPos] = parseCallExp(tokenList, tokenPos);

    if (leftResult != null) {
        var token = tokenList[tokenPos];
        while (tokenPos < tokenList.length && token.type == 'op' && (token.data == '*' || token.data == '/')) {
            var rightResult;
            [rightResult, tokenPos] = parseCallExp(tokenList, tokenPos + 1);
            if (rightResult != null) {
                leftResult = {class:'BinOpExp', op:token.data, left:leftResult, right:rightResult};
                token = tokenList[tokenPos];
            }
            else throw new ParseError('Missing Value on BinOp Expression');
        }
        return [leftResult, tokenPos];
    }
    else return [null, tokenPos];
}

// add_exp ::= mult_exp ((`+` | `-`) mult_exp)*
const parseAddExp = (tokenList, tokenPos) => {
    var leftResult;
    [leftResult, tokenPos] = parseMultExp(tokenList, tokenPos);

    if (leftResult != null) {
        var token = tokenList[tokenPos];
        while (tokenPos < tokenList.length && token.type == 'op' && (token.data == '+' || token.data == '-')) {
            var rightResult;
            [rightResult, tokenPos] = parseMultExp(tokenList, tokenPos + 1);
            if (rightResult != null) {
                leftResult = {class:'BinOpExp', op:token.data, left:leftResult, right:rightResult};
                token = tokenList[tokenPos];
            }
            else throw new ParseError('Missing Value on BinOp Expression');
        }
        return [leftResult, tokenPos];
    }
    else return [null, tokenPos];
}

// less_than_exp ::= add_exp [`<` add_exp]
const parseLessThanExp = (tokenList, tokenPos) => {
    var addResult;
    [addResult, tokenPos] = parseAddExp(tokenList, tokenPos);
    
    if (addResult != null) {
        var token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'lessThan') {
            var rightResult;
            [rightResult, tokenPos] = parseAddExp(tokenList, tokenPos + 1);
            if (rightResult != null) {
                addResult = {class:'LessThanExp', left:addResult, right:rightResult};
            }
            else throw new ParseError('Missing Value on LessThan Expression');
        }
        return [addResult, tokenPos];
    }
    else return [null, tokenPos];
}

// equals_exp ::= less_than_exp [(`==` | `!=`) less_than_exp]
const parseEqualsExp = (tokenList, tokenPos) => {
    var lessThanResult;
    [lessThanResult, tokenPos] = parseLessThanExp(tokenList, tokenPos);
    
    if (lessThanResult != null) {
        var token = tokenList[tokenPos];
        if (tokenPos < tokenList.length && token.type == 'doubleEquals') {
            var rightResult;
            [rightResult, tokenPos] = parseLessThanExp(tokenList, tokenPos + 1);
            if (rightResult != null) {
                lessThanResult = {class:'DoubleEqualsExp', left:lessThanResult, right:rightResult};
            }
            else throw new ParseError('Missing Value on DoubleEquals Expression');
        }
        else if (tokenPos < tokenList.length && token.type == 'notEquals') {
            var rightResult;
            [rightResult, tokenPos] = parseLessThanExp(tokenList, tokenPos + 1);
            if (rightResult != null) {
                lessThanResult = {class:'NotEqualsExp', left:lessThanResult, right:rightResult};
            }
            else throw new ParseError('Missing Value on NotEquals Expression');
        }
        return [lessThanResult, tokenPos];
    }
    else return [null, tokenPos];
}

// exp ::= equals_exp
const parseExp = (tokenList, tokenPos) => {
    var equalsResult;
    [equalsResult, tokenPos] = parseEqualsExp(tokenList, tokenPos);
    
    if (equalsResult != null) {
        return [equalsResult, tokenPos];
    }
    else return [null, tokenPos];
}

export default parseExp;