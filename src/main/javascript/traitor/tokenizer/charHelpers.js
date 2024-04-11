import TokenizerException from "./tokenizeException.js";

const types = new Set(
    ['Int', 'Void', 'Boolean', 'Self']
)

const keywords = new Set(
    ['let', 'if', 'while', 'else', 'break', 'println',
    'return', 'new', 'for',
    'true', 'false', 'self',
    'func', 'impl', 'trait', 'method', 'struct']
    )

// Parsing token as identifier token
const isReserved = (token) => {
    // If token is a type, parse as typeKeyword token
    if (types.has(token)) {
        return 'typeKeyword';
    }
    // If token is a reserved word, parse as keyword token
    if (keywords.has(token)) {
        return 'keyword';
    }
    // Else token is a variable
    return 'variable';
}

// State machine transitions
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
    if (char === '!') {
        return '!';
    }

    return 'single';
}

// Getting type of token
export const getTokenType = (data) => {
    // Checking for multiple character tokens
    if (data.length > 1) {
        // If token is a number parse as int literal token
        if (!isNaN(data[0] - parseFloat(data[0]))) {
            return 'number';
        }
        // If token is of length 2, can only be doubleEquals, rightArrow, or notEquals token
        if (data.length == 2 && data[0] === '=') {
            if (data[1] === '=')
                return 'doubleEquals';
            return 'rightArrow';
        }
        if (data.length == 2 && data[0] === '!' && data[1] === '=') {
            return 'notEquals';
        }
        // If token has multiple characters, check if it is reserved
        return isReserved(data);
    }
    
    // Checking for single character symbols and parsing as respective tokens
    if (data === '+' || data === '-' || data === '*' || data === '/') return "op";
    if (data === '<') return 'lessThan';
    if (data === '=') return 'equals';
    if (data === '(') return 'lParen';
    if (data === ')') return 'rParen';
    if (data === '{') return 'lBracket';
    if (data === '}') return 'rBracket';
    if (data === ',') return 'comma';
    if (data === '.') return 'dot';
    if (data === ':') return 'colon';
    if (data === ';') return 'semicolon';

    // Checking for single letters and parsing as variable tokens
    if (data.toLowerCase() != data.toUpperCase()) 
        return isReserved(data);

    // Checking for single char numbers and parsing as number
    if (!isNaN(data[0] - parseFloat(data[0]))) {
        return 'number';
    }

    // If token could not be found, return null
    return null;

}