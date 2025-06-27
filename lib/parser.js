const fs = require('fs-extra');
const path = require('path');

class Parser {
  constructor() {
    this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go'];
  }

  async parseFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const extension = path.extname(filePath);
    
    const structure = {
      filePath,
      extension,
      content,
      functions: [],
      classes: [],
      variables: [],
      imports: [],
      exports: []
    };

    switch (extension) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        return this.parseJavaScript(structure);
      case '.py':
        return this.parsePython(structure);
      case '.java':
        return this.parseJava(structure);
      case '.cpp':
      case '.c':
        return this.parseC(structure);
      case '.cs':
        return this.parseCSharp(structure);
      case '.php':
        return this.parsePHP(structure);
      case '.rb':
        return this.parseRuby(structure);
      case '.go':
        return this.parseGo(structure);
      default:
        return this.parseGeneric(structure);
    }
  }

  parseJavaScript(structure) {
    const { content } = structure;
    
    // Parse functions using safer, simpler patterns to avoid ReDoS
    this.parseFunctions(structure, content);
    this.parseClasses(structure, content);
    this.parseImports(structure, content);
    this.parseExports(structure, content);

    return structure;
  }
  
  parseFunctions(structure, content) {
    // Split into smaller, safer regex patterns
    const patterns = [
      /function\s+(\w+)/g,  // function name
      /const\s+(\w+)\s*=\s*function/g,  // const name = function
      /const\s+(\w+)\s*=\s*async\s+function/g,  // const name = async function
      /const\s+(\w+)\s*=\s*\([^)]{0,100}\)\s*=>/g,  // arrow functions (limited parentheses)
      /(\w+)\s*:\s*function/g,  // object method: function
      /(\w+)\s*:\s*async\s+function/g  // object method: async function
    ];
    
    for (const pattern of patterns) {
      let match;
      // Reset lastIndex to avoid issues with global regex
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        if (functionName && this.isValidFunctionName(functionName)) {
          const lineNumber = this.getLineNumber(content, match.index);
          
          // Avoid duplicates
          const exists = structure.functions.some(f => 
            f.name === functionName && f.lineNumber === lineNumber
          );
          
          if (!exists) {
            structure.functions.push({
              name: functionName,
              lineNumber,
              type: 'function',
              startIndex: match.index,
              signature: this.extractFunctionSignature(content, match.index)
            });
          }
        }
      }
    }
  }
  
  parseClasses(structure, content) {
    const classRegex = /class\s+(\w+)/g;
    let match;
    classRegex.lastIndex = 0;
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      if (className && this.isValidClassName(className)) {
        const lineNumber = this.getLineNumber(content, match.index);
        structure.classes.push({
          name: className,
          lineNumber,
          type: 'class',
          startIndex: match.index
        });
      }
    }
  }
  
  parseImports(structure, content) {
    // Safer import parsing with limited patterns
    const importPatterns = [
      /import\s+[^'"]*from\s+['"]([^'"]{1,200})['"];?/g,
      /require\(['"]([^'"]{1,200})['"]\)/g
    ];
    
    for (const pattern of importPatterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath && this.isValidImportPath(importPath)) {
          const lineNumber = this.getLineNumber(content, match.index);
          structure.imports.push({
            path: importPath,
            lineNumber,
            type: 'import'
          });
        }
      }
    }
  }
  
  parseExports(structure, content) {
    const exportPatterns = [
      /export\s+function\s+(\w+)/g,
      /export\s+class\s+(\w+)/g,
      /export\s+const\s+(\w+)/g,
      /export\s+default\s+(\w+)/g
    ];
    
    for (const pattern of exportPatterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        const exportName = match[1];
        if (exportName && this.isValidExportName(exportName)) {
          const lineNumber = this.getLineNumber(content, match.index);
          structure.exports.push({
            name: exportName,
            lineNumber,
            type: 'export'
          });
        }
      }
    }
  }
  
  // Validation helpers to prevent malicious names
  isValidFunctionName(name) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]{0,100}$/.test(name);
  }
  
  isValidClassName(name) {
    return /^[A-Z][a-zA-Z0-9_$]{0,100}$/.test(name);
  }
  
  isValidImportPath(path) {
    return path.length <= 200 && !/[<>|*?"\\x00-\\x1f]/.test(path);
  }
  
  isValidExportName(name) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]{0,100}$/.test(name);
  }

  parsePython(structure) {
    const { content } = structure;
    
    // Parse functions
    const functionRegex = /def\s+(\w+)\s*\([^)]*\):/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.functions.push({
        name: functionName,
        lineNumber,
        type: 'function',
        startIndex: match.index,
        signature: this.extractFunctionSignature(content, match.index)
      });
    }

    // Parse classes
    const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.classes.push({
        name: className,
        lineNumber,
        type: 'class',
        startIndex: match.index
      });
    }

    // Parse imports
    const importRegex = /(?:from\s+(\w+(?:\.\w+)*)\s+import|import\s+(\w+(?:\.\w+)*))/g;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.imports.push({
        path: importPath,
        lineNumber,
        type: 'import'
      });
    }

    return structure;
  }

  parseJava(structure) {
    const { content } = structure;
    
    // Parse methods
    const methodRegex = /(?:public|private|protected|static|\s)+[\w<>[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*{/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      if (methodName !== 'class' && methodName !== 'interface') {
        const lineNumber = this.getLineNumber(content, match.index);
        structure.functions.push({
          name: methodName,
          lineNumber,
          type: 'method',
          startIndex: match.index,
          signature: this.extractFunctionSignature(content, match.index)
        });
      }
    }

    // Parse classes
    const classRegex = /(?:public|private|protected|\s)*class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.classes.push({
        name: className,
        lineNumber,
        type: 'class',
        startIndex: match.index
      });
    }

    return structure;
  }

  parseC(structure) {
    const { content } = structure;
    
    // Parse functions
    const functionRegex = /(?:static\s+)?(?:inline\s+)?[\w*]+\s+(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      if (functionName !== 'if' && functionName !== 'for' && functionName !== 'while') {
        const lineNumber = this.getLineNumber(content, match.index);
        structure.functions.push({
          name: functionName,
          lineNumber,
          type: 'function',
          startIndex: match.index,
          signature: this.extractFunctionSignature(content, match.index)
        });
      }
    }

    return structure;
  }

  parseCSharp(structure) {
    return this.parseJava(structure); // Similar syntax
  }

  parsePHP(structure) {
    const { content } = structure;
    
    // Parse functions
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.functions.push({
        name: functionName,
        lineNumber,
        type: 'function',
        startIndex: match.index,
        signature: this.extractFunctionSignature(content, match.index)
      });
    }

    return structure;
  }

  parseRuby(structure) {
    const { content } = structure;
    
    // Parse methods
    const methodRegex = /def\s+(\w+)(?:\([^)]*\))?/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.functions.push({
        name: methodName,
        lineNumber,
        type: 'method',
        startIndex: match.index,
        signature: this.extractFunctionSignature(content, match.index)
      });
    }

    return structure;
  }

  parseGo(structure) {
    const { content } = structure;
    
    // Parse functions
    const functionRegex = /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\([^)]*\)(?:\s*\([^)]*\))?\s*{/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.functions.push({
        name: functionName,
        lineNumber,
        type: 'function',
        startIndex: match.index,
        signature: this.extractFunctionSignature(content, match.index)
      });
    }

    return structure;
  }

  parseGeneric(structure) {
    // Basic parsing for unsupported languages
    structure.functions = [];
    structure.classes = [];
    
    return structure;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  extractFunctionSignature(content, startIndex) {
    // Extract function signature from start to opening brace
    const fromStart = content.substring(startIndex);
    const signatureMatch = fromStart.match(/^[^{]+/);
    return signatureMatch ? signatureMatch[0].trim() : '';
  }
}

module.exports = Parser;