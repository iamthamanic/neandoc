const fs = require('fs-extra');
const path = require('path');

class ReadmeGenerator {
  constructor() {
    this.template = this.getDefaultTemplate();
  }

  getDefaultTemplate() {
    return {
      header: `# {PROJECT_NAME}

{DESCRIPTION}

## Features

{FEATURES}

## Installation

\`\`\`bash
npm install {PACKAGE_NAME}
\`\`\`

## Usage

{USAGE_EXAMPLES}

## How it works

{HOW_IT_WORKS}

## API Reference

{API_REFERENCE}

## Examples

{EXAMPLES}

## Contributing

{CONTRIBUTING}

## License

{LICENSE}
`;
    };
  }

  async generateReadme(projectDir, files, dryRun = false) {
    const readmePath = path.join(projectDir, 'README.md');
    
    // Analyze project structure
    const projectInfo = await this.analyzeProject(projectDir, files);
    
    // Generate content sections
    const content = await this.buildReadmeContent(projectInfo, files);
    
    if (dryRun) {
      console.log('\n📚 README.md Preview:');
      console.log('=' + '='.repeat(50));
      console.log(content);
      return;
    }
    
    // Check if README already exists
    let existingReadme = '';
    if (await fs.pathExists(readmePath)) {
      existingReadme = await fs.readFile(readmePath, 'utf8');
    }
    
    // Merge with existing README or create new one
    const finalContent = await this.mergeWithExisting(existingReadme, content, projectInfo);
    
    // Write README
    await fs.writeFile(readmePath, finalContent, 'utf8');
  }

  async analyzeProject(projectDir, files) {
    const packageJsonPath = path.join(projectDir, 'package.json');
    let packageJson = {};
    
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    }
    
    // Analyze file types and structure
    const fileTypes = this.analyzeFileTypes(files);
    const mainFiles = this.identifyMainFiles(files);
    const features = this.inferFeatures(files, packageJson);
    
