import { parse as jsonBigIntParse, stringify as jsonBigIntStringify, } from "json-bigint";
class Parser {
    static async parseJSON(response, isRequest = true) {
        const text = isRequest ? await response.text() : response;
        try {
            return jsonBigIntParse(text);
        }
        catch {
            return text;
        }
    }
    static stringify(input) {
        return jsonBigIntStringify(input);
    }
}
export default Parser;
//# sourceMappingURL=parser.js.map