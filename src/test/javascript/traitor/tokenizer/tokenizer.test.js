import main from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import Token from "../../../../main/javascript/traitor/tokenizer/token.js";

describe('Tokenizer Test', () => {
    it('Parsing dummy string', () => {
        var result = main("some text, to test. : ");
        var expected = [
            new Token('variable', 'some'),
            new Token('space', ' '),
            new Token('variable', 'text'),
            new Token('comma', ','),
            new Token('space', ' '),
            new Token('variable', 'to'),
            new Token('space', ' '),
            new Token('variable', 'test'),
            new Token('dot', '.'),
            new Token('space', ' '),
            new Token('colon', ':'),
            new Token('space', ' ')
          ];
        console.log(expected);
        expect(result).toStrictEqual(expected);
    })
    it('Parsing sample traitor code', () => {
        var result = main("trait Addable {\n method add(other: Self): Self;\n}\ntrait Printable {\n method print(): Void;\n}\nstruct IntWrapper {\n value: Int\n}\nimpl Addable for Int {\nmethod add(other: Int): Int {\nreturn self + other;\n }\n}");
        var expected = [];
        console.log(result);
        // expect(result).toStrictEqual(expected);
    })
    it('Parsing unacceptable data', () => {
        var result = main("$$ \"\" #[]^ @");
        var expected = [];
        console.log(result);
        // expect(result).toStrictEqual(expected);
    })
});