import * as t from "@babel/types";
import type { PluginObj } from "@babel/core";
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
 *        import _nsFoo from 'foo';
 *        const myFoo = nsFoo?.__esModule ? _foo.default : _foo
 *      ```
 */
export default function plugin(options: {
  extensions: string[];
  conditions: string[];
}): PluginObj {
  return {
    name: "marko-import-interop",
    visitor: {
      ImportDeclaration(path) {
        // Skip side-effect only imports and marko imports
        if (
          !path.node.specifiers.length ||
          /\.(?:mjs|marko)$|\?/.test(path.node.source.value)
        ) {
          return;
        }

        try {
          const resolved = resolve(
            path.node.source.value,
            (path.hub as any).file.opts.filename,
            options.extensions,
            options.conditions
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

        namespaceId ||= path.scope.generateUidIdentifier(
          defaultImportId?.name || path.node.source.value
        );
        path.node.specifiers = [t.importDefaultSpecifier(namespaceId)];

        if (defaultImportId) {
          path.insertAfter(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                defaultImportId,
                t.conditionalExpression(
                  t.optionalMemberExpression(
                    namespaceId,
                    t.identifier("__esModule"),
                    false,
                    true
                  ),
                  t.memberExpression(namespaceId, t.identifier("default")),
                  namespaceId
                )
              ),
            ])
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
                      name === alias
                    )
                  )
                ),
                namespaceId
              ),
            ])
          );
        }
      },
    },
  };
}
