import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import * as path from "path";

type Options = {
  sharedPath: string;
};

export = {
  rules: {
    "restrict-imports-from-shared": ESLintUtils.RuleCreator.withoutDocs({
      create(context) {
        if (context.options.length !== 1) {
          throw new Error("invalid options");
        }

        const options: Options = context.options[0];
        const projectDirectory = context.getCwd?.();
        if (!projectDirectory) {
          throw new Error("projectDirectory not known");
        }

        const sharedPath = path.resolve(projectDirectory, options.sharedPath);

        return {
          ImportDeclaration(node) {
            if (!isRelativeImport(node)) {
              return;
            }

            const filePath = context.getFilename();
            if (!filePath.startsWith(sharedPath)) {
              return;
            }

            const importPath = node.source.value;
            const absoluteImportPath = path.resolve(
              path.dirname(filePath),
              importPath
            );

            if (absoluteImportPath.startsWith(sharedPath)) {
              return;
            }

            context.report({
              node,
              messageId: "noImportsFromOutsideShared",
            });
          },
        };
      },
      meta: {
        messages: {
          noImportsFromOutsideShared: `Files in the shared folder should not import files outside of the shared folder.`,
        },
        type: "problem",
        schema: [
          {
            type: "object",
            properties: {
              sharedPath: {
                type: "string",
              },
            },
          },
        ],
      },
      defaultOptions: [],
    }),
  },
};

function isRelativeImport(node: TSESTree.ImportDeclaration) {
  return node.source.value.startsWith(".");
}
