import ts from "typescript";
import path from "path";
import fs from "fs";

// --- Types ---

type Violation = {
  rule: string;
  file: string;
  line?: number;
  message: string;
};

// --- Helpers ---

const projectRoot = path.resolve(import.meta.dirname, `..`);

const relativePath = (filePath: string) =>
  path.relative(projectRoot, filePath).replace(/\\/g, `/`);

const addViolation = (
  violations: Violation[],
  rule: string,
  file: string,
  message: string,
  node?: ts.Node,
) => {
  const line = node
    ? ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart()).line + 1
    : undefined;
  violations.push({ rule, file: relativePath(file), line, message });
};

const getExportedNames = (sourceFile: ts.SourceFile): { name: string; node: ts.Node }[] => {
  const exports: { name: string; node: ts.Node }[] = [];
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.canHaveModifiers(node)) return;
    const modifiers = ts.getModifiers(node);
    const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!hasExport) return;

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          exports.push({ name: decl.name.text, node });
        }
      }
    } else if (ts.isTypeAliasDeclaration(node)) {
      exports.push({ name: node.name.text, node });
    } else if (ts.isInterfaceDeclaration(node)) {
      exports.push({ name: node.name.text, node });
    } else if (ts.isEnumDeclaration(node)) {
      exports.push({ name: node.name.text, node });
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      exports.push({ name: node.name.text, node });
    }
  });
  return exports;
};

const isInFolder = (filePath: string, folder: string) => {
  const rel = relativePath(filePath);
  return rel.startsWith(`${folder}/`) && !rel.includes(`/`, folder.length + 1);
};

const isTypeImport = (node: ts.ImportDeclaration) =>
  node.importClause?.isTypeOnly === true;

const isRelativeImport = (node: ts.ImportDeclaration) => {
  const specifier = node.moduleSpecifier;
  if (ts.isStringLiteral(specifier)) {
    return specifier.text.startsWith(`.`);
  }
  return false;
};

const isTypesImport = (node: ts.ImportDeclaration) => {
  const specifier = node.moduleSpecifier;
  if (ts.isStringLiteral(specifier)) {
    return specifier.text.includes(`/types/`) || specifier.text.startsWith(`../types/`);
  }
  return false;
};

// --- Rule Checkers ---

// Rule 1: Each file in functions/, steps/, types/ exports exactly one thing
const checkOneExport = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  const inScope = isInFolder(filePath, `functions`) || isInFolder(filePath, `steps`) || isInFolder(filePath, `types`);
  if (!inScope) return;

  const exports = getExportedNames(sourceFile);
  if (exports.length !== 1) {
    addViolation(violations, `ONE_EXPORT`, filePath, `File exports ${exports.length} items. Each file must export exactly one.`);
  }
};

// Rule 2: No runtime imports in functions/ or steps/ (import type from types/ is allowed)
const checkNoRuntimeImports = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  const inScope = isInFolder(filePath, `functions`) || isInFolder(filePath, `steps`);
  if (!inScope) return;

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (isTypeImport(node) && isTypesImport(node)) return;
    if (isRelativeImport(node)) {
      if (isTypeImport(node)) {
        // import type from non-types/ relative path
        addViolation(violations, `NO_RUNTIME_IMPORTS`, filePath, `Type import from non-types/ path. Only \`import type\` from \`types/\` is allowed.`, node);
      } else {
        addViolation(violations, `NO_RUNTIME_IMPORTS`, filePath, `Runtime import from project file. Only \`import type\` from \`types/\` is allowed.`, node);
      }
    }
  });
};

// Rule 3: File name matches export name
const checkFileNameMatchesExport = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  const inScope = isInFolder(filePath, `functions`) || isInFolder(filePath, `steps`) || isInFolder(filePath, `types`);
  if (!inScope) return;

  const exports = getExportedNames(sourceFile);
  if (exports.length !== 1) return; // already caught by ONE_EXPORT

  const fileName = path.basename(filePath, `.ts`);
  const exportName = exports[0].name;
  if (fileName !== exportName) {
    addViolation(violations, `NAME_MISMATCH`, filePath, `File name "${fileName}" does not match export name "${exportName}".`, exports[0].node);
  }
};

