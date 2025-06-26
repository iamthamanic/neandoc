const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class NeandocAssistant {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 300000; // 5 minutes
    this.watchMode = options.watchMode || false;
    this.daemonMode = options.daemonMode || false;
    this.lastPromptTime = null;
    this.isRunning = false;
  }

  async analyzeAndPrompt(codeStructure, prompts) {
    const analysis = this.analyzeDocumentationGaps(codeStructure);
    
    if (analysis.hasMissingDocs) {
      const prompt = this.generateClaudePrompt(analysis, codeStructure);
      this.sendPromptToClaude(prompt);
      return analysis;
    }
    
    console.log(chalk.green('✅ All code is properly documented!'));
    return analysis;
  }

  analyzeDocumentationGaps(codeStructure) {
    const gaps = {
      missingTechnical: [],
      missingSimple: [],
      hasMissingDocs: false,
      totalElements: 0
    };
    
    // Check functions
    for (const func of codeStructure.functions) {
      gaps.totalElements++;
      const hasDocumentation = this.checkExistingDocumentation(codeStructure.content, func);
      
      if (!hasDocumentation.technical) {
        gaps.missingTechnical.push(func);
      }
      if (!hasDocumentation.simple) {
        gaps.missingSimple.push(func);
      }
    }
    
    // Check classes
    for (const cls of codeStructure.classes) {
      gaps.totalElements++;
      const hasDocumentation = this.checkExistingDocumentation(codeStructure.content, cls);
      
      if (!hasDocumentation.technical) {
        gaps.missingTechnical.push(cls);
      }
      if (!hasDocumentation.simple) {
        gaps.missingSimple.push(cls);
      }
    }
    
    gaps.hasMissingDocs = gaps.missingTechnical.length > 0 || gaps.missingSimple.length > 0;
    return gaps;
  }

  checkExistingDocumentation(content, element) {
    const lines = content.split('\n');
    const elementLine = element.lineNumber - 1;
    
    // Check 10 lines before the element for existing comments
    const checkStart = Math.max(0, elementLine - 10);
    const contextLines = lines.slice(checkStart, elementLine).join('\n');
    
    const hasTechnical = /\/\*\*[\s\S]*?Technische Erklärung|Technical Explanation/i.test(contextLines);
    const hasSimple = /\/\*\*[\s\S]*?Einfache Erklärung|Simple Explanation/i.test(contextLines);
    
    return {
      technical: hasTechnical,
      simple: hasSimple,
      hasAny: hasTechnical || hasSimple
    };
  }

  generateClaudePrompt(analysis, codeStructure) {
    const prompt = `🦣 **NEANDOC DOCUMENTATION REQUEST**

Du bist ein Code-Dokumentations-Experte. Folgende Elemente brauchen Kommentare:

`;
    
    let promptContent = prompt;
    
    // Add missing technical documentation
    if (analysis.missingTechnical.length > 0) {
      promptContent += `## 🔧 TECHNISCHE KOMMENTARE FEHLEN:\n\n`;
      for (const element of analysis.missingTechnical) {
        const context = this.extractCodeContext(codeStructure.content, element);
        promptContent += `### ${element.name} (${element.type})\n`;
        promptContent += `**Datei:** ${codeStructure.filePath}:${element.lineNumber}\n`;
        promptContent += `**Code:**\n\`\`\`${codeStructure.extension.slice(1)}\n${context}\n\`\`\`\n\n`;
      }
    }
    
    // Add missing simple explanations
    if (analysis.missingSimple.length > 0) {
      promptContent += `## 👥 EINFACHE ERKLÄRUNGEN FEHLEN:\n\n`;
      for (const element of analysis.missingSimple) {
        promptContent += `- ${element.name} (${element.type}) in ${codeStructure.filePath}:${element.lineNumber}\n`;
      }
    }
    
    promptContent += `\n## 📋 AUFGABE:\n\n`;
    promptContent += `Erstelle für jedes Element oben:\n`;
    promptContent += `1. **Technische Erklärung** für Entwickler\n`;
    promptContent += `2. **Einfache Erklärung** für Laien (Alltagsvergleiche)\n\n`;
    promptContent += `**Format:**\n\`\`\`\n/**\n * Technische Erklärung:\n * [Detaillierte tech. Beschreibung]\n *\n * Einfache Erklärung:\n * [Alltagsvergleich für Laien]\n */\n\`\`\`\n\n`;
    promptContent += `**Wichtig:** Füge die Kommentare direkt über die entsprechenden Funktionen/Klassen ein!`;
    
    return promptContent;
  }

  sendPromptToClaude(prompt) {
    console.log(chalk.blue('\n🤖 NEANDOC → CLAUDE'));
    console.log(chalk.gray('=' + '='.repeat(50)));
    console.log(prompt);
    console.log(chalk.gray('=' + '='.repeat(50)));
    console.log(chalk.yellow('\n📋 Copy the prompt above and send it to Claude!'));
    console.log(chalk.cyan('💡 Then run: npx neandoc --apply <claude-response-file>'));
    
    this.lastPromptTime = Date.now();
  }

  extractCodeContext(content, element, contextLines = 5) {
    const lines = content.split('\n');
    const elementLine = element.lineNumber - 1;
    
    const start = Math.max(0, elementLine - contextLines);
    const end = Math.min(lines.length, elementLine + contextLines + 10);
    
    return lines.slice(start, end).join('\n');
  }

  async startWatchMode(directory, options = {}) {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️  Watch mode already running'));
      return;
    }
    
    this.isRunning = true;
    console.log(chalk.blue(`🦣 Neandoc watching ${directory} for documentation gaps...`));
    console.log(chalk.gray(`📅 Checking every ${this.checkInterval / 1000} seconds`));
    
    // Initial check
    await this.performCheck(directory, options);
    
    // Set up interval
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      await this.performCheck(directory, options);
    }, this.checkInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n⏹️  Stopping Neandoc watch mode...'));
      this.isRunning = false;
      clearInterval(interval);
      process.exit(0);
    });
  }

  async performCheck(directory, options) {
    try {
      const timestamp = new Date().toLocaleTimeString();
      console.log(chalk.gray(`\n[${timestamp}] 🔍 Checking documentation...`));
      
      const Parser = require('./parser');
      const parser = new Parser();
      
      // Find and analyze files
      const glob = require('glob');
      const path = require('path');
      const patterns = ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.py'];
      
      let totalGaps = 0;
      const allAnalyses = [];
      
      for (const pattern of patterns) {
        const files = await glob.glob(path.join(directory, pattern), {
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
        });
        
        for (const file of files) {
          const codeStructure = await parser.parseFile(file);
          const analysis = this.analyzeDocumentationGaps(codeStructure);
          
          if (analysis.hasMissingDocs) {
            totalGaps += analysis.missingTechnical.length + analysis.missingSimple.length;
            allAnalyses.push({ file, analysis, codeStructure });
          }
        }
      }
      
      if (totalGaps > 0) {
        console.log(chalk.red(`❌ Found ${totalGaps} documentation gaps!`));
        
        // Generate comprehensive prompt for all gaps
        if (allAnalyses.length > 0) {
          const comprehensivePrompt = this.generateComprehensivePrompt(allAnalyses);
          this.sendPromptToClaude(comprehensivePrompt);
        }
      } else {
        console.log(chalk.green(`✅ All code properly documented!`));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Check failed: ${error.message}`));
    }
  }

  generateComprehensivePrompt(analyses) {
    let prompt = `🦣 **NEANDOC COMPREHENSIVE DOCUMENTATION REQUEST**\n\n`;
    prompt += `Du bist Code-Dokumentations-Experte. Mehrere Dateien brauchen Kommentare:\n\n`;
    
    for (const { file, analysis, codeStructure } of analyses) {
      if (analysis.hasMissingDocs) {
        prompt += `## 📁 ${file}\n\n`;
        
        if (analysis.missingTechnical.length > 0) {
          prompt += `**Fehlende technische Kommentare:**\n`;
          for (const element of analysis.missingTechnical) {
            const context = this.extractCodeContext(codeStructure.content, element, 3);
            prompt += `### ${element.name} (${element.type}) - Line ${element.lineNumber}\n`;
            prompt += `\`\`\`${codeStructure.extension.slice(1)}\n${context}\n\`\`\`\n\n`;
          }
        }
        
        if (analysis.missingSimple.length > 0) {
          prompt += `**Fehlende einfache Erklärungen:** ${analysis.missingSimple.map(e => e.name).join(', ')}\n\n`;
        }
      }
    }
    
    prompt += `## 📋 AUFGABE:\n\n`;
    prompt += `Für jedes Element:\n`;
    prompt += `1. **Technische Erklärung** für Entwickler\n`;
    prompt += `2. **Einfache Erklärung** für Laien\n\n`;
    prompt += `**Format:** Füge Kommentare direkt über die Funktionen ein:\n`;
    prompt += `\`\`\`\n/**\n * Technische Erklärung: [Details]\n * Einfache Erklärung: [Alltagsvergleich]\n */\n\`\`\`\n\n`;
    prompt += `**Wichtig:** Bearbeite alle Dateien vollständig!`;
    
    return prompt;
  }

  buildPrompt(codeStructure, prompts) {
    const basePrompt = prompts.basePrompt || `Du bist Neandoc, ein AI-Assistent, der Code so kommentiert und erklärt, dass ihn sowohl Entwickler als auch Laien verstehen.

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

Der Code selbst darf nicht verändert werden.`;

    return basePrompt;
  }

  extractContext(content, startIndex, contextSize = 200) {
    const start = Math.max(0, startIndex - contextSize);
    const end = Math.min(content.length, startIndex + contextSize);
    return content.substring(start, end);
  }

  async isMCPAvailable() {
    // Check if MCP server is available
    try {
      // This would check for MCP server availability
      return false; // For now, assume not available
    } catch (error) {
      return false;
    }
  }

  async callMCPProtocol(codeStructure, prompts) {
    // Implement MCP protocol communication
    throw new Error('MCP protocol not yet implemented');
  }

  // Mock responses for development
  async mockClaudeResponse(codeStructure, prompts) {
    return this.generateWithClaude(codeStructure, prompts);
  }

  async mockOpenAIResponse(codeStructure, prompts) {
    return this.generateWithClaude(codeStructure, prompts);
  }
}

module.exports = NeandocAssistant;