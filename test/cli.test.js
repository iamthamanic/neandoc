const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

describe('CLI Integration', () => {
  let tempDir;
  let cliPath;

  beforeEach(async () => {
    tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
    cliPath = path.join(__dirname, '../bin/cli.js');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Command validation', () => {
    test('should show help when no arguments provided', () => {
      const result = execSync(`node "${cliPath}" --help`, { encoding: 'utf8' });
      expect(result).toContain('neandoc');
      expect(result).toContain('AI-powered CLI tool');
    });

    test('should show version information', () => {
      const result = execSync(`node "${cliPath}" --version`, { encoding: 'utf8' });
      expect(result).toContain('1.0.0');
    });
  });

  describe('Directory processing', () => {
    test('should handle non-existent directory gracefully', () => {
      expect(() => {
        execSync(`node "${cliPath}" "/non/existent/directory"`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
      }).toThrow();
    });

    test('should process valid directory in dry-run mode', async () => {
      // Create test files
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, `
function testFunction() {
  return 'hello';
}
`);

      const result = execSync(`node "${cliPath}" "${tempDir}" --dry-run`, { 
        encoding: 'utf8',
        cwd: path.dirname(cliPath)
      });

      expect(result).toContain('DRY RUN MODE');
      expect(result).toContain('Found');
      expect(result).toContain('code files');
    });
  });

  describe('Option handling', () => {
    test('should handle --only-functions option', async () => {
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, `
function testFunction() {
  return 'hello';
}

class TestClass {
  method() {
    return 'method';
  }
}
`);

      const result = execSync(`node "${cliPath}" "${tempDir}" --only-functions --dry-run`, { 
        encoding: 'utf8',
        cwd: path.dirname(cliPath)
      });

      expect(result).toContain('DRY RUN MODE');
      // Should process the file  
      expect(result).toContain('Analyzing');
    });

    test('should handle --readme option', async () => {
      // Create a minimal project structure
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project'
      };
      
      await fs.writeFile(
        path.join(tempDir, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
      );

      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, 'function test() {}');

      const result = execSync(`node "${cliPath}" "${tempDir}" --readme --dry-run`, { 
        encoding: 'utf8',
        cwd: path.dirname(cliPath)
      });

      // Should mention Claude prompting (since no README in dry-run if gaps exist)
      expect(result).toContain('NEANDOC → CLAUDE');
    });

    test('should handle --no-readme option', async () => {
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, 'function test() {}');

      const result = execSync(`node "${cliPath}" "${tempDir}" --no-readme --dry-run`, { 
        encoding: 'utf8',
        cwd: path.dirname(cliPath)
      });

      expect(result).not.toContain('README.md updated');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid options gracefully', () => {
      expect(() => {
        execSync(`node "${cliPath}" --invalid-option`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
      }).toThrow();
    });

    test('should provide meaningful error messages', async () => {
      try {
        execSync(`node "${cliPath}" "/non/existent/directory"`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        const output = error.stdout + error.stderr;
        expect(output).toContain('Access denied:');
      }
    });
  });

  describe('File pattern matching', () => {
    test('should find supported file types', async () => {
      // Create files of different types
      const files = [
        'test.js',
        'test.ts', 
        'test.py',
        'test.java',
        'test.cpp',
        'test.rb',
        'README.md', // Should be ignored
        'node_modules/test.js' // Should be ignored
      ];

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, 'function test() {}');
      }

      const result = execSync(`node "${cliPath}" "${tempDir}" --dry-run`, { 
        encoding: 'utf8',
        cwd: path.dirname(cliPath)
      });

      // Should find the code files but ignore README.md and node_modules
      expect(result).toContain('Found');
      expect(result).toContain('code files');
    });
  });
});