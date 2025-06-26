# Raggadon Integration für Claude Code

Dieses Dokument definiert, wie Claude Code mit Raggadon interagieren soll.

## Befehle

Wenn der User einen der folgenden Befehle eingibt, führe die entsprechende Aktion aus:

### `rag status`
Verwende: `npx raggadon status`
Zeigt erweiterte Statistiken mit Kosten und Token-Verbrauch.

### `rag save "information"`
Verwende: `npx raggadon save "information"`
Speichere wichtige Informationen mit dem angegebenen Text.

### `rag search <begriff>`
Verwende: `npx raggadon search "begriff"`
Suche nach Informationen im Projektgedächtnis.

### `rag summary`
Zeige eine Zusammenfassung der gespeicherten Informationen für das aktuelle Projekt.

## Automatische Integration

### Was automatisch gespeichert werden soll:

1. **Code-Definitionen**
   - Funktionen, Klassen, Interfaces
   - API Endpoints
   - Wichtige Variablen/Konstanten

2. **Architektur-Entscheidungen**
   - Technologie-Stack
   - Design Patterns
   - Dependencies

3. **Konfigurationen**
   - Environment Variables
   - API Keys (nur Namen, nicht Werte!)
   - Datenbank-Schemas

4. **Wichtige Hinweise**
   - TODO, FIXME, IMPORTANT Kommentare
   - Bugs und deren Lösungen
   - Performance-Optimierungen

### Proaktives Verhalten:

1. **Bei neuen Projekten**: 
   - Frage ob Raggadon aktiviert werden soll
   - Speichere initiale Projekt-Struktur

2. **Während der Entwicklung**:
   - Speichere neue Funktionen/Klassen automatisch
   - Aktualisiere bei wichtigen Änderungen
   - Informiere User über gespeicherte Items

3. **Bei Fragen**:
   - Suche IMMER zuerst in Raggadon
   - Zeige gefundene relevante Infos
   - Nutze Kontext für bessere Antworten

## Integration auf neuem Rechner

Wenn User fragt wie Raggadon auf neuem Rechner eingerichtet wird:
1. Verweise auf SETUP_NEW_MACHINE.md
2. Biete an, die Schritte durchzugehen
3. Prüfe ob alle Dependencies vorhanden sind