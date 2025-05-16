# SQLearner eine SQL-Übungsplattform

## Inhaltsverzeichnis
- [Projektüberblick](#projektüberblick)
- [Verzeichnisstruktur](#verzeichnisstruktur)
- [Branch-Strategie](#branch-strategie)
- [Commit-Konventionen](#commit-konventionen)
- [Rollen](#rollen)
- [Workflow](#workflow)

---

## Projektüberblick
Diese Anwendung ist eine interaktive Online-Plattform für SQL-Übungen im Rahmen der Vorlesung "Datenbanksysteme". Studierende können SQL-Abfragen eingeben, ausführen und direktes Feedback erhalten. Dozierende und Tutoren verwalten Aufgaben, erstellen neue Challenges und verfolgen den Lernfortschritt.

**Ziel der ersten Projektphase (12.05.2025 – 13.06.2025):**
- Benutzer- und Rollenverwaltung (Student, Tutor, Admin)
- Import und Verwaltung von Datenbanken (.sql)
- CRUD für SQL-Übungsaufgaben
- Ausführen von Queries mit Ergebnistabelle im Frontend

---

## Verzeichnisstruktur
Beispiel-Hierarchie im Repo:
/frontend    – Angular-App (UI, Komponenten, Services)
/backend     – NestJS-App (Module, Controller, Services)
/database    – SQL-Dumps & Migrationen
/docs        – Weitere Projektdokumentation

---

## Branch-Strategie
Wir nutzen eine schlanke Gitflow-Variante, um Stabilität und Agilität zu kombinieren:

- **`main`**  
  - Geschützter Release-Branch  
  - Nur über Pull Requests (min. 1 Review und grüne CI)  
  - Enthält abgeschlossene, getestete Releases

- **`develop`**  
  - Integrations-Branch für alle Features  
  - Automatisches Deployment zur Test-/Staging-Umgebung möglich

- **`feature/*`**  
  - Kurz beschreibender Name, z. B. `feature/auth-login`  
  - Branch von `develop`  
  - Nach Fertigstellung: PR zurück in `develop`

- **`hotfix/*`**  
  - Für dringende Bugfixes auf `main`  
  - Nach Merge in `main` Release, dann PR von `main` nach `develop`

**Branch Protection Rules:**  
- `main`: min. 1 Review, alle CI-Checks grün, keine Direkt-Pushes  
- `develop`: (optional) Status-Checks und/oder Reviews zwingend

---

## Commit-Konventionen
Kurze Präfixe am Zeilenanfang sorgen für Übersicht in der Historie:

| Präfix | Bedeutung                                           |
|:------:|-----------------------------------------------------|
| `+`    | Neue Funktion (feat)                                |
| `-`    | Funktion entfernt (rem)                             |
| `^`    | Refactoring / Code-Cleanup (refactor/chore)         |
| `#`    | Bugfix (fix)                                        |
| `?`    | Dokumentation (docs)                                |
| `*`    | Tests hinzugefügt/angepasst (test)                  |
| `$`    | CI/CD oder Konfig-Änderung (ci/chore)               |

**Beispiele:**
`+` Implement user registration endpoint
`-` Removed legacy auth middleware
`^` Refactored error-handling in AuthService
`#` Fixed query
`?` Added README section for commit conventions
`*` Added Jest smoke-tests for /auth routes
`$` Updated GitHub Actions workflow to include smoke-tests

---

## Rollen
Wir unterscheiden drei Verantwortungsbereiche:

- **PM** (Product Owner / Projektmanager)  
  - Priorisierung der Aufgaben  
  - Code Review für main
  - Sprint-Planung & Review

- **Frontend-Team**  
  - Angular-Komponenten & Services  
  - UI/UX & Styling (Material Design)  
  - Integration mit Backend-Endpunkten

- **Backend-Team**  
  - NestJS-Module & Controller  
  - Datenbank-Schema & Migrationen  
  - Authentifizierung & Aufgaben-API

---

## Workflow 
1. **Branch erzeugen**:  
  `git checkout develop`
  `git checkout -b feature/<kurz>` 
2. **Arbeiten & Committen**: Nutze Commit-Präfixe, commite oft mit klaren Nachrichten.
3. **Push & PR**: 
  `git push -u origin feature/<kurz>`
  Erstelle PR → feature/* → develop.
4. **Review & Merge**: Mind. 1 Reviewer, alle CI-Checks müssen grün sein.
5. **Automationen**: Issues wechseln automatisch Spalten im Projekt-Board.

---