// Rule 4: No function keyword (except in type signatures)
const checkNoFunctionKeyword = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  const inScope = isInFolder(filePath, `functions`) || isInFolder(filePath, `steps`) || isInFolder(filePath, `runtime`);
  if (!inScope && !relativePath(filePath).startsWith(`main.ts`)) return;

  const walk = (node: ts.Node) => {
    // Allow function in type positions
    if (ts.isTypeNode(node)) return;
    if (ts.isInterfaceDeclaration(node)) return;
    if (ts.isTypeAliasDeclaration(node)) return;

    if (ts.isFunctionDeclaration(node)) {
      addViolation(violations, `NO_FUNCTION_KEYWORD`, filePath, `Use arrow functions instead of the \`function\` keyword.`, node);
      return;
    }
    if (ts.isFunctionExpression(node)) {
      addViolation(violations, `NO_FUNCTION_KEYWORD`, filePath, `Use arrow functions instead of the \`function\` keyword.`, node);
      return;
    }

    ts.forEachChild(node, walk);
  };
  ts.forEachChild(sourceFile, walk);
};

// Rule 5: All top-level declarations are const
const checkConstOnly = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  const inScope = isInFolder(filePath, `functions`) || isInFolder(filePath, `steps`) || isInFolder(filePath, `runtime`);
  if (!inScope) return;

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return;
    const flags = node.declarationList.flags;
    if (!(flags & ts.NodeFlags.Const)) {
      addViolation(violations, `CONST_ONLY`, filePath, `Use \`const\` instead of \`let\` or \`var\`.`, node);
    }
  });
};

// Rule 6: main.ts has no variable declarations
const checkMainNoVariables = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  if (relativePath(filePath) !== `main.ts`) return;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      addViolation(violations, `MAIN_NO_VARIABLES`, filePath, `main.ts must contain only imports and one expression tree. No variable declarations.`, node);
    }
  });
};

// Rule 7: Runtime files only import from node_modules
const checkRuntimeImports = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  if (!isInFolder(filePath, `runtime`)) return;

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (isRelativeImport(node)) {
      addViolation(violations, `RUNTIME_NO_PROJECT_IMPORTS`, filePath, `Runtime adapters may only import from \`node_modules\`, not from project code.`, node);
    }
  });
};

// Rule 8: Direct function parameters use branded types, not raw primitives
const checkBrandedTypes = (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  violations: Violation[],
) => {
  const filePath = sourceFile.fileName;
  const inScope = isInFolder(filePath, `functions`) || isInFolder(filePath, `steps`);
  if (!inScope) return;

  const checkParams = (params: ts.NodeArray<ts.ParameterDeclaration>, node: ts.Node) => {
    for (const param of params) {
      const paramType = checker.getTypeAtLocation(param);
      const typeStr = checker.typeToString(paramType);

      // Check for raw primitives
      if (typeStr === `number` || typeStr === `string` || typeStr === `boolean`) {
        const paramName = ts.isIdentifier(param.name) ? param.name.text : `<destructured>`;
        addViolation(
          violations,
          `NO_RAW_PRIMITIVES`,
          filePath,
          `Parameter "${paramName}" has raw type "${typeStr}". Use a branded type.`,
          param,
        );
      }
    }
  };

  // Find the exported arrow function and check its parameters
  const walk = (node: ts.Node) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      checkParams(node.parameters, node);
      // Don't recurse into returned functions (those are inner, not direct params)
      return;
    }
    ts.forEachChild(node, walk);
  };

  // Start from the exported variable's initializer
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return;
    const modifiers = ts.getModifiers(node);
    const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!hasExport) return;

    for (const decl of node.declarationList.declarations) {
      if (decl.initializer) {
        walk(decl.initializer);
      }
    }
  });
};

// Rule 9: Functions in functions/ never take state types (__state: true)
const checkNoStateInFunctions = (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  violations: Violation[],
) => {
  const filePath = sourceFile.fileName;
  if (!isInFolder(filePath, `functions`)) return;

  const hasStateMarker = (type: ts.Type): boolean => {
    const stateProperty = type.getProperty(`__state`);
    return stateProperty !== undefined;
  };

  const checkParams = (params: ts.NodeArray<ts.ParameterDeclaration>) => {
    for (const param of params) {
      const paramType = checker.getTypeAtLocation(param);
      if (hasStateMarker(paramType)) {
        const paramName = ts.isIdentifier(param.name) ? param.name.text : `<destructured>`;
        addViolation(
          violations,
          `NO_STATE_IN_FUNCTIONS`,
          filePath,
          `Parameter "${paramName}" has a state type (\`__state: true\`). State routing belongs in \`steps/\`.`,
          param,
        );
      }
    }
  };

  // Check all arrow function parameters (including nested returned functions)
  const walk = (node: ts.Node) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      checkParams(node.parameters);
    }
    ts.forEachChild(node, walk);
  };
  ts.forEachChild(sourceFile, walk);
};

