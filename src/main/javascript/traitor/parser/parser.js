import { parseImplDef, parseStructDef, parseTraitDef, parseFuncDef } from "./defParser.js";
import { parseStmt } from "./stmt.js";
import tokenize from "../tokenizer/tokenizer.js";
import * as util from 'util';

//structdef | traitdef | impldef | funcdef
const parseProgramItem = (tokenList, tokenPos) => {
    var def;
    [def, tokenPos] = parseStructDef(tokenList, tokenPos);
    if(def !== null) return [def, tokenPos];

    [def, tokenPos] = parseTraitDef(tokenList, tokenPos);
    if(def !== null) return [def, tokenPos];

    [def, tokenPos] = parseImplDef(tokenList, tokenPos);
    if(def !== null) return [def, tokenPos];

    [def, tokenPos] = parseFuncDef(tokenList, tokenPos);
    if(def !== null) return [def, tokenPos];

    else return [null, tokenPos];
}

//program_item* stmt*
const parseProgram = (tokenList) =>
{
    var tokenPos = 0;
    var programItems = [], stmts = [];

    while(tokenPos < tokenList.length)
    {
        var program_item;
        [program_item, tokenPos] = parseProgramItem(tokenList, tokenPos);
        if(program_item === null) break;
        programItems.push(program_item);
    }
    // console.log(programItems);
    while(tokenPos < tokenList.length)
    {
        var stmt;
        [stmt, tokenPos] = parseStmt(tokenList, tokenPos);
        // if(stmt === null) break;         stmt is never null, will always run out of tokens or throw error first
        stmts.push(stmt);
    }

    return {class:'Program', programItems:programItems, stmts:stmts};
}

const parse = (tokenList) => {
    return parseProgram(tokenList);
}

export default parse;

/*
const test = 'a3.print();';
const tokens = tokenize(test);
const res = parseProgram(tokens);
console.log(util.inspect(res, false, null, true));
*/