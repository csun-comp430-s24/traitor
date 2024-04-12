import { parseParam } from "./defParser";
import parseExp from "./expParser";

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

        throw Error('Not a valid statement');
    }
     
    return [null, tokenPos];
}

//`let` param `=` exp `;`
export const parseLetStmt = (tokenList, tokenPos) => {

    var token = tokenList[tokenPos];
    if(token.type === 'keyword' && token.data === 'let')
    {
        tokenPos++;
        if(tokenPos < tokenList.length)
        {
            var param;
            [param, tokenPos] = parseParam(tokenList, tokenPos);
            if(param === null) throw Error('Missing parameter after let keyword');

            if(tokenPos < tokenList.length)
            {
                token = tokenList[tokenPos];
                if(token.type !== 'equals') throw Error('Missing "=" in let statement');

                tokenPos++;
                if(tokenPos < tokenList.length)
                {
                    var exp;
                    [exp, tokenPos] = parseExp(tokenList, tokenPos);
                    if(exp === null) throw Error('Missing expression in let statement ')

                    if(tokenPos < tokenList.length)
                    {
                        if(tokenList[tokenPos] !== ';') throw Error('Missing semicolon in let statement');
                        return [{class : 'LetStmt', param : param, exp : exp} , tokenPos + 1]
                    }
                }
            }
        }
    }

    return [null, tokenPos];
}

//var `=` exp `;`
export const parseVarStmt = (tokenList, tokenPos) => {
    
    var token = tokenList[tokenPos];
    if(token.type === 'variable')
    {
        var varName = token.data;

        tokenPos++;
        if(tokenPos < tokenList.length)
        {
            token = tokenList[token];
            if(token.type !== 'equals') throw Error('Missing "=" in var statement');

            tokenPos++;
            if(tokenPos < tokenList.length)
            {
                var exp;
                [exp, tokenPos] = parseExp(tokenList, tokenPos);
                if(exp === null) throw Error('Missing expression in var statement');

                if(tokenPos < tokenList.length)
                {
                    if(tokenList[tokenPos].type !== 'semicolon') throw Error('Missing semicolon in var statement');

                    return [{class : 'VarStmt', varName : varName, exp : exp}, tokenPos + 1];
                }
            }
        }
    }
    return [null, tokenPos];
}

//`if` `(` exp `)` stmt [`else` stmt]
export const parseIfStmt = (tokenList, tokenPos) => {
    var token = tokenList[tokenPos];
    if(token.type === 'keyword' && token.data === 'if')
    {
        tokenPos++;
        if(tokenPos < tokenList.length)
        {
            token = tokenList[tokenPos];
            if(token.type !== 'lParen') throw Error('Missing left paren in if statement');

            tokenPos++;
            if(tokenPos < tokenList.length)
            {
                var condition;
                [condition, tokenPos] = parseExp(tokenList, tokenPos);
                if(condition === null) throw Error('Missing if statement condition');
    
                if(tokenPos < tokenList.length)
                {
                    token = tokenList[tokenPos];
                    if(token.type !== 'rParen') throw Error('Missing right paren in if statement');

                    tokenPos++;
                    if(tokenPos < tokenList.length)
                    {
                        var ifBranch;
                        [ifBranch, tokenPos] = parseStmt(tokenList, tokenPos);
                        if(ifBranch === null) throw Error('If statement body not found');

                        if(tokenPos < tokenList.length)
                        {
                            token = tokenList[tokenPos];
                            //case no else branch
                            if(token.type !== 'keyword' || token.data !== 'else')
                            {
                                return [{class: 'IfStmt', condition : condition, trueBranch : ifBranch}, tokenPos + 1];
                            }

                            //case where has an else
                            tokenPos++;
                            if(tokenPos < tokenList.length)
                            {
                                var elseBranch;
                                [elseBranch, tokenPos] = parseStmt(tokenList, tokenPos);
                                if(elseBranch === null) throw Error('Else statement body not found');

                                return [{class: 'IfElseStmt', condition : condition, trueBranch : ifBranch, falseBranch : elseBranch}, tokenPos + 1];
                            }
                        }
                    }
                }
            }
            
        }
    }
    
    return [null, tokenPos];
}