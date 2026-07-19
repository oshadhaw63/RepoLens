import ts from "typescript";

export type ParsedTypeScriptFile = {
  path: string;
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
};

export function parseTypeScriptFile(
  filePath: string,
  sourceCode: string,
): ParsedTypeScriptFile {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const result: ParsedTypeScriptFile = {
    path: filePath,
    imports: [],
    exports: [],
    functions: [],
    classes: [],
  };

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleName = node.moduleSpecifier
        .getText(sourceFile)
        .replaceAll('"', "")
        .replaceAll("'", "");

      result.imports.push(createImportSummary(node, moduleName));
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      result.functions.push(node.name.text);

      if (hasDefaultKeyword(node)) {
        result.exports.push(`default ${node.name.text}`);
      } else if (hasExportKeyword(node)) {
        result.exports.push(node.name.text);
      }
    }

    if (ts.isClassDeclaration(node) && node.name) {
      result.classes.push(node.name.text);

      if (hasDefaultKeyword(node)) {
        result.exports.push(`default ${node.name.text}`);
      } else if (hasExportKeyword(node)) {
        result.exports.push(node.name.text);
      }
    }

    if (ts.isVariableStatement(node)) {
      const isExported = hasExportKeyword(node);

      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }

        const name = declaration.name.text;

        if (declaration.initializer && isFunctionLikeInitializer(declaration.initializer)) {
          result.functions.push(name);
        }

        if (isExported) {
          result.exports.push(name);
        }
      }
    }

    if (ts.isExportAssignment(node)) {
      result.exports.push("default");
    }

    if (ts.isExportDeclaration(node)) {
      const moduleName = node.moduleSpecifier
        ? node.moduleSpecifier.getText(sourceFile).replaceAll('"', "").replaceAll("'", "")
        : null;

      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          result.exports.push(element.name.text);
        }
      }

      if (moduleName) {
        result.imports.push(`re-export from ${moduleName}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return result;
}

function hasExportKeyword(node: ts.Node) {
  return ts.canHaveModifiers(node)
    ? Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
    : false;
}

function hasDefaultKeyword(node: ts.Node) {
  return ts.canHaveModifiers(node)
    ? Boolean(
      node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
      ),
    )
    : false;
}

function getScriptKind(filePath: string) {
  if (filePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }

  if (filePath.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }

  if (filePath.endsWith(".ts")) {
    return ts.ScriptKind.TS;
  }

  return ts.ScriptKind.JS;
}

function isFunctionLikeInitializer(node: ts.Expression) {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

function createImportSummary(node: ts.ImportDeclaration, moduleName: string) {
  const importClause = node.importClause;

  if (!importClause) {
    return moduleName;
  }

  const importedNames: string[] = [];

  if (importClause.name) {
    importedNames.push(importClause.name.text);
  }

  const namedBindings = importClause.namedBindings;

  if (namedBindings && ts.isNamespaceImport(namedBindings)) {
    importedNames.push(`* as ${namedBindings.name.text}`);
  }

  if (namedBindings && ts.isNamedImports(namedBindings)) {
    for (const element of namedBindings.elements) {
      importedNames.push(element.name.text);
    }
  }

  if (importedNames.length === 0) {
    return moduleName;
  }

  return `${importedNames.join(", ")} from ${moduleName}`;
}