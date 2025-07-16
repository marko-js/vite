import { types as t } from "@marko/compiler";
import glob from "fast-glob";
import path from "path";
import { relativeImportPath } from "relative-import-path";

type GlobArgs = [string | string[], { eager?: boolean; exhaustive?: boolean }];

const programGlobImports = new WeakMap<t.NodePath<t.Program>, GlobArgs[]>();

export default {
  MetaProperty(tag: t.NodePath<t.MetaProperty>) {
    const memberExpression = tag.parentPath;
    if (
      memberExpression.node.type === "MemberExpression" &&
      memberExpression.node.property.type === "Identifier" &&
      memberExpression.node.property.name === "glob"
    ) {
      const callExpression = memberExpression.parentPath;
      if (callExpression?.node.type === "CallExpression") {
        const args = (
          callExpression.get("arguments" as any) as t.NodePath<t.Expression>[]
        ).map((arg) => arg.evaluate().value) as GlobArgs;
        if (args[1]?.eager) {
          const program = tag.hub.file.path;
          const existing = programGlobImports.get(program);
          if (!existing) {
            programGlobImports.set(program, [args]);
          } else {
            existing.push(args);
          }
        }
      }
    }
  },
  Program: {
    exit(program: t.NodePath<t.Program>) {
      const globImports = programGlobImports.get(program);
      if (!globImports) {
        return;
      }

      const { cwd, filename } = program.hub.file.opts as {
        cwd: string;
        filename: string;
      };
      const dir = path.dirname(filename);
      const seen = new Set();

      for (const [patterns, options] of globImports) {
        const results = glob.globSync(patterns, {
          cwd: dir,
          absolute: true,
          dot: !!options.exhaustive,
          ignore: options.exhaustive
            ? []
            : [path.join(cwd, "**/node_modules/**")],
        });

        for (const file of results) {
          if (file.endsWith(".marko") && file !== filename && !seen.has(file)) {
            seen.add(file);
            program.node.body.push(
              t.importDeclaration(
                [],
                t.stringLiteral(relativeImportPath(filename, file)),
              ),
            );
          }
        }
      }
    },
  },
};
