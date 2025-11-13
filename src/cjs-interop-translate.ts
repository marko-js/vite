import { types as t } from "@marko/compiler";
import { importNamed } from "@marko/compiler/babel-utils";

import { isCJSModule } from "./resolve";

/**
 * This plugin is designed to transform imports within Marko files to interop between ESM and CJS.
 * In Node, ESM files cannot reliably use named imports and default imports from CJS files.
 * Additionally, modules which are transpiled from ESM to CJS will use a `__esModule` property to
 * signal that the consuming ESM code should treat `exports.default` as the default import.
 * This plugin only modifies imports it determined to be for CJS modules.
 *
 * Examples:
 *   1. Named imports:
 *      Source:  import { bar as baz } from 'foo';
 *      Becomes: import * as _foo from 'foo';
 *               const { bar: baz } = importNS(_foo);
 *
 *   2. Default imports:
 *      Source:  import myFoo from 'foo';
 *      Becomes: import * as _myFoo from 'foo';
 *               const { default: myFoo } = importDefault(_myFoo);
 *
 *   3. Namespace imports:
 *      Source:  import * as nsFoo from 'foo';
 *      Becomes: import * as _nsFoo from 'foo';
 *               const nsFoo = importNS(_nsFoo);
 *
 *   4. Default and named imports:
 *      Source:  import myFoo, { bar as baz } from 'foo';
 *      Becomes: import * as _foo from 'foo';
 *               const { default: myFoo } = importDefault(_foo);
 *               const { bar: baz } = importNS(_foo);
 */

export const cjsInteropHelpersId = "\0marko-cjs-interop.js";
export const cjsInteropHelpersCode = `export const importNS = m => m && (m.default === void 0 || m.__esModule ? m : m.default);
export const importDefault = m => m?.default?.__esModule ? m.default : m;
`;

export default {
  Program: {
    exit(program: t.NodePath<t.Program>) {
      const { cjsInteropMarkoVite } = program.hub.file.markoOpts as any;
      if (!cjsInteropMarkoVite) return;
      const { filter } = cjsInteropMarkoVite;
      const children = program.get("body");

      for (let i = children.length; i--; ) {
        const child = children[i];
        if (child.isImportDeclaration()) {
          translateImport(child, filter);
        }
      }
    },
  },
};

function translateImport(
  importDecl: t.NodePath<t.ImportDeclaration>,
  filter: undefined | ((v: string) => boolean),
) {
  // Skip side-effect only, relative, and marko imports
  if (
    !importDecl.node.specifiers.length ||
    /\.(?:mjs|marko)$|\?/.test(importDecl.node.source.value) ||
    filter?.(importDecl.node.source.value) === false ||
    !isCJSModule(
      importDecl.node.source.value,
      (importDecl.hub as any).file.opts.filename,
    )
  ) {
    return;
  }

  let namespaceId: t.Identifier | undefined;
  let defaultImportId: t.Identifier | undefined;
  let imports: { name: string; alias: string }[] | undefined;

  for (const s of importDecl.node.specifiers) {
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

  const rawImport = importDecl.scope.generateUidIdentifier(
    namespaceId?.name || defaultImportId?.name || importDecl.node.source.value,
  );
  importDecl.node.specifiers = [t.importNamespaceSpecifier(rawImport)];

  if (defaultImportId) {
    importDecl.insertAfter(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(t.identifier("default"), defaultImportId),
          ]),
          t.callExpression(
            importNamed(
              importDecl.hub.file,
              cjsInteropHelpersId,
              "importDefault",
            ),
            [rawImport],
          ),
        ),
      ]),
    );
  }

  if (namespaceId) {
    importDecl.insertAfter(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          namespaceId,
          t.callExpression(
            importNamed(importDecl.hub.file, cjsInteropHelpersId, "importNS"),
            [rawImport],
          ),
        ),
      ]),
    );
  }

  if (imports) {
    importDecl.insertAfter(
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
          t.callExpression(
            importNamed(importDecl.hub.file, cjsInteropHelpersId, "importNS"),
            [rawImport],
          ),
        ),
      ]),
    );
  }
}
