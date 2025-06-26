# Neandoc

🦣 **Primal Code. Modern Docs.**

AI-powered CLI tool for automatic code documentation. Neandoc generates technical comments for developers AND simple explanations for non-programmers, making your code accessible to everyone.

## Features

- 🖥️ Command Line Interface
- 📝 TypeScript Support  
- 🧪 Testing Framework
- ⚛️ Multi-language support (JS, TS, Python, Java, C++, C#, PHP, Ruby, Go)
- 🤖 AI-powered documentation generation
- 📚 Automatic README.md creation and updates
- 🔄 Dry-run mode for previewing changes
- 🎯 Selective commenting (functions only, classes only)
- 🌐 MCP (Model Context Protocol) integration
- 📖 Dual-level explanations (technical + simple)

## Installation

```bash
npm install -g neandoc
```

## Usage

```bash
# Document all files in ./src directory
npx neandoc ./src

# Create or update README.md
npx neandoc ./project --readme

# Preview changes without modifying files
npx neandoc ./src --dry-run

# Comment only functions
npx neandoc ./src --only-functions

# Skip README generation
npx neandoc ./src --no-readme
```

## How it works

### Architecture

Neandoc is built with the following components:

### Project Structure
```
bin/     # Executable scripts
config/  # Configuration files
lib/     # Library modules
```

### Core Workflow
1. **Input Processing**: Scans your codebase and identifies functions, classes, and variables
2. **AI Analysis**: Uses Claude (via MCP), OpenAI, or other LLMs to understand code context
3. **Comment Generation**: Creates both technical and simple explanations
4. **File Updates**: Intelligently inserts comments without breaking existing code
5. **README Generation**: Creates comprehensive documentation with "How it works" sections

## API Reference

### CLI Commands

```bash
neandoc [directory] [options]
```

**Options:**
- `--readme` - Create or update README.md
- `--dry-run` - Show preview without making changes  
- `--only-functions` - Comment only functions
- `--no-readme` - Skip README generation

### Core Classes

- **Parser** - Multi-language code analysis
- **Commentor** - AI-powered comment generation
- **MCPClient** - LLM integration (Claude, OpenAI, MCP)
- **ReadmeGenerator** - Intelligent README creation

## Examples

### Basic Example

```bash
# Document your entire project
npx neandoc ./src

# Output: All files get dual-level comments
/**
 * Technische Erklärung:
 * Diese Funktion implementiert Benutzereingabe-Validierung mit Regex-Pattern-Matching
 *
 * Einfache Erklärung:  
 * Stell dir vor, das ist wie ein Türsteher - er prüft, ob deine Eingabe die Regeln befolgt, bevor sie reingelassen wird.
 */
function validateInput(input) {
  // your code here
}
```

### Advanced Example

```bash
# Full project documentation workflow
npx neandoc ./src --readme --dry-run  # Preview first
npx neandoc ./src --readme            # Apply changes
```

## Configuration

Customize prompts and behavior in `config/prompts.json`:

```json
{
  "basePrompt": "Du bist Neandoc...",
  "commentStyle": {
    "technical": { "focus": ["Implementation details", "Parameters"] },
    "simple": { "focus": ["Everyday comparisons", "Basic functionality"] }
  }
}
```

## Supported Languages

- **JavaScript/TypeScript** (.js, .jsx, .ts, .tsx)
- **Python** (.py)
- **Java** (.java)
- **C/C++** (.c, .cpp)
- **C#** (.cs)
- **PHP** (.php)
- **Ruby** (.rb)
- **Go** (.go)

## Integration

### Claude Code (MCP)
Neandoc detects when running in Claude Code environment and uses MCP for optimal AI integration.

### API Integration
Supports direct integration with:
- Claude (Anthropic)
- OpenAI GPT models
- Custom LLM endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Philosophy

> "Make code so clear that even a caveman could understand it."

Neandoc bridges the gap between technical complexity and human understanding. Every function deserves an explanation that both your senior developer and your project manager can understand.

## License

MIT

---

🦣 **Built with prehistoric wisdom and modern AI**