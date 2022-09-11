import { formSchema } from "./formSchema";
import { initialFields } from "./presetStatements";

describe("formSchema", () => {
  it("rejects empty values", () => {
    expect(() => {
      formSchema.parse({
        ...initialFields(),
        for: "",
        delegateStatement: undefined,
        topIssues: null,
      });
    }).toThrowErrorMatchingInlineSnapshot(`
      "[
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "string",
          "path": [
            "for"
          ],
          "message": "Expected string, received string"
        },
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "undefined",
          "path": [
            "delegateStatement"
          ],
          "message": "Required"
        },
        {
          "code": "invalid_type",
          "expected": "array",
          "received": "null",
          "path": [
            "topIssues"
          ],
          "message": "Expected array, received null"
        }
      ]"
    `);
  });
});
