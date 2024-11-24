import type { PluginObj } from "@babel/core";
import * as t from "@babel/types";

import { isCJSModule, resolve } from "./resolve";

/**
 * This plugin is designed to transform imports within Marko files to interop between ESM and CJS.
 * In Node, ESM files cannot reliably use named imports and default imports from CJS files.
 * Additionally, modules which are transpiled from ESM to CJS will use a `__esModule` property to
 * signal that the consuming ESM code should treat `exports.default` as the default import.
 * This plugin only modifies imports it determined to be for CJS modules
 *
 * Examples
 *   1. Source: ```import { bar as baz } from 'foo';```
 *      Becomes:```
 *        import _foo from 'foo';
 *        const { bar: baz } = _foo
 *      ```
 *
 *   2. Source:  ```import myFoo from 'foo';```
 *      Becomes: ```
 *        import * as _myFoo from 'foo';
 *        const myFoo = _myFoo?.__esModule ? _myFoo.default : _myFoo;
 *      ```
 *
 *   3. Source:  ```import foo, * as nsFoo from 'foo';```
 *      Becomes: ```
 *        import nsFoo from 'foo';
 *        const myFoo = nsFoo?.__esModule ? nsFoo.default : nsFoo
 *      ```
 */
export default function plugin(options: {
  extensions: string[];
  conditions: string[];
  filter?: (path: string) => boolean;
}): PluginObj {
  return {
    name: "marko-import-interop",
    visitor: {
      ImportDeclaration(path) {
        // Skip side-effect only, relative, and marko imports
        if (
          !path.node.specifiers.length ||
          /\.(?:mjs|marko)$|\?/.test(path.node.source.value) ||
          options.filter?.(path.node.source.value) === false
        ) {
          return;
        }

        try {
          const resolved = resolve(
            path.node.source.value,
            (path.hub as any).file.opts.filename,
            options.extensions,
            options.conditions,
          );
          if (!/\.c?js$/.test(resolved) || !isCJSModule(resolved)) {
            return;
          }
        } catch (_) {
          return;
        }

        let namespaceId: t.Identifier | undefined;
        let defaultImportId: t.Identifier | undefined;
        let imports: { name: string; alias: string }[] | undefined;

        for (const s of path.node.specifiers) {
          if (t.isImportSpecifier(s)) {
            (imports ||= []).push({
              name: t.isStringLiteral(s.imported)
                ? s.imported.value
                : s.imported.name,
              alias: s.local.name,
            });
          } else if (t.isImportDefaultSpecifier(s)) {
            defaultImportId = s.local;
          } else if (t.isImportNamespaceSpecifier(s)) {
            namespaceId = s.local;
          }
        }

        const rawImport = path.scope.generateUidIdentifier(
          namespaceId?.name || defaultImportId?.name || path.node.source.value,
        );
        path.node.specifiers = [t.importNamespaceSpecifier(rawImport)];

        if (defaultImportId) {
          path.insertAfter(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(t.identifier("default"), defaultImportId),
                ]),
                t.conditionalExpression(
                  t.optionalMemberExpression(
                    t.memberExpression(rawImport, t.identifier("default")),
                    t.identifier("__esModule"),
                    false,
                    true,
                  ),
                  t.memberExpression(rawImport, t.identifier("default")),
                  rawImport,
                ),
              ),
            ]),
          );
        }

        if (namespaceId) {
          path.insertAfter(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                namespaceId,
                t.conditionalExpression(
                  t.optionalMemberExpression(
                    rawImport,
                    t.identifier("__esModule"),
                    false,
                    true,
                  ),
                  rawImport,
                  t.memberExpression(rawImport, t.identifier("default")),
                ),
              ),
            ]),
          );
        }

        if (imports) {
          path.insertAfter(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.objectPattern(
                  imports.map(({ name, alias }) =>
                    t.objectProperty(
                      t.identifier(name),
                      t.identifier(alias),
                      false,
                      name === alias,
                    ),
                  ),
                ),
                t.conditionalExpression(
                  t.optionalMemberExpression(
                    rawImport,
                    t.identifier("__esModule"),
                    false,
                    true,
                  ),
                  rawImport,
                  t.memberExpression(rawImport, t.identifier("default")),
                ),
              ),
            ]),
          );
        }
      },
    },
  };
}
