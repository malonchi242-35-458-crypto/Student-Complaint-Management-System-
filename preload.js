const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('complaintAPI', {
  getComplaints: () => ipcRenderer.invoke('get-complaints'),
  addComplaint: (data) => ipcRenderer.invoke('add-complaint', data),
  updateComplaint: (data) => ipcRenderer.invoke('update-complaint', data),
  setStatus: (id, status) => ipcRenderer.invoke('set-status', { id, status }),
  deleteComplaint: (id) => ipcRenderer.invoke('delete-complaint', id)
});
