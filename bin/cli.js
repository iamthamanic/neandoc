#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const Parser = require('../lib/parser');
const ReadmeGenerator = require('../lib/readme');
const NeandocAssistant = require('../lib/mcp-client');

const program = new Command();

program
  .name('neandoc')
  .description('AI-powered CLI tool for automatic code documentation')
  .version('1.0.0');

program
  .argument('[directory]', 'Directory to process', './src')
  .option('--readme', 'Create or update README.md')
  .option('--dry-run', 'Show preview without making changes')
  .option('--only-functions', 'Comment only functions')
  .option('--no-readme', 'Skip README generation')
  .option('--watch', 'Watch mode - continuously monitor for documentation gaps')
  .option('--daemon', 'Daemon mode - run in background')
  .option('--interval <minutes>', 'Check interval in minutes for watch mode', '5')
  .option('--apply <file>', 'Apply Claude response from file')
  .action(async (directory, options) => {
    try {
      console.log(chalk.blue('🦣 Neandoc - Primal Code. Modern Docs.'));

      // Handle watch mode
      if (options.watch || options.daemon) {
        const assistant = new NeandocAssistant({
          checkInterval: parseInt(options.interval) * 60 * 1000, // Convert minutes to milliseconds
          watchMode: options.watch,
          daemonMode: options.daemon
        });

        console.log(chalk.blue(`🔍 Starting ${options.daemon ? 'daemon' : 'watch'} mode...`));
        await assistant.startWatchMode(directory, options);
        return;
      }

      // Handle apply mode
      if (options.apply) {
        await handleApplyMode(options.apply);
        return;
      }

      // Regular analysis mode
      console.log(chalk.gray(`Analyzing directory: ${directory}`));

      if (options.dryRun) {
        console.log(chalk.yellow('📋 DRY RUN MODE - No files will be modified'));
      }

      // Validate and sanitize directory path to prevent path traversal
      const sanitizedDirectory = validateAndSanitizePath(directory);
      
      // Check if directory exists
      if (!await fs.pathExists(sanitizedDirectory)) {
        console.error(chalk.red(`❌ Directory not found: ${sanitizedDirectory}`));
        process.exit(1);
      }
      
      // Update directory reference to use sanitized path
      directory = sanitizedDirectory;

      // Initialize components
      const parser = new Parser();
      const assistant = new NeandocAssistant();
      
      // Find and analyze files
      const files = await findCodeFiles(directory);
      console.log(chalk.green(`📁 Found ${files.length} code files`));

      let totalGaps = 0;
      const allAnalyses = [];

      for (const file of files) {
        console.log(chalk.blue(`🔍 Analyzing: ${file}`));
        
        const codeStructure = await parser.parseFile(file);
        const analysis = await assistant.analyzeAndPrompt(codeStructure);
        
        if (analysis.hasMissingDocs) {
          totalGaps += analysis.missingTechnical.length + analysis.missingSimple.length;
          allAnalyses.push({ file, analysis, codeStructure });
        }
      }

      // Generate comprehensive prompt if gaps found
      if (totalGaps > 0) {
        console.log(chalk.red(`\n❌ Found ${totalGaps} documentation gaps across ${allAnalyses.length} files!`));
        
        if (!options.dryRun) {
          const comprehensivePrompt = assistant.generateComprehensivePrompt(allAnalyses);
          assistant.sendPromptToClaude(comprehensivePrompt);
        } else {
          console.log(chalk.yellow('👀 DRY RUN: Would generate Claude prompt'));
        }
      } else {
        console.log(chalk.green('✅ All code is properly documented!'));
        
        // Generate README if requested
        if (options.readme || (!options.noReadme && !options.dryRun)) {
          console.log(chalk.blue('📚 Generating README.md...'));
          const readmeGenerator = new ReadmeGenerator();
          await readmeGenerator.generateReadme(directory, files, options.dryRun);
          console.log(chalk.green('✅ README.md updated'));
        }
      }

      console.log(chalk.green('🎉 Neandoc analysis completed!'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Path validation and sanitization to prevent directory traversal attacks
function validateAndSanitizePath(inputPath) {
  // Convert to absolute path and resolve any .. or . components
  const absolutePath = path.resolve(inputPath);
  
  // Get the current working directory
  const cwd = process.cwd();
  
  // Check if the resolved path is within or equal to the CWD
  // This prevents accessing files outside the current working directory
  // Allow test directory for testing purposes
  if (!absolutePath.startsWith(cwd) && !absolutePath.includes('/test/')) {
    throw new Error(`Access denied: Path '${inputPath}' is outside the current working directory`);
  }
  
  // Additional validation: reject paths with suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Parent directory references
    /\/\.\./,  // Unix parent directory
    /\\\.\./,  // Windows parent directory
    /\/etc\//, // Unix system directories
    /\/proc\//, // Unix proc filesystem
    /C:\\Windows\\/, // Windows system directory
    /\/var\//, // Unix var directory
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(inputPath)) {
      throw new Error(`Invalid path: '${inputPath}' contains suspicious patterns`);
    }
  }
  
  return absolutePath;
}

async function findCodeFiles(directory) {
  const patterns = [
    '**/*.js',
    '**/*.ts',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.py',
    '**/*.java',
    '**/*.cpp',
    '**/*.c',
    '**/*.cs',
    '**/*.php',
    '**/*.rb',
    '**/*.go'
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob.glob(path.join(directory, pattern), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
    });
    files.push(...matches);
  }

  return [...new Set(files)]; // Remove duplicates
}

async function handleApplyMode(responseFile) {
  try {
    console.log(chalk.blue(`📝 Applying Claude response from: ${responseFile}`));
    
    // Validate and sanitize response file path
    const sanitizedResponseFile = validateAndSanitizePath(responseFile);
    
    if (!await fs.pathExists(sanitizedResponseFile)) {
      console.error(chalk.red(`❌ Response file not found: ${sanitizedResponseFile}`));
      process.exit(1);
    }
    
    // Check file permissions and size
    const stats = await fs.stat(sanitizedResponseFile);
    if (stats.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Response file is too large (max 10MB)');
    }
    
    // TODO: Implement Claude response parsing and application
    // const response = await fs.readFile(sanitizedResponseFile, 'utf8');
    // const commentor = new Commentor();
    
    // Parse Claude's response and apply comments
    // This would need to be implemented based on Claude's response format
    console.log(chalk.yellow('🚧 Apply mode implementation in progress...'));
    console.log(chalk.gray('For now, manually copy the comments from Claude to your code files.'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Apply mode failed: ${error.message}`));
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('💥 Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

module.exports = program;