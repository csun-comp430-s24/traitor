import tokenize from './tokenizer/tokenizer.js';
import parse from './parser/parser.js';
import { typecheck } from './typechecker/typechecker.js';

// Check if program is called with the right number of arguments
if (process.argv.length != 3) {
    console.log('Usage: node traitor.js filename.txt');
    process.exit();
}

// Read the text file in args and compile
import * as fs from 'fs';
const filename = process.argv[2]
fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;

    const prog = data.replace(/[\r\n\t]/g, "");
    const tokens = tokenize(prog);
    const parseResult = parse(tokens);
    const vars = typecheck(parseResult);
});