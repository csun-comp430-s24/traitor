import { parseImplDef, parseStructDef, parseTraitDef, parseFuncDef } from "./defParser";
import { parseStmt } from "./stmt";

//structdef | traitdef | impldef | funcdef
export const parseProgramItem = (tokenList, tokenPos) => {
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
export const parseProgram = (tokenList) =>
{
    var tokenPos = 0;
    var result = [];

    while(tokenPos < tokenList.length)
    {
        var program_item;
        [program_item, tokenPos] = parseProgramItem(tokenList, tokenPos);
        if(program_item === null) break;
        result.push(program_item);
    }
    while(tokenPos < tokenList.length)
    {
        var stmt;
        [stmt, tokenPos] = parseStmt(tokenList, tokenPos);
        if(stmt === null) break;
        result.push(stmt);
    }

    return result;
}

const main = (tokenList) => {
    return parseProgram(tokenList);
}

export default main;