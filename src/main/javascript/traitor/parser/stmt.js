import { parseParam } from "./defParser.js";
import parseExp from "./expParser.js";
import ParseError from "./parseError.js";
import main from "../tokenizer/tokenizer.js";
import * as util from 'util';

export const parseStmt = (tokenList, tokenPos) => {
    //token can be let, var, if, while, break, println, {, return, exp
    if(tokenPos < tokenList.length)
    {
        var parseResult;

        [parseResult, tokenPos] = parseExpStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

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

        [parseResult, tokenPos] = parsePrintlnStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = parseBlockStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        [parseResult, tokenPos] = parseReturnStmt(tokenList, tokenPos);
        if(parseResult !== null) return [parseResult, tokenPos];

        throw new ParseError('Not a valid statement');
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
                    else throw new ParseError('Missing `;` in let statement');
                }
                else throw new ParseError('Missing expression in let statement');
            }
            else throw new ParseError('Missing `=` in let statement');
        }
        else throw new ParseError('Missing parameter after let keyword');
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
                else throw new ParseError('Missing `;` in var statement');    
            }
            else throw new ParseError('Missing expression in var statement');
        }
        else throw new ParseError('Missing `=` in var statement');
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
                        if(tokenPos >= tokenList.length || (token.type !== 'keyword' || token.data !== 'else'))
                        {
                            return [{class:'IfStmt', condition:condition, trueBranch:ifBranch}, tokenPos];
                        }

                        //case where has an else
                        var elseBranch;
                        [elseBranch, tokenPos] = parseStmt(tokenList, tokenPos + 1);
                        if(elseBranch !== null)
                        {
                            return [{class:'IfElseStmt', condition:condition, trueBranch:ifBranch, falseBranch:elseBranch}, tokenPos];
                        }
                        else throw new ParseError('Else statement body not found');
                    }
                    else throw new ParseError('If statement body not found');
                }
                else throw new ParseError('Missing `)` in if statement');
            }
            else throw new ParseError('Missing if statement condition');
        }
        else throw new ParseError('Missing `(` in if statement');
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
            if(condition !== null)
            {
                if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'rParen')
                {
                    var body;
                    [body, tokenPos] = parseStmt(tokenList, tokenPos + 1);
                    if(body !== null)
                    {
                        return [{class : 'WhileStmt', condition : condition, body : body}, tokenPos]
                    }
                    else throw new ParseError('While statement body not found');
                }
                else throw new ParseError('Missing `)` in while statement');
            }
            else throw new ParseError('Missing condition in while statement');
        }
        else throw new ParseError('Missing `(` in while statement');
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
            return [{class:'BreakStmt'}, tokenPos + 1];
        }
        throw new ParseError('Missing `;` in break statement');
    }
    return [null, tokenPos];
}

//`println` `(` exp `)` `;`
export const parsePrintlnStmt = (tokenList, tokenPos) => {
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
                        tokenPos++;
                        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
                    {
                        return [{class : 'PrintlnStmt', exp : exp}, tokenPos + 1];
                        }
                        else throw new ParseError('Missing `;` in println statement');
                }
                else throw new ParseError('Missing `)` in println statement');
            }
            else throw new ParseError('Missing expression in println statement');
        }
        else throw new ParseError('Missing `(` in println statement');
    }
    return [null, tokenPos];
}

//`{` stmt* `}`
export const parseBlockStmt = (tokenList, tokenPos) => {
    if(tokenList[tokenPos].type === 'lBracket')
    {
        var stmtList = [];
        tokenPos++;

        while(tokenPos < tokenList.length && tokenList[tokenPos].type !== 'rBracket')
        {
            var stmt;
            [stmt, tokenPos] = parseStmt(tokenList, tokenPos);
            stmtList.push(stmt);
            //no null check, parse Stmt throws an error on fail
        }

        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'rBracket')
        {
            return [{class : 'BlockStmt', stmtList : stmtList}, tokenPos + 1];
        }
        else throw new ParseError('Missing `}` on block statement');
    }
    return [null, tokenPos];
}

//`return` [exp] `;`
export const parseReturnStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(token.type === 'keyword' && token.data === 'return')
    {
        tokenPos++;
        if(tokenPos < tokenList.length)
        {
            if(tokenList[tokenPos].type !== 'semicolon')
            {
                var exp;
                [exp, tokenPos] = parseExp(tokenList, tokenPos);
    
                if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
                {
                    return [{class : 'ReturnExpStmt', exp : exp}, tokenPos + 1];
                }
                else throw new ParseError('Missing `;` on return statement');

            }
            else
            {
                return [{class : 'ReturnStmt'}, tokenPos + 1];
            }
        }
        else throw new ParseError('Missing `;` on return statement');
    }
    return [null, tokenPos];
}

//exp `;` 
export const parseExpStmt = (tokenList, tokenPos) => {
    var exp;
    [exp, tokenPos] = parseExp(tokenList, tokenPos);
    if(exp !== null)
    {
        if(tokenPos < tokenList.length && tokenList[tokenPos].type === 'semicolon')
        {
            return [{class : 'ExpStmt', exp : exp}, tokenPos + 1];
        }
        else if (exp.class === 'VarExp') {
            return [null, tokenPos - 1];
        }
        else throw new ParseError('Missing `;` on expression statement');
    }
    return [null, tokenPos];
}

// const test0 = 'while(true) {}'
// const tokens0 = tokenize(test0);
// const [parseRes0, pos0] = parseWhileStmt(tokens0, 0);
// console.log(util.inspect(parseRes0, false, null, true));
//console.log(pos0);