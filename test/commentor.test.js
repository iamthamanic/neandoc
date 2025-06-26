const Commentor = require('../lib/commentor');
const fs = require('fs-extra');
const path = require('path');

describe('Commentor', () => {
  let commentor;
  let tempDir;

  beforeEach(async () => {
    commentor = new Commentor();
    tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('File safety', () => {
    test('should create backup before modifying files', async () => {
      const testCode = `function testFunction() {
  return 'test';
}`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      const comments = [{
        type: 'function',
        name: 'testFunction',
        lineNumber: 1,
        content: '// Test comment',
        insertPosition: 1
      }];
      
      await commentor.applyComments(testFile, comments);
      
      // Check that file was modified
      const modifiedContent = await fs.readFile(testFile, 'utf8');
      expect(modifiedContent).toContain('// Test comment');
      
      // Backup should be cleaned up after successful operation
      const backupPath = `${testFile}.neandoc.backup`;
      expect(await fs.pathExists(backupPath)).toBe(false);
    });

    test('should restore from backup on failure', async () => {
      const testCode = `function testFunction() {
  return 'test';
}`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      // Mock fs.move to simulate failure
      const originalMove = fs.move;
      fs.move = jest.fn().mockRejectedValue(new Error('Simulated failure'));
      
      const comments = [{
        type: 'function',
        name: 'testFunction',
        lineNumber: 1,
        content: '// Test comment',
        insertPosition: 1
      }];
      
      await expect(commentor.applyComments(testFile, comments))
        .rejects
        .toThrow('Failed to apply comments');
      
      // Original file should be restored
      const restoredContent = await fs.readFile(testFile, 'utf8');
      expect(restoredContent).toBe(testCode);
      
      // Restore original fs.move
      fs.move = originalMove;
    });

    test('should handle concurrent file access gracefully', async () => {
      const testCode = `function testFunction() {
  return 'test';
}`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      const comments = [{
        type: 'function',
        name: 'testFunction',
        lineNumber: 1,
        content: '// Test comment',
        insertPosition: 1
      }];
      
      // Simulate concurrent access
      const promises = [
        commentor.applyComments(testFile, comments),
        commentor.applyComments(testFile, comments)
      ];
      
      // At least one should succeed
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Comment generation', () => {
    test('should generate fallback comments when AI fails', async () => {
      const codeStructure = {
        functions: [{
          name: 'testFunction',
          lineNumber: 1,
          type: 'function',
          signature: 'function testFunction()'
        }],
        classes: [{
          name: 'TestClass',
          lineNumber: 5,
          type: 'class'
        }]
      };
      
      const comments = await commentor.generateComments(codeStructure);
      
      expect(comments).toHaveLength(2);
      expect(comments[0].name).toBe('testFunction');
      expect(comments[0].content).toContain('Technische Erklärung');
      expect(comments[0].content).toContain('Einfache Erklärung');
      expect(comments[1].name).toBe('TestClass');
    });

    test('should filter comments based on options', async () => {
      const codeStructure = {
        functions: [{
          name: 'testFunction',
          lineNumber: 1,
          type: 'function'
        }],
        classes: [{
          name: 'TestClass',
          lineNumber: 5,
          type: 'class'
        }]
      };
      
      const comments = await commentor.generateComments(codeStructure, { onlyFunctions: true });
      
      expect(comments).toHaveLength(1);
      expect(comments[0].name).toBe('testFunction');
    });
  });

  describe('Existing comment detection', () => {
    test('should not duplicate existing comments', async () => {
      const testCode = `/**
 * Existing comment for testFunction
 */
function testFunction() {
  return 'test';
}`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      const comments = [{
        type: 'function',
        name: 'testFunction',
        lineNumber: 4,
        content: '// New comment',
        insertPosition: 3
      }];
      
      await commentor.applyComments(testFile, comments);
      
      const modifiedContent = await fs.readFile(testFile, 'utf8');
      // Should not contain the new comment since one already exists
      expect(modifiedContent).not.toContain('// New comment');
      expect(modifiedContent).toContain('Existing comment for testFunction');
    });
  });

  describe('Comment preview', () => {
    test('should generate preview without modifying files', async () => {
      const testCode = `function testFunction() {
  return 'test';
}`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      const comments = [{
        type: 'function',
        name: 'testFunction',
        lineNumber: 1,
        content: '// Test comment',
        insertPosition: 1
      }];
      
      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await commentor.previewComments(testFile, comments);
      
      // File should remain unchanged
      const unchangedContent = await fs.readFile(testFile, 'utf8');
      expect(unchangedContent).toBe(testCode);
      
      // Preview should have been logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});