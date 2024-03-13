import TokenizerException from "./tokenizeException";

const types = new Set(
    ['Int', 'Void', 'Boolean', 'Self']
)

const keywords = new Set(
    ['let', 'if', 'while', 'else', 'break', 'println',
    'return', 'new', 'for',
    'true', 'false',
    'func', 'impl', 'trait', 'method', 'struct']
    )

const isReserved = (token) => {
    // console.log(token + " " + keywords.has(token));
    if (types.has(token)) {
        return 'typeKeyword';
    }
    if (keywords.has(token)) {
        return 'keyword';
    }
    return 'variable';
}

export const getStateType = (char) => {
    if (char.toLowerCase() != char.toUpperCase()) 
        return "char";
    if (!isNaN(char - parseFloat(char))) 
        return "int";
    if (char === '.') {
        return '.';
    }
    if (char === '=') {
        return '=';
    }
    if (char === '>') {
        return '>';
    }

    return 'single';
}


export const getTokenType = (data) => {
    if (data.length > 1) {
        if (!isNaN(data[0] - parseFloat(data[0]))) {
            return 'number';
        }
        if (data.length == 2 && data[0] === '=') {
            if (data[1] === '=')
                return 'evaluator'
            return 'rightArrow'
        }
        return isReserved(data);
    }
    //if (data === ' ') return 'space'; 
    //I COMMENTED THIS OUT BECAUSE I ADDED CODE TO SKIP WHITE SPACE
    //I DON'T THINK WE SHOULD HAVE WHITE SPACE TOKENS
    //LEMME KNOW IF THIS CAUSES ANY BUGS
    if (data === '+' || data === '-' || data === '*' || data === '/') return "op";
    if (data === '<' || data === '>')
        return 'evaluator';
    if (data === '=') return 'equals';
    if (data === '(') return 'lParen';
    if (data === ')') return 'rParen';
    if (data === '{') return 'lBracket';
    if (data === '}') return 'rBracket';
    if (data === ',') return 'comma';
    if (data === '.') return 'dot';
    if (data === ':') return 'colon';
    if (data === ';') return 'semicolon';

    if (data.toLowerCase() != data.toUpperCase()) 
        return isReserved(data);

    // throw new TokenizerException('getTokenType failed: ' + data)
    // console.log("getTokenType Failed")
    return null;

}