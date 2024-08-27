import { types as t } from "@marko/compiler";
import glob from "fast-glob";
import path from "path";

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
    exit(tag: t.NodePath<t.Program>) {
      const globImports = programGlobImports.get(tag);
      if (!globImports) {
        return;
      }

      const { cwd, filename } = tag.hub.file.opts as {
        cwd: string;
        filename: string;
      };
      const dir = path.dirname(filename);
      const seen = new Set();

      for (const [patterns, options] of globImports) {
        const resolvedPatterns = Array.isArray(patterns)
          ? patterns.map((p) => path.resolve(dir, p))
          : path.resolve(dir, patterns);

        const results = glob.globSync(resolvedPatterns, {
          cwd,
          absolute: true,
          dot: !!options.exhaustive,
          ignore: options.exhaustive
            ? []
            : [path.join(cwd, "**/node_modules/**")],
        });

        for (const file of results) {
          if (file.endsWith(".marko") && file !== filename && !seen.has(file)) {
            seen.add(file);
            tag.node.body.push(t.importDeclaration([], t.stringLiteral(file)));
          }
        }
      }
    },
  },
};
