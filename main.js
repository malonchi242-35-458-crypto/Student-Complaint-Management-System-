const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(app.getPath('userData'), 'complaints.json');

function readAllComplaints() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read complaints.json:', err);
    return [];
  }
}

function writeAllComplaints(list) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write complaints.json:', err);
  }
}

function computeCounts(list) {
  const pendingCount = list.filter((c) => c.status === 'pending').length;
  const inProgressCount = list.filter((c) => c.status === 'in-progress').length;
  const resolvedCount = list.filter((c) => c.status === 'resolved').length;
  return { pendingCount, inProgressCount, resolvedCount, total: list.length };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC Handlers ----------

ipcMain.handle('get-complaints', async () => {
  const list = readAllComplaints();
  return { complaints: list, counts: computeCounts(list) };
});

ipcMain.handle('add-complaint', async (event, data) => {
  const list = readAllComplaints();
  const newComplaint = {
    id: Date.now().toString(),
    studentName: data.studentName,
    title: data.title,
    category: data.category || 'Other',
    date: data.date,
    contactInfo: data.contactInfo,
    description: data.description || '',
    status: 'pending',
    createdAt: Date.now()
  };
  list.push(newComplaint);
  writeAllComplaints(list);
  return { success: true, complaint: newComplaint, counts: computeCounts(list) };
});

ipcMain.handle('update-complaint', async (event, data) => {
  const list = readAllComplaints();
  const idx = list.findIndex((c) => c.id === data.id);
  if (idx === -1) return { success: false, error: 'Complaint not found' };

  list[idx] = {
    ...list[idx],
    studentName: data.studentName,
    title: data.title,
    category: data.category || 'Other',
    date: data.date,
    contactInfo: data.contactInfo,
    description: data.description || ''
  };
  writeAllComplaints(list);
  return { success: true, complaint: list[idx], counts: computeCounts(list) };
});

ipcMain.handle('set-status', async (event, payload) => {
  const { id, status } = payload;
  const list = readAllComplaints();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return { success: false, error: 'Complaint not found' };

  list[idx].status = status;
  writeAllComplaints(list);
  return { success: true, complaint: list[idx], counts: computeCounts(list) };
});

ipcMain.handle('delete-complaint', async (event, id) => {
  let list = readAllComplaints();
  const existed = list.some((c) => c.id === id);
  list = list.filter((c) => c.id !== id);
  writeAllComplaints(list);
  return { success: existed, counts: computeCounts(list) };
});
