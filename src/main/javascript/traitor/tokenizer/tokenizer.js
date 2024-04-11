import Token from "./token.js";
import parseFile from "./parseFile.js";

/*
    Symbols List

    number
    variable
    keyword
    typeKeyword ? not sure if necessary
    space
    op (+, -, *, /)
    evaluator (==, <, >=)
    equals
    lParen
    rParen
    comma
    dot
    colon
    semicolon
*/


/*
    States
    0: [[char, 1], [int, 2], [=, 3]]
    1: [[char, 1], [int, 1]]
    2: [[int, 2], [., 5]]
    3: [[=, 6], [>, 7]]
    5: [[int, 5]] 


    ending in state 1 -> either variable or reserved word
    state 2 -> int
    state 69 -> single parsed char
    state 5 -> double
    state 7 -> ==
    state 8 -> =>
    state 10 -> !=
*/
const getTable = () => {
    const table = {}

    table[1] = {};
    table[2] = {};
    table[3] = {};
    table[4] = {};
    table[5] = {};
    table[6] = {};
    table[7] = {};
    table[8] = {};
    table[9] = {};
    table[10] = {};
    table[69] = {};

    table[1]['char'] = 2;
    table[1]['int'] = 3;
    table[1]['.'] = 4;
    table[1]['='] = 5;
    table[1]['!'] = 9;
    table[2]['char'] = 2;
    table[2]['int'] = 2;
    table[3]['int'] = 3;
    // table[3]['.'] = 6;
    table[5]['='] = 7;
    table[5]['>'] = 8;
    // table[6]['int'] = 6;
    table[9]['='] = 10;

    table[1]['single'] = 69;

    return table;
}

const main = (text) => {
    const table = getTable();
    const file = text; // to be set to contents of code to be parsed
    return parseFile(table, file);
}

// console.log(main("some text, to test. : "));

export default main;