import { parseParam } from "./defParser.js";
import parseExp from "./expParser.js";
import main from "../tokenizer/tokenizer.js";

//BOUNDS CHECKING NOTE: FUNCS ALWAYS ASSUME THAT TOKENPOSE IS WITHIN BOUNDS INITIALLY
//TOKENPOS SHOULD END UP POINTING TO NEXT TOKENTOSEE? PROBABLY
export const parseStmt = (tokenList, tokenPos) => {
    //token can be let, var, if, while, break, println, {, return, exp
    if(tokenPos < tokenList.length)
    {
        var parseResult;
        [parseResult, tokenPos] = parseLetStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = parseVarStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = parseIfStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = parseWhileStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = parseBreakStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = printlnStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = blockStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = returnStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = expStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        throw Error('Not a valid statement');
    }
     
    return [null, tokenPos];
}

//`let` param `=` exp `;`
export const parseLetStmt = (tokenList, tokenPos) => {

    var token = tokenList[tokenPos];
    if(tokenPos < tokenList.length && token.type === 'keyword' && token.data === 'let')
    {
        var param;
        [param, tokenPos] = parseParam(tokenList, tokenPos + 1);
        if(param !== null) 
        {
            token = tokenList[tokenPos];
            if( tokenPos < tokenList.length && token.type === 'equals')
            {
                var exp;
                [exp, tokenPos] = parseExp(tokenList, tokenPos + 1);
                if(exp !== null)
                {
                    token = tokenList[tokenPos];
                    if(tokenPos < tokenList.length && token.type === 'semicolon')
                    {
                        return [{class : 'LetStmt', param : param, exp : exp} , tokenPos + 1]
                    }
                    else throw Error('Missing semicolon in let statement');
                }
                else throw Error('Missing expression in let statement ');
            }
            else throw Error('Missing "=" in let statement');
        }
        else throw Error('Missing parameter after let keyword');
    }
    return [null, tokenPos];
}

//var `=` exp `;`
export const parseVarStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(tokenPos < tokenList.length && token.type === 'variable')
    {
        var varName = token.data;
        tokenPos++;
        token = tokenList[tokenPos];
        if(tokenPos < tokenList.length && token.type === 'equals' && tokenPos < tokenList.length)
        {
            var exp;
            [exp, tokenPos] = parseExp(tokenList, tokenPos + 1);
            if(exp !== null)
            {
                if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
                {
                    return [{class : 'VarStmt', varName : varName, exp : exp}, tokenPos + 1];
                } 
                else throw Error('Missing semicolon in var statement');    
            }
            else throw Error('Missing expression in var statement');
        }
        else throw Error('Missing "=" in var statement');
    }
    else return [null, tokenPos];
}

//`if` `(` exp `)` stmt [`else` stmt]
export const parseIfStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(tokenPos < tokenList.length && token.type === 'keyword' && token.data === 'if')
    {
        tokenPos++;
        token = tokenList[tokenPos];
        if(tokenPos < tokenList.length && token.type === 'lParen')
        {
            var condition;
            [condition, tokenPos] = parseExp(tokenList, tokenPos + 1);
            if(condition !== null)
            {
                token = tokenList[tokenPos];
                if(tokenPos < tokenList.length && token.type === 'rParen')
                {
                    var ifBranch;
                    [ifBranch, tokenPos] = parseStmt(tokenList, tokenPos + 1);
                    if(ifBranch !== null)
                    {
                        token = tokenList[tokenPos];
                        //case no else branch
                        if(tokenPos >= tokenList.length || (token.type !== 'keyword' && token.data !== 'else'))
                        {
                            return [{class: 'IfStmt', condition : condition, trueBranch : ifBranch}, tokenPos + 1];
                        }

                        //case where has an else
                        var elseBranch;
                        [elseBranch, tokenPos] = parseStmt(tokenList, tokenPos + 1);
                        if(elseBranch !== null)
                        {
                            return [{class: 'IfElseStmt', condition : condition, trueBranch : ifBranch, falseBranch : elseBranch}, tokenPos + 1];
                        }
                        else throw Error('Else statement body not found');
                    }
                    else throw Error('If statement body not found');
                }
                else throw Error('Missing right paren in if statement');
            }
            else throw Error('Missing if statement condition');
        }
        else throw Error('Missing left paren in if statement');
    }
    return [null, tokenPos];
}

