import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative, sep } from "node:path";
import typescript from "typescript";

const projectDirectory = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(projectDirectory, "src");
function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}
const sourceFiles = collectFiles(sourceDirectory);
const aliases = {
  "@application/": "src/application/",
  "@features/": "src/features/",
  "@shared/": "src/shared/",
  "@styles/": "src/styles/",
};
const dependencies = sourceFiles
  .filter((file) => /\.tsx?$/.test(file))
  .flatMap((file) => {
    const source = typescript.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      typescript.ScriptTarget.Latest,
      true,
    );
    const imports = [];
    function visit(node) {
      if (
        (typescript.isImportDeclaration(node) ||
          typescript.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        typescript.isStringLiteral(node.moduleSpecifier)
      ) {
        imports.push({ file, specifier: node.moduleSpecifier.text });
      }
      if (
        typescript.isCallExpression(node) &&
        node.expression.kind === typescript.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        typescript.isStringLiteral(node.arguments[0])
      ) {
        imports.push({ file, specifier: node.arguments[0].text });
      }
      typescript.forEachChild(node, visit);
    }
    visit(source);
    return imports;
  });
function resolveDependency({ file, specifier }) {
  if (specifier.startsWith(".")) return resolve(dirname(file), specifier);
  const alias = Object.keys(aliases).find((prefix) =>
    specifier.startsWith(prefix),
  );
  return alias
    ? resolve(projectDirectory, aliases[alias] + specifier.slice(alias.length))
    : null;
}

test("source paths do not contain spaces", () => {
  for (const path of sourceFiles)
    assert.doesNotMatch(relative(sourceDirectory, path), /\s/);
});
test("all local imports and lazy imports resolve", () => {
  for (const dependency of dependencies) {
    const target = resolveDependency(dependency);
    if (!target) continue;
    assert.ok(
      ["", ".ts", ".tsx", ".css", "/index.ts", "/index.tsx"].some((extension) =>
        existsSync(target + extension),
      ),
      dependency.file + ": unresolved " + dependency.specifier,
    );
  }
});
test("shared source does not depend on application or feature code", () => {
  const sharedDirectory = resolve(sourceDirectory, "shared") + sep;
  for (const dependency of dependencies.filter(({ file }) =>
    file.startsWith(sharedDirectory),
  )) {
    const target = resolveDependency(dependency);
    if (target)
      assert.ok(
        target.startsWith(sharedDirectory),
        dependency.file + " depends on " + target,
      );
  }
});
test("Material UI icon imports are centralised and explicit", () => {
  const catalogue = resolve(
    sourceDirectory,
    "shared/icons/applicationIcons.ts",
  );
  for (const dependency of dependencies.filter(({ specifier }) =>
    specifier.startsWith("@mui/icons-material"),
  )) {
    assert.equal(dependency.file, catalogue);
    assert.notEqual(dependency.specifier, "@mui/icons-material");
  }
});
