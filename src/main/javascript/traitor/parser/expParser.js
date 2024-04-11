import main from '../tokenizer/tokenizer.js'
import * as util from 'util';

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
            else break;
        case 'rParen':
            return [null, tokenPos];
        case 'rBracket':
            return [null, tokenPos];
        default:
            break;
    }

    throw Error('Parse Error Expected Expression, Received: ' + token.data);
}

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
            else throw Error('Parse Error Missing `)` In Parenthesized Expression');
        }
        else throw Error('Parse Error Missing Expression In Parenthesized Expression');
    }
    else return [null, tokenPos];
}

const parsePrimaryExp = (tokenList, tokenPos) => {
    var parseResult;
    
    [parseResult, tokenPos] = parsePrimaryParen(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    [parseResult, tokenPos] = parsePrimarySingle(tokenList, tokenPos);
    if (parseResult != null) {
        return [parseResult, tokenPos];
    }
    else return [null, tokenPos];
}

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
            else throw Error('Parse Error Missing variable on Dot Expression');
        }
        return [primaryResult, tokenPos];
    }
    else return [null, tokenPos];
}

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
        else throw Error('Parse Error Missing Comma Between Expressions');
    }
    return [{class:'CommaExp', list:resultList}, tokenPos];
}

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
            else throw Error('Parse Error Missing `)` on Call Expression');
        }
        return [dotResult, tokenPos];
    }
    else return [null, tokenPos];
}

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
            else throw Error('Parse Error Missing Value on BinOp Expression');
        }
        return [leftResult, tokenPos];
    }
    else return [null, tokenPos];
}

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
            else throw Error('Parse Error Missing Value on BinOp Expression');
        }
        return [leftResult, tokenPos];
    }
    else return [null, tokenPos];
}

const parseLessThanExp = (tokenList, tokenPos) => {
    var addResult;
    [addResult, tokenPos] = parseAddExp(tokenList, tokenPos);
    
    if (addResult != null) {
        return [addResult, tokenPos];
    }
    else return [null, tokenPos];
}

const parseEqualsExp = (tokenList, tokenPos) => {
    var lessThanResult;
    [lessThanResult, tokenPos] = parseLessThanExp(tokenList, tokenPos);
    
    if (lessThanResult != null) {
        return [lessThanResult, tokenPos];
    }
    else return [null, tokenPos];
}

const parseExp = (tokenList, tokenPos) => {
    var equalsResult;
    [equalsResult, tokenPos] = parseEqualsExp(tokenList, tokenPos);
    
    if (equalsResult != null) {
        return [equalsResult, tokenPos];
    }
    else return [null, tokenPos];
}

export default parseExp;

const test = '(1 + 2) * 3';
const tokens = main(test);
const [parseRes, pos] = parseExp(tokens, 0);
console.log(util.inspect(parseRes, false, null, true));
console.log(pos);