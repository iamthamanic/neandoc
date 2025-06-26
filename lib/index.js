const Parser = require('./parser');
const Commentor = require('./commentor');
const MCPClient = require('./mcp-client');
const ReadmeGenerator = require('./readme');

module.exports = {
  Parser,
  Commentor,
  MCPClient,
  ReadmeGenerator,
  
  // Convenience factory functions
  createParser: (options) => new Parser(options),
  createCommentor: (options) => new Commentor(options),
  createMCPClient: (options) => new MCPClient(options),
  createReadmeGenerator: (options) => new ReadmeGenerator(options),
  
  // Version info
  version: require('../package.json').version,
  
  // Quick API for programmatic use
  async documentCode(directory, options = {}) {
    const parser = new Parser();
    const commentor = new Commentor(options);
    const readmeGenerator = new ReadmeGenerator();
    
    const glob = require('glob');
    const path = require('path');
    
    // Find code files
    const patterns = [
      '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
      '**/*.py', '**/*.java', '**/*.cpp', '**/*.c',
      '**/*.cs', '**/*.php', '**/*.rb', '**/*.go'
    ];
    
    const files = [];
    for (const pattern of patterns) {
      const matches = await glob.glob(path.join(directory, pattern), {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
      });
      files.push(...matches);
    }
    
    const results = [];
    
    // Process each file
    for (const file of files) {
      try {
        const codeStructure = await parser.parseFile(file);
        const comments = await commentor.generateComments(codeStructure, options);
        
        if (!options.dryRun) {
          await commentor.applyComments(file, comments);
        }
        
        results.push({
          file,
          comments: comments.length,
          status: 'success'
        });
      } catch (error) {
        results.push({
          file,
          error: error.message,
          status: 'error'
        });
      }
    }
    
    // Generate README if requested
    if (options.generateReadme !== false) {
      try {
        await readmeGenerator.generateReadme(directory, files, options.dryRun);
        results.push({
          file: 'README.md',
          status: 'generated'
        });
      } catch (error) {
        results.push({
          file: 'README.md',
          error: error.message,
          status: 'error'
        });
      }
    }
    
    return results;
  }
};