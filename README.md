# Neandoc

🦣 **Primal Code. Modern Docs.**

Intelligenter Dokumentations-Assistent, der kontinuierlich deinen Code überwacht und Claude automatisch auffordert, fehlende Kommentare zu schreiben. Generiert technische Erklärungen für Entwickler UND einfache Erklärungen für Laien.

## Features

- 🔍 **Intelligente Lücken-Erkennung** - Unterscheidet technische vs. einfache Kommentare
- 🤖 **Automatische Claude-Prompts** - Generiert perfekt formatierte Aufträge für Claude
- 👁️ **Watch-Mode** - Kontinuierliche Überwachung alle X Minuten
- 🔄 **Daemon-Mode** - Läuft persistent im Hintergrund
- 📊 **Multi-File Analyse** - Comprehensive Prompts für ganze Projekte
- 🛡️ **Enterprise Security** - Path validation, input sanitization, atomic operations
- 🔒 **Production-Ready** - Race-condition-free, memory-leak-proof, ReDoS-protected
- ⚛️ **Multi-Language Support** (JS, TS, Python, Java, C++, C#, PHP, Ruby, Go)
- 📖 **Dual-Level Explanations** (technisch + einfach)
- 📚 **README Generation** - Automatische Projekt-Dokumentation

## Installation

```bash
# Global installation (recommended)
npm install -g neandoc

# Or use directly with npx (no installation needed)
npx neandoc@latest ./src
```

## Usage

### **Einmalige Analyse:**
```bash
# Analysiere Code und generiere Claude-Prompt
neandoc ./src

# Mit README-Generierung  
neandoc ./src --readme

# Preview-Modus (keine Änderungen)
neandoc ./src --dry-run
```

### **Watch-Mode (Game-Changer!):**
```bash
# Überwachung alle 5 Minuten
neandoc ./src --watch --interval 5

# Daemon-Mode (Hintergrund)
neandoc ./src --daemon --interval 10

# Mit README-Updates
neandoc ./src --watch --readme
```

### **Apply-Mode:**
```bash
# Claude-Response anwenden (Coming Soon)
neandoc ./src --apply claude-response.md
```

## How it works

### Architecture

Neandoc is built with enterprise-grade security and performance optimizations:

### Project Structure
```
bin/     # Executable scripts (CLI entry point)
config/  # Configuration files (prompts, settings)
lib/     # Core library modules
  ├── parser.js      # Multi-language code parsing
  ├── commentor.js   # Safe comment generation & insertion
  ├── mcp-client.js  # AI integration & watch mode
  └── readme.js      # Documentation generation
```

### Security Features ✅

- **Path Traversal Protection** - Validates all file paths to prevent directory escaping
- **Input Sanitization** - Validates function names, imports, and all user inputs
- **Atomic File Operations** - Race-condition-free file locking and backup system
- **Memory Leak Prevention** - Proper cleanup in watch mode and daemon processes
- **ReDoS Protection** - Safe regex patterns to prevent regex denial-of-service attacks

### **Neuer intelligenter Workflow:**

#### **1. Automatische Analyse:**
1. **Code-Scanning** - Findet Funktionen, Klassen, Variablen
2. **Gap-Detection** - Erkennt fehlende technische + einfache Kommentare
3. **Prompt-Generation** - Erstellt perfekt formatierte Claude-Aufträge
4. **Direct-Output** - Du kopierst Prompt → Claude macht den Rest

#### **2. Watch-Mode (Kontinuierlich):**
1. **Background-Monitoring** - Überwacht Code-Changes alle X Minuten
2. **Gap-Tracking** - Findet neue undokumentierte Funktionen
3. **Auto-Prompting** - Schickt Claude automatisch neue Aufträge
4. **Persistent-Reminders** - Nervt bis alles dokumentiert ist 😄

#### **3. Claude Integration:**
```
Neandoc → "Hey Claude, hier fehlen 3 Kommentare..."
Claude → Schreibt perfekte Dual-Level Dokumentation
User → Kopiert Kommentare in Code
Neandoc → "Danke! Überwache weiter..."
```

## API Reference

### CLI Commands

```bash
neandoc [directory] [options]
```

**Options:**
- `--watch` - Watch mode - kontinuierliche Überwachung
- `--daemon` - Daemon mode - läuft im Hintergrund  
- `--interval <minutes>` - Check-Intervall in Minuten (default: 5)
- `--apply <file>` - Claude-Response aus Datei anwenden
- `--readme` - README.md erstellen/aktualisieren
- `--dry-run` - Preview ohne Änderungen
- `--only-functions` - Nur Funktionen kommentieren
- `--no-readme` - Keine README-Generierung

### Core Classes

- **Parser** - Multi-language code analysis (10+ languages)
- **NeandocAssistant** - Intelligente Gap-Detection & Claude-Prompting
- **Commentor** - File-safe comment insertion with backup
- **ReadmeGenerator** - Intelligent README creation

## Examples

### **Typischer Workflow:**

```bash
# 1. Erste Analyse
neandoc ./src

# Output:
❌ Found 8 documentation gaps across 3 files!

🤖 NEANDOC → CLAUDE
==================================================
🦣 NEANDOC COMPREHENSIVE DOCUMENTATION REQUEST

Diese Funktionen brauchen Kommentare:

### validateInput (function) - Line 42
```javascript
function validateInput(data) {
  return data.length > 0 && data.match(/^[a-zA-Z]+$/);
}
```

AUFGABE: Erstelle technische + einfache Erklärungen...
==================================================

📋 Copy the prompt above and send it to Claude!
💡 Then run: neandoc --apply <claude-response-file>
```

### **Watch-Mode in Action:**

```bash
# 2. Kontinuierliche Überwachung starten
neandoc ./src --watch --interval 3

# Output:
🦣 Neandoc watching ./src for documentation gaps...
📅 Checking every 3 minutes

[14:32:15] 🔍 Checking documentation...
✅ All code properly documented!

[14:35:15] 🔍 Checking documentation...
❌ Found 2 documentation gaps!
🤖 Sending new prompt to Claude...

# → Läuft permanent und nervt Claude bei neuen Lücken! 😄
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

## Changelog

### v1.1.0 - Security & Performance Update ✅

**🔒 Security Improvements:**
- Fixed path traversal vulnerability (CVE prevention)
- Added input sanitization for all user inputs
- Implemented file size limits and permission checks

**⚡ Performance & Stability:**
- Fixed race condition in file locking system
- Eliminated memory leaks in watch mode
- Replaced ReDoS-vulnerable regex with safe parsers
- Improved error handling and recovery

**🛠️ Code Quality:**
- Split large functions for better maintainability
- Added atomic backup file operations
- Enhanced test coverage (25/25 tests passing)
- Improved error chaining and debugging

---

🦣 **Built with prehistoric wisdom and modern AI**