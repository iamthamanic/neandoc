# Neandoc

🦣 **Primal Code. Modern Docs.**

Intelligenter Dokumentations-Assistent, der kontinuierlich deinen Code überwacht und Claude automatisch auffordert, fehlende Kommentare zu schreiben. Generiert technische Erklärungen für Entwickler UND einfache Erklärungen für Laien.

## Features

- 🔍 **Intelligente Lücken-Erkennung** - Unterscheidet technische vs. einfache Kommentare
- 🤖 **Automatische Claude-Prompts** - Generiert perfekt formatierte Aufträge für Claude
- 👁️ **Watch-Mode** - Kontinuierliche Überwachung alle X Minuten
- 🔄 **Daemon-Mode** - Läuft persistent im Hintergrund
- 📊 **Multi-File Analyse** - Comprehensive Prompts für ganze Projekte
- 🛡️ **File-Safety** - Backup-System für sichere Operationen
- ⚛️ **Multi-Language Support** (JS, TS, Python, Java, C++, C#, PHP, Ruby, Go)
- 📖 **Dual-Level Explanations** (technisch + einfach)
- 📚 **README Generation** - Automatische Projekt-Dokumentation

## Installation

```bash
npm install -g neandoc
```

## Usage

### **Einmalige Analyse:**
```bash
# Analysiere Code und generiere Claude-Prompt
npx neandoc ./src

# Mit README-Generierung
npx neandoc ./src --readme

# Preview-Modus (keine Änderungen)
npx neandoc ./src --dry-run
```

### **Watch-Mode (Game-Changer!):**
```bash
# Überwachung alle 5 Minuten
npx neandoc ./src --watch --interval 5

# Daemon-Mode (Hintergrund)
npx neandoc ./src --daemon --interval 10

# Mit README-Updates
npx neandoc ./src --watch --readme
```

### **Apply-Mode:**
```bash
# Claude-Response anwenden (Coming Soon)
npx neandoc ./src --apply claude-response.md
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
npx neandoc ./src

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
💡 Then run: npx neandoc --apply <claude-response-file>
```

### **Watch-Mode in Action:**

```bash
# 2. Kontinuierliche Überwachung starten
npx neandoc ./src --watch --interval 3

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

🦣 **Built with prehistoric wisdom and modern AI**