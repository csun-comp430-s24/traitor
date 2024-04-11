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
        default:
            break;
    }

    throw Error('Parse Error Expected Exp, Received: ' + token.data);
}

const parsePrimaryExp = (tokenList, tokenPos) => {
    var parseResult;

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
                leftResult = {class:'BinExp', op:token.data, left:leftResult, right:rightResult};
                token = tokenList[tokenPos];
            }
            else throw Error('Parse Error Missing variable on Dot Expression');
        }
        return [leftResult, tokenPos];
    }
    else return [null, tokenPos];
}

const parseExp = (tokenList, tokenPos) => {
    return [null, tokenPos];
}

const test = 'hello.world * 2 / 4';
const tokens = main(test);
const [parseRes, pos] = parseMultExp(tokens, 0);
console.log(util.inspect(parseRes, false, null, true));
console.log(pos);