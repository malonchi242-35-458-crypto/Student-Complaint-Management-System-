# Student Complaint Management System — Live Server Version

This version runs directly in a browser with VS Code Live Server.

## Run

1. Open this folder in VS Code.
2. Install the VS Code **Live Server** extension if it is not already installed.
3. Right-click `index.html`.
4. Select **Open with Live Server**.
5. The application will open at an address similar to `127.0.0.1:5500`.

## No npm required

This version does NOT use:
- Node.js
- npm
- Electron
- `main.js`
- `preload.js`

Complaint data is saved in the browser's `localStorage`, so Submit, Edit, Delete, Status, Search, and Filter work directly in Live Server.

To clear all saved complaints, open the browser developer tools and clear the site's local storage.
