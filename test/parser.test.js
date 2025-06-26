const Parser = require('../lib/parser');
const fs = require('fs-extra');
const path = require('path');

describe('Parser', () => {
  let parser;
  let tempDir;

  beforeEach(async () => {
    parser = new Parser();
    tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('JavaScript parsing', () => {
    test('should parse function declarations', async () => {
      const testCode = `
function testFunction(param1, param2) {
  return param1 + param2;
}

const arrowFunction = (a, b) => {
  return a * b;
};

const asyncFunction = async function() {
  return await somePromise();
};
`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      const result = await parser.parseFile(testFile);
      
      expect(result.functions).toHaveLength(3);
      expect(result.functions[0].name).toBe('testFunction');
      expect(result.functions[1].name).toBe('arrowFunction');
      expect(result.functions[2].name).toBe('asyncFunction');
    });

    test('should parse class declarations', async () => {
      const testCode = `
class TestClass {
  constructor() {
    this.value = 0;
  }
  
  method() {
    return this.value;
  }
}

class ExtendedClass extends TestClass {
  extendedMethod() {
    super.method();
  }
}
`;
      
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, testCode);
      
      const result = await parser.parseFile(testFile);
      
      expect(result.classes).toHaveLength(2);
      expect(result.classes[0].name).toBe('TestClass');
      expect(result.classes[1].name).toBe('ExtendedClass');
    });

    test('should handle malicious regex input safely', async () => {
      // Test for ReDoS vulnerability
      const maliciousCode = 'a'.repeat(10000) + 'function' + 'b'.repeat(10000);
      
      const testFile = path.join(tempDir, 'malicious.js');
      await fs.writeFile(testFile, maliciousCode);
      
      const startTime = Date.now();
      const result = await parser.parseFile(testFile);
      const endTime = Date.now();
      
      // Should complete within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.functions).toBeDefined();
    });
  });

  describe('Python parsing', () => {
    test('should parse Python functions', async () => {
      const testCode = `
def simple_function(param1, param2):
    return param1 + param2

def complex_function(
    param1: str,
    param2: int = 0
) -> str:
    return f"{param1}: {param2}"

class TestClass:
    def method(self):
        pass
`;
      
      const testFile = path.join(tempDir, 'test.py');
      await fs.writeFile(testFile, testCode);
      
      const result = await parser.parseFile(testFile);
      
      expect(result.functions).toHaveLength(3);
      expect(result.classes).toHaveLength(1);
      expect(result.functions[0].name).toBe('simple_function');
      expect(result.functions[1].name).toBe('complex_function');
    });
  });

  describe('Error handling', () => {
    test('should handle non-existent files gracefully', async () => {
      await expect(parser.parseFile('/non/existent/file.js'))
        .rejects
        .toThrow();
    });

    test('should handle empty files', async () => {
      const testFile = path.join(tempDir, 'empty.js');
      await fs.writeFile(testFile, '');
      
      const result = await parser.parseFile(testFile);
      
      expect(result.functions).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
    });

    test('should handle binary files gracefully', async () => {
      const testFile = path.join(tempDir, 'binary.jpg');
      const binaryData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      await fs.writeFile(testFile, binaryData);
      
      const result = await parser.parseFile(testFile);
      
      expect(result.functions).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
    });
  });

  describe('Line number accuracy', () => {
    test('should report correct line numbers', async () => {
      const testCode = `// Line 1
// Line 2
function firstFunction() {
  // Line 4
}

// Line 7
function secondFunction() {
  // Line 9
}`;
      
      const testFile = path.join(tempDir, 'lines.js');
      await fs.writeFile(testFile, testCode);
      
      const result = await parser.parseFile(testFile);
      
      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].lineNumber).toBe(3);
      expect(result.functions[1].lineNumber).toBe(8);
    });
  });
});