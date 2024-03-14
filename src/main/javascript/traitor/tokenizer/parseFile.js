import { getStateType, getTokenType } from "./charHelpers.js";
import Token from "./token.js";
import TokenizerException from "./tokenizeException.js";

const getToken = (table, file, index, state=1) => {
    // console.log("idx:", index, " fLen:", file.length);
    let iters = 0;
    let tokenStr = "";
    let interVal = file[index++];
    // console.log("state:", state, " interVal:", interVal);
    state = table[state][getStateType(interVal)];
    // console.log("final state:", state);
    while (state) { 
        tokenStr += interVal;
        ++iters;
        
        if (index === file.length) return [tokenStr, iters];
        
        interVal = file[index++];
        state = table[state][getStateType(interVal)];
    }
    
    return [tokenStr, iters];
}

const parseFile = (table, file, index=0) => {

    const tokenList = [];
    while (index < file.length) {

        // first skip white space, we don't want white space tokens
        while(file[index] === ' ' || file[index] === '\n')
        {
            index++;
            if(index === file.length) return tokenList;
        }

        const [tokenStr, iters] = getToken(table, file, index);
        // console.log("tokenStr:", tokenStr);
        if (getTokenType(tokenStr) === null) throw new TokenizerException('unacceptable token: ' + tokenStr); // unaccaptable input
        index += iters; // != 0 ? iters : 1;
        const token = new Token(getTokenType(tokenStr), tokenStr);
        tokenList.push(token);
    }
    return tokenList;
}

export default parseFile;