// Rule 10: Step files contain no computation
const checkStepNoComputation = (sourceFile: ts.SourceFile, violations: Violation[]) => {
  const filePath = sourceFile.fileName;
  if (!isInFolder(filePath, `steps`)) return;

  const forbiddenKinds = new Set([
    ts.SyntaxKind.IfStatement,
    ts.SyntaxKind.ConditionalExpression,
    ts.SyntaxKind.PrefixUnaryExpression,
    ts.SyntaxKind.PostfixUnaryExpression,
    ts.SyntaxKind.ForStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.WhileStatement,
    ts.SyntaxKind.DoStatement,
    ts.SyntaxKind.SwitchStatement,
  ]);

  const forbiddenBinaryOps = new Set([
    ts.SyntaxKind.PlusToken,
    ts.SyntaxKind.MinusToken,
    ts.SyntaxKind.AsteriskToken,
    ts.SyntaxKind.SlashToken,
    ts.SyntaxKind.PercentToken,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.LessThanToken,
    ts.SyntaxKind.GreaterThanToken,
    ts.SyntaxKind.LessThanEqualsToken,
    ts.SyntaxKind.GreaterThanEqualsToken,
    ts.SyntaxKind.AmpersandAmpersandToken,
    ts.SyntaxKind.BarBarToken,
  ]);

  // Find the function body (skip the outer parameter list, check the returned function body)
  const walkBody = (node: ts.Node) => {
    // Skip type annotations
    if (ts.isTypeNode(node)) return;

    if (forbiddenKinds.has(node.kind)) {
      const kindName = ts.SyntaxKind[node.kind];
      addViolation(violations, `NO_COMPUTATION`, filePath, `Step file contains "${kindName}". Only property access, function calls, and spread are allowed.`, node);
      return;
    }

    if (ts.isBinaryExpression(node) && forbiddenBinaryOps.has(node.operatorToken.kind)) {
      const op = node.operatorToken.getText();
      addViolation(violations, `NO_COMPUTATION`, filePath, `Step file contains operator "${op}". Only property access, function calls, and spread are allowed.`, node);
      return;
    }

    ts.forEachChild(node, walkBody);
  };

  // Find the exported function body
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return;
    const modifiers = ts.getModifiers(node);
    const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!hasExport) return;

    for (const decl of node.declarationList.declarations) {
      if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
        // The outer arrow function's body is the returned function
        // We want to check the body of the RETURNED function
        const outerBody = decl.initializer.body;
        if (ts.isArrowFunction(outerBody)) {
          // Curried: export const x = (...) => (...) => ({ ... })
          walkBody(outerBody.body);
        } else if (ts.isParenthesizedExpression(outerBody)) {
          walkBody(outerBody);
        } else if (ts.isBlock(outerBody)) {
          walkBody(outerBody);
        } else {
          walkBody(outerBody);
        }
      }
    }
  });
};

// --- Main ---

const collectFiles = (dir: string, ext: string): string[] => {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
};

const run = () => {
  // Collect all .ts files in scope
  const files: string[] = [];
  const folders = [`functions`, `steps`, `types`, `runtime`];
  for (const folder of folders) {
    files.push(...collectFiles(path.join(projectRoot, folder), `.ts`));
  }

  // Add main.ts if it exists
  const mainPath = path.join(projectRoot, `main.ts`);
  if (fs.existsSync(mainPath)) {
    files.push(mainPath);
  }

  if (files.length === 0) {
    console.log(`No files to validate.`);
    process.exit(0);
  }

  // Create TypeScript program
  const configPath = path.join(projectRoot, `tsconfig.json`);
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);

  const program = ts.createProgram(files, parsedConfig.options);
  const checker = program.getTypeChecker();

  const violations: Violation[] = [];

  for (const file of files) {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) continue;

    // AST-level checks
    checkOneExport(sourceFile, violations);
    checkNoRuntimeImports(sourceFile, violations);
    checkFileNameMatchesExport(sourceFile, violations);
    checkNoFunctionKeyword(sourceFile, violations);
    checkConstOnly(sourceFile, violations);
    checkMainNoVariables(sourceFile, violations);
    checkRuntimeImports(sourceFile, violations);
    checkStepNoComputation(sourceFile, violations);

    // Type-aware checks
    checkBrandedTypes(sourceFile, checker, violations);
    checkNoStateInFunctions(sourceFile, checker, violations);
  }

  // Report
  if (violations.length === 0) {
    console.log(`All files pass validation.`);
    process.exit(0);
  }

  for (const v of violations) {
    const location = v.line ? `${v.file}:${v.line}` : v.file;
    console.error(`[${v.rule}] ${location} - ${v.message}`);
  }

  console.error(`\n${violations.length} violation(s) found.`);
  process.exit(1);
};

run();
