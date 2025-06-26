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

    // Parse functions - simplified and safer regex
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?function|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>|(\w+)\s*:\s*(?:async\s+)?function)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2] || match[3] || match[4];
      if (functionName) {
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

    // Parse classes
    const classRegex = /class\s+(\w+)/g;
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
    const importRegex = /(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.imports.push({
        path: importPath,
        lineNumber,
        type: 'import'
      });
    }

    // Parse exports
    const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|{([^}]+)})/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportName = match[1] || match[2] || match[3] || match[4];
      const lineNumber = this.getLineNumber(content, match.index);
      structure.exports.push({
        name: exportName,
        lineNumber,
        type: 'export'
      });
    }

    return structure;
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