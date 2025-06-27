const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const MCPClient = require('./mcp-client');

// Global file locks to prevent race conditions across instances
const globalFileLocks = new Map();

class Commentor {
  constructor(options = {}) {
    this.mcpClient = new MCPClient(options);
    this.prompts = null;
  }

  async loadPrompts() {
    if (!this.prompts) {
      try {
        const promptsPath = path.join(__dirname, '../config/prompts.json');
        this.prompts = await fs.readJson(promptsPath);
      } catch (error) {
        // Use default prompts if file doesn't exist
        this.prompts = this.getDefaultPrompts();
      }
    }
    return this.prompts;
  }

  getDefaultPrompts() {
    return {
      basePrompt: `Du bist Neandoc, ein AI-Assistent, der Code so kommentiert und erklärt, dass ihn sowohl Entwickler als auch Laien verstehen.

Deine Aufgaben für jeden Codeabschnitt (Funktion, Klasse, Block):
1. Schreibe eine **technische Erklärung** für Entwickler.
2. Schreibe eine **einfache Erklärung** in Alltagssprache.

Nutze folgendes Format:

/**
 * Technische Erklärung:
 * [...]
 *
 * Einfache Erklärung:
 * [...]
 */

Der Code selbst darf nicht verändert werden.`,

      functionPrompt: `Analysiere diese Funktion und erstelle Kommentare:

Funktionsname: {FUNCTION_NAME}
Signatur: {FUNCTION_SIGNATURE}
Kontext: {FUNCTION_CONTEXT}

Erstelle eine technische und eine einfache Erklärung für diese Funktion.`,

      classPrompt: `Analysiere diese Klasse und erstelle Kommentare:

Klassenname: {CLASS_NAME}
Kontext: {CLASS_CONTEXT}

Erstelle eine technische und eine einfache Erklärung für diese Klasse.`,

      variablePrompt: `Analysiere diese Variable und erstelle Kommentare:

Variablenname: {VARIABLE_NAME}
Kontext: {VARIABLE_CONTEXT}

Erstelle eine technische und eine einfache Erklärung für diese Variable.`
    };
  }

  async generateComments(codeStructure, options = {}) {
    await this.loadPrompts();
    
    try {
      // For now, just use fallback comments since we're focusing on the prompt generation workflow
      return this.generateFallbackComments(codeStructure, options);
      
    } catch (error) {
      console.warn(`Warning: AI generation failed, using fallback comments: ${error.message}`);
      return this.generateFallbackComments(codeStructure, options);
    }
  }

  processDocumentation(documentation, options) {
    const comments = [];
    
    for (const doc of documentation) {
      const comment = {
        type: doc.type,
        name: doc.name,
        lineNumber: doc.lineNumber,
        content: doc.documentation.combined,
        insertPosition: this.calculateInsertPosition(doc.lineNumber)
      };
      
      // Filter based on options
      if (options.onlyFunctions && doc.type !== 'function' && doc.type !== 'method') {
        continue;
      }
      
      comments.push(comment);
    }
    
    return comments;
  }

  generateFallbackComments(codeStructure, options) {
    const comments = [];
    
    // Generate fallback comments for functions
    for (const func of codeStructure.functions) {
      if (options.onlyFunctions || !options.onlyClasses) {
        const comment = {
          type: 'function',
          name: func.name,
          lineNumber: func.lineNumber,
          content: this.generateFallbackFunctionComment(func),
          insertPosition: this.calculateInsertPosition(func.lineNumber)
        };
        comments.push(comment);
      }
    }
    
    // Generate fallback comments for classes
    for (const cls of codeStructure.classes) {
      if (!options.onlyFunctions) {
        const comment = {
          type: 'class',
          name: cls.name,
          lineNumber: cls.lineNumber,
          content: this.generateFallbackClassComment(cls),
          insertPosition: this.calculateInsertPosition(cls.lineNumber)
        };
        comments.push(comment);
      }
    }
    
    return comments;
  }

  generateFallbackFunctionComment(func) {
    return `/**
 * Technische Erklärung:
 * Die Funktion '${func.name}' führt eine spezifische Operation aus.
 * ${func.signature ? `Signatur: ${func.signature}` : ''}
 *
 * Einfache Erklärung:
 * Diese Funktion ist wie ein Werkzeug - sie nimmt etwas entgegen und gibt etwas zurück.
 */`;
  }

  generateFallbackClassComment(cls) {
    return `/**
 * Technische Erklärung:
 * Die Klasse '${cls.name}' kapselt zusammengehörige Daten und Methoden.
 * Sie implementiert spezifische Geschäftslogik und bietet eine definierte Schnittstelle.
 *
 * Einfache Erklärung:
 * Diese Klasse ist wie ein Bauplan - sie beschreibt, wie etwas aufgebaut ist und funktioniert.
 */`;
  }

  calculateInsertPosition(lineNumber) {
    // Insert comment one line before the code element
    return Math.max(1, lineNumber - 1);
  }

