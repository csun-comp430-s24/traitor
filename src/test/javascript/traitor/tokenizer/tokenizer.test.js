import main from "../../../../main/javascript/traitor/tokenizer/tokenizer.js";
import Token from "../../../../main/javascript/traitor/tokenizer/token.js";

describe('Tokenizer Test', () => {
    it('Parsing dummy string', () => {
        var result = main();
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
});