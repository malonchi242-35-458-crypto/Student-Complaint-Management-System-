# Student Complaint Management System

A desktop Student Complaint Management System built with ElectronJS.

## Project files

- `main.js` — Electron Main process, IPC handlers, and file persistence.
- `preload.js` — secure `contextBridge` API.
- `index.html` — application interface.
- `renderer.js` — form handling, validation, search, filtering, CRUD actions, and rendering.
- `style.css` — UI design and responsive layout.
- `package.json` — Electron project configuration.
- `complaints.json` — optional sample data file for reference. The application stores live data in Electron's user-data folder.

## Run in VS Code

VS Code is the editor. Electron itself still needs Node.js/npm to install and run.

1. Open this folder in Visual Studio Code.
2. Open **Terminal → New Terminal**.
3. Run:

```bash
npm install
```

4. Then run:

```bash
npm start
```

## GitHub

Do not upload `node_modules`.

A `.gitignore` file is included for this purpose.
