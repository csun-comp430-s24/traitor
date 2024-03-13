import main from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import Token from "../../../../main/javascript/traitor/tokenizer/token.js";
import TokenizerException from "../../../../main/javascript/traitor/tokenizer/tokenizeException.js";

describe('Tokenizer Test', () => {
    it('Parsing dummy string', () => {
        const result = main("some text, to test. : ");
        const expected = [
            new Token('variable', 'some'),
            new Token('variable', 'text'),
            new Token('comma', ','),
            new Token('variable', 'to'),
            new Token('variable', 'test'),
            new Token('dot', '.'),
            new Token('colon', ':')
          ];
        expect(result).toStrictEqual(expected);
    })
    it('Parsing sample traitor code', () => {
        const data = "trait Addable {\n method add(other: Self): Self;\n}\ntrait Printable {\n method print(): Void;\n}\nstruct IntWrapper {\n value: Int\n}\nimpl Addable for Int {\nmethod add(other: Int): Int {\nreturn self + other;\n }\n}";
        const result = main(data);
        const expected = [                                                                                                                                                                             
            new Token('keyword', 'trait'), new Token('variable', 'Addable'), new Token('lBracket', '{'), new Token('keyword', 'method'),
            new Token('variable', 'add'), new Token('lParen', '('), new Token('variable', 'other'), new Token('colon', ':'),
            new Token('typeKeyword', 'Self'), new Token('rParen', ')'), new Token('colon', ':'), new Token('typeKeyword', 'Self'),
            new Token('semicolon', ';'), new Token('rBracket', '}'), new Token('keyword', 'trait'), new Token('variable', 'Printable'),
            new Token('lBracket', '{'), new Token('keyword', 'method'), new Token('variable', 'print'), new Token('lParen', '('),
            new Token('rParen', ')'), new Token('colon', ':'), new Token('typeKeyword', 'Void'), new Token('semicolon', ';'),
            new Token('rBracket', '}'), new Token('keyword', 'struct'), new Token('variable', 'IntWrapper'), new Token('lBracket', '{'),
            new Token('variable', 'value'), new Token('colon', ':'), new Token('typeKeyword', 'Int'), new Token('rBracket', '}'),
            new Token('keyword', 'impl'), new Token('variable', 'Addable'), new Token('keyword', 'for'), new Token('typeKeyword', 'Int'),
            new Token('lBracket', '{'), new Token('keyword', 'method'), new Token('variable', 'add'), new Token('lParen', '('),
            new Token('variable', 'other'), new Token('colon', ':'), new Token('typeKeyword', 'Int'), new Token('rParen', ')'),
            new Token('colon', ':'), new Token('typeKeyword', 'Int'), new Token('lBracket', '{'), new Token('keyword', 'return'),
            new Token('variable', 'self'), new Token('op', '+'), new Token('variable', 'other'), new Token('semicolon', ';'),
            new Token('rBracket', '}'), new Token('rBracket', '}')
          ];
        expect(result).toStrictEqual(expected);
    })
    it('Parsing unacceptable data', () => {
        const data = "$$ \"\" #[]^ @";
        try { 
            const result = main(data);
            console.log(result);
        } catch(err) {
            expect(err).toStrictEqual(new TokenizerException('unacceptable token: $'));
        }
    })
    it('Parsing keywords, integers, and evaluators', () => {
        const data = "let Int x = 49 * 123 >";
        const result = main(data);
        const expected = [                                                                                                                                                                             
            new Token('keyword', 'let'),
            new Token('typeKeyword', 'Int'),
            new Token('variable', 'x'),
            new Token('equals', '='),
            new Token('number', '49'),
            new Token('op', '*'),
            new Token('number', '123'),
            new Token('evaluator', '>')
          ];
        expect(result).toStrictEqual(expected);
    })
});