  // Atomic file locking to prevent race conditions
  async acquireFileLock(filePath) {
    const lockKey = path.resolve(filePath);
    
    while (globalFileLocks.has(lockKey)) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Double check after wait to ensure atomicity
    if (globalFileLocks.has(lockKey)) {
      return this.acquireFileLock(filePath);
    }
    
    globalFileLocks.set(lockKey, Date.now());
    return lockKey;
  }
  
  releaseFileLock(lockKey) {
    globalFileLocks.delete(lockKey);
  }
  
  // Generate unique backup filename to prevent conflicts
  createBackupPath(filePath) {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString('hex');
    return `${filePath}.neandoc.backup.${timestamp}.${randomId}`;
  }

  async applyComments(filePath, comments) {
    const lockKey = await this.acquireFileLock(filePath);
    
    try {
      // Create backup before modifying with unique filename
      const backupPath = this.createBackupPath(filePath);
      await fs.copy(filePath, backupPath);
      
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Sort comments by line number (descending) to avoid offset issues
      const sortedComments = comments.sort((a, b) => b.lineNumber - a.lineNumber);
      
      // Insert comments
      for (const comment of sortedComments) {
        const insertIndex = comment.insertPosition - 1; // Convert to 0-based index
        
        // Check if comment already exists
        if (!this.hasExistingComment(lines, insertIndex, comment.name)) {
          const commentLines = comment.content.split('\n');
          lines.splice(insertIndex, 0, ...commentLines);
        }
      }
      
      // Write to temporary file first for atomic operation
      const tempPath = `${filePath}.tmp`;
      const newContent = lines.join('\n');
      await fs.writeFile(tempPath, newContent, 'utf8');
      
      // Atomic move to final location
      await fs.move(tempPath, filePath, { overwrite: true });
      
      // Remove backup on success
      await fs.remove(backupPath);
      
    } catch (error) {
      // Restore from backup if something went wrong
      const backupPath = this.createBackupPath(filePath);
      try {
        if (await fs.pathExists(backupPath)) {
          await fs.copy(backupPath, filePath, { overwrite: true });
          await fs.remove(backupPath);
        }
      } catch (restoreError) {
        console.error(`Failed to restore backup: ${restoreError.message}`);
        // Chain the original error with restore error
        const chainedError = new Error(`Failed to apply comments to ${filePath}: ${error.message}. Additionally, backup restoration failed: ${restoreError.message}`);
        chainedError.originalError = error;
        chainedError.restoreError = restoreError;
        throw chainedError;
      }
      throw new Error(`Failed to apply comments to ${filePath}: ${error.message}`);
    } finally {
      // Always release lock
      this.releaseFileLock(lockKey);
    }
  }

  hasExistingComment(lines, insertIndex, elementName) {
    // Check if there's already a comment for this element
    const checkRange = 5; // Check 5 lines before the insert position
    const startCheck = Math.max(0, insertIndex - checkRange);
    
    for (let i = startCheck; i < insertIndex; i++) {
      const line = lines[i];
      if (line && (line.includes('/**') || line.includes('*') || line.includes('*/'))) {
        // Found a comment block, check if it mentions the element
        const commentBlock = this.extractCommentBlock(lines, i);
        if (commentBlock.includes(elementName)) {
          return true;
        }
      }
    }
    
    return false;
  }

  extractCommentBlock(lines, startIndex) {
    let commentBlock = '';
    let i = startIndex;
    
    // Find start of comment block
    while (i >= 0 && !lines[i].includes('/**')) {
      i--;
    }
    
    // Extract comment block
    while (i < lines.length && !lines[i].includes('*/')) {
      commentBlock += lines[i] + '\n';
      i++;
    }
    
    if (i < lines.length) {
      commentBlock += lines[i]; // Add closing */
    }
    
    return commentBlock;
  }

  async previewComments(filePath, comments) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📝 Preview for ${filePath}:`);
    console.log('=' + '='.repeat(50));
    
    for (const comment of comments) {
      const insertIndex = comment.insertPosition - 1;
      const contextStart = Math.max(0, insertIndex - 2);
      const contextEnd = Math.min(lines.length, insertIndex + 5);
      
      console.log(`\n🔍 ${comment.type}: ${comment.name} (line ${comment.lineNumber})`);
      console.log('-'.repeat(40));
      
      // Show context
      for (let i = contextStart; i < contextEnd; i++) {
        const lineNum = i + 1;
        const prefix = i === insertIndex ? '>>> ' : '    ';
        
        if (i === insertIndex) {
          // Show where comment would be inserted
          const commentLines = comment.content.split('\n');
          for (const commentLine of commentLines) {
            console.log(`${prefix}${lineNum}: ${commentLine}`);
          }
        }
        
        if (lines[i]) {
          console.log(`${prefix}${lineNum}: ${lines[i]}`);
        }
      }
    }
  }
}

module.exports = Commentor;