    return {
      name: packageJson.name || path.basename(projectDir),
      description: packageJson.description || 'A software project',
      version: packageJson.version || '1.0.0',
      author: packageJson.author || '',
      license: packageJson.license || 'MIT',
      repository: packageJson.repository,
      keywords: packageJson.keywords || [],
      dependencies: packageJson.dependencies || {},
      scripts: packageJson.scripts || {},
      fileTypes,
      mainFiles,
      features,
      files: files.length
    };
  }

  analyzeFileTypes(files) {
    const types = {};
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      types[ext] = (types[ext] || 0) + 1;
    });
    return types;
  }

  identifyMainFiles(files) {
    const mainFiles = [];
    const patterns = [
      /index\.(js|ts|jsx|tsx)$/,
      /main\.(js|ts|jsx|tsx)$/,
      /app\.(js|ts|jsx|tsx)$/,
      /server\.(js|ts)$/,
      /cli\.(js|ts)$/
    ];
    
    files.forEach(file => {
      const basename = path.basename(file);
      if (patterns.some(pattern => pattern.test(basename))) {
        mainFiles.push(file);
      }
    });
    
    return mainFiles;
  }

  inferFeatures(files, packageJson) {
    const features = [];
    
    // Check dependencies for features
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.express || deps.fastify || deps.koa) {
      features.push('🌐 Web Server / API');
    }
    
    if (deps.react || deps.vue || deps.angular) {
      features.push('⚛️ Frontend Framework');
    }
    
    if (deps.commander || deps.yargs) {
      features.push('🖥️ Command Line Interface');
    }
    
    if (deps.jest || deps.mocha || deps.vitest) {
      features.push('🧪 Testing Framework');
    }
    
    if (deps.typescript || files.some(f => f.endsWith('.ts'))) {
      features.push('📝 TypeScript Support');
    }
    
    if (deps.mongoose || deps.sequelize || deps.prisma) {
      features.push('🗄️ Database Integration');
    }
    
    if (deps.socket && deps.socket.io) {
      features.push('🔄 Real-time Communication');
    }
    
    // Check file patterns
    if (files.some(f => f.includes('docker'))) {
      features.push('🐳 Docker Support');
    }
    
    if (files.some(f => f.includes('.github'))) {
      features.push('🔄 GitHub Actions');
    }
    
    return features;
  }

  async buildReadmeContent(projectInfo, files) {
    let content = this.template.header;
    
    // Replace placeholders
    content = content.replace('{PROJECT_NAME}', projectInfo.name);
    content = content.replace('{DESCRIPTION}', projectInfo.description);
    content = content.replace('{PACKAGE_NAME}', projectInfo.name);
    
    // Build features section
    const featuresSection = projectInfo.features.length > 0 
      ? projectInfo.features.map(f => `- ${f}`).join('\n')
      : '- Core functionality\n- Easy to use\n- Well documented';
    content = content.replace('{FEATURES}', featuresSection);
    
    // Build usage examples
    const usageSection = await this.generateUsageExamples(projectInfo);
    content = content.replace('{USAGE_EXAMPLES}', usageSection);
    
    // Build "How it works" section
    const howItWorksSection = await this.generateHowItWorks(projectInfo, files);
    content = content.replace('{HOW_IT_WORKS}', howItWorksSection);
    
    // Build API reference
    const apiSection = await this.generateApiReference(files);
    content = content.replace('{API_REFERENCE}', apiSection);
    
    // Build examples
    const examplesSection = await this.generateExamples(projectInfo);
    content = content.replace('{EXAMPLES}', examplesSection);
    
    // Build contributing section
    const contributingSection = this.generateContributingSection();
    content = content.replace('{CONTRIBUTING}', contributingSection);
    
    // Set license
    content = content.replace('{LICENSE}', projectInfo.license);
    
    return content;
  }

  async generateUsageExamples(projectInfo) {
    if (projectInfo.scripts.start) {
      return `\`\`\`bash
# Run the application
npm start

# Development mode
npm run dev
\`\`\``;
    }
    
    if (projectInfo.name.includes('cli') || Object.keys(projectInfo.scripts).includes('cli')) {
      return `\`\`\`bash
# Basic usage
npx ${projectInfo.name} [options]

# Show help
npx ${projectInfo.name} --help
\`\`\``;
    }
    
    return `\`\`\`javascript
const ${this.toCamelCase(projectInfo.name)} = require('${projectInfo.name}');

// Basic usage example
const result = ${this.toCamelCase(projectInfo.name)}.doSomething();
console.log(result);
\`\`\``;
  }

  async generateHowItWorks(projectInfo, files) {
    const sections = [];
    
    // Main architecture
    sections.push('### Architecture');
    sections.push(`${projectInfo.name} is built with the following components:`);
    sections.push('');
    
    // File structure overview
    const mainDirs = this.getMainDirectories(files);
    if (mainDirs.length > 0) {
      sections.push('### Project Structure');
      sections.push('```');
      mainDirs.forEach(dir => {
        sections.push(`${dir}/     # ${this.getDirectoryDescription(dir)}`);
      });
      sections.push('```');
      sections.push('');
    }
    
    // Core workflow
    sections.push('### Core Workflow');
    sections.push('1. **Input Processing**: Handles user input and configuration');
    sections.push('2. **Core Logic**: Executes main business logic');
    sections.push('3. **Output Generation**: Produces results in desired format');
    sections.push('');
    
    return sections.join('\n');
  }

  getMainDirectories(files) {
    const dirs = new Set();
    files.forEach(file => {
      const dir = path.dirname(file);
      const firstLevel = dir.split(path.sep)[0];
      if (firstLevel && firstLevel !== '.' && !firstLevel.startsWith('node_modules')) {
        dirs.add(firstLevel);
      }
    });
    return Array.from(dirs).sort();
  }

  getDirectoryDescription(dir) {
    const descriptions = {
      'src': 'Source code',
      'lib': 'Library modules',
      'bin': 'Executable scripts',
      'test': 'Test files',
      'tests': 'Test files',
      'config': 'Configuration files',
      'docs': 'Documentation',
      'examples': 'Example code',
      'assets': 'Static assets',
      'public': 'Public files',
      'build': 'Build output',
      'dist': 'Distribution files'
    };
    return descriptions[dir] || 'Project files';
  }

  async generateApiReference(files) {
    // This would analyze the actual code structure
    // For now, provide a basic template
    return `### Main Functions

\`\`\`javascript
// Core API methods will be documented here
// This section is automatically generated based on your code
\`\`\`

> 📝 **Note**: API reference is generated automatically when you run the documentation tool.`;
  }

  async generateExamples(projectInfo) {
    return `### Basic Example

\`\`\`javascript
// Example usage of ${projectInfo.name}
const example = require('${projectInfo.name}');

// Your example code here
console.log('Hello from ${projectInfo.name}!');
\`\`\`

### Advanced Example

\`\`\`javascript
// More complex usage example
// This will be customized based on your specific project
\`\`\``;
  }

  generateContributingSection() {
    return `1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request`;
  }

  async mergeWithExisting(existingContent, newContent, projectInfo) {
    if (!existingContent.trim()) {
      return newContent;
    }
    
    // Parse existing README sections
    const existingSections = this.parseReadmeSections(existingContent);
    const newSections = this.parseReadmeSections(newContent);
    
    // Merge sections, preserving manual content
    const mergedSections = { ...existingSections };
    
    // Update specific auto-generated sections
    const autoUpdateSections = ['How it works', 'API Reference'];
    autoUpdateSections.forEach(section => {
      if (newSections[section]) {
        mergedSections[section] = newSections[section];
      }
    });
    
    // Add new sections that don't exist
    Object.keys(newSections).forEach(section => {
      if (!mergedSections[section]) {
        mergedSections[section] = newSections[section];
      }
    });
    
    return this.rebuildReadmeFromSections(mergedSections);
  }

  parseReadmeSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent = [];
    
    lines.forEach(line => {
      const headerMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headerMatch) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = headerMatch[1];
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });
    
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }
    
    return sections;
  }

  rebuildReadmeFromSections(sections) {
    let content = '';
    Object.keys(sections).forEach(section => {
      content += `## ${section}\n`;
      content += sections[section];
      content += '\n\n';
    });
    return content.trim();
  }

  toCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }
}

module.exports = ReadmeGenerator;