//`while` `(` exp `)` stmt |
export const parseWhileStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if (tokenPos < tokenList.length && token.type === 'keyword' && token.data === 'while')
    {
        tokenPos++;
        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'lParen')
        {
            var condition;
            [condition, tokenPos] = parseExp(tokenList, tokenPos + 1);
            if(condition !== null && tokenPos < tokenList.length)
            {
                if(tokenList[tokenPos].type === 'rParen')
                {
                    var body;
                    [body, tokenPos] = parseStmt(tokenList, tokenPos + 1);
                    if(body !== null)
                    {
                        return [{class : 'WhileStmt', condition : condition, body : body}, tokenPos + 1]
                    }
                    else throw Error('while statement body not found');
                }
                else throw Error('missing right paren in while statement');
            }
            else throw Error('missing condition in while statement');
        }
        else throw Error('missing left paren in while statement');
    }
    return [null, tokenPos];
}

//`break` `;`
export const parseBreakStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(tokenPos < tokenList.length && token.type === 'keyword' && token.data === 'break')
    {
        tokenPos++;
        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
        {
            return [{class : 'break statement'}, tokenPos + 1];
        }
        throw Error('Missing semicolon in break statement');
    }
    return [null, tokenPos];
}

//`println` `(` exp `)`
export const printlnStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if (tokenPos < tokenList.length && token.type === 'keyword' && token.data === 'println')
    {
        tokenPos++;
        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'lParen')
        {
            var exp;
            [exp, tokenPos] = parseExp(tokenList, tokenPos + 1);
            if(exp !== null)
            {
                if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'rParen')
                {
                    return [{class : 'PrintlnStmt', exp : exp}, tokenPos + 1];
                }
                else throw Error('missing right paren in println statement');
            }
            else throw Error('println missing expression');
        }
        else throw Error('missing left paren in println statement');
    }
    return [null, tokenPos];
}

//`{` stmt* `}`
export const blockStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(tokenPos < tokenList.length && token.type === 'lBracket')
    {
        var stmtList = [];
        tokenPos++;
        if(tokenPos < tokenList.length)
        {
            var stmt;
            [stmt, tokenPos] = parseStmt(tokenList, tokenPos);
            while(stmt !== null && tokenPos < tokenList.length)
            {
                stmtList.push(stmt);
                [stmt, tokenPos] = parseStmt(tokenList, tokenPos);
            }

            if(tokenList[tokenPos].type === 'rBracket')
            {
                return [{class : 'BlockStmt', stmtList : stmtList}, tokenPos + 1];
            }
            else throw Error('block statement missing right bracket');
        }
        else throw Error('block statement missing right bracket')
    }
    return [null, tokenPos];
}

//`return` [exp] `;`
export const returnStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(tokenPos < tokenList.length && token.type === 'keyword' && token.data === 'return')
    {
        tokenPos++;
        if(tokenPos < tokenList.length)
        {
            var exp;
            [exp, tokenPos] = parseExp(tokenList, tokenPos);

            if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
            {
                if(exp === null) return [{class : 'ReturnStmt'}, tokenPos + 1];
                return [{class : 'ReturnExpStmt', exp : exp}, tokenPos + 1];
            }
            else throw Error('missing semicolon on return statement');
        }
        else throw Error('missing semicolon on return statement');
    }
    return [null, tokenPos];
}

//exp `;` 
export const expStmt = (tokenList, tokenPos) => {
    var exp;
    [exp, tokenPos] = parseExp(tokenList, tokenPos);
    if(exp !== null)
    {
        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
        {
            return [{class : 'ExpStmt', exp : exp}, tokenPos + 1];
        }
        else throw Error('Missing semicolon on expression statement');
    }
    return [null, tokenPos];
}

const test0 = 'if(1<2) var1 = 1; else var1 = 2;'
const tokens0 = main(test0);
const [parseRes0, pos0] = parseStmt(tokens0, 0);
// console.log(util.inspect(parseRes0, false, null, true));
// console.log(pos0);