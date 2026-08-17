const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const dataFile = path.join(app.getPath("userData"), "complaints.json");

function readAllComplaints() {
  try {
    if (!fs.existsSync(dataFile)) {
      return [];
    }

    const data = fs.readFileSync(dataFile, "utf8");
    const complaints = JSON.parse(data);
    return Array.isArray(complaints) ? complaints : [];
  } catch (error) {
    console.error("Could not read complaints:", error);
    return [];
  }
}

function writeAllComplaints(list) {
  const folder = path.dirname(dataFile);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), "utf8");
}

function computeCounts(list) {
  const pendingCount = list.filter((c) => c.status === "pending").length;
  const inProgressCount = list.filter((c) => c.status === "in-progress").length;
  const resolvedCount = list.filter((c) => c.status === "resolved").length;

  return {
    pendingCount,
    inProgressCount,
    resolvedCount,
    total: list.length
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#f5f7fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  ipcMain.handle("get-complaints", () => {
    const list = readAllComplaints();

    return {
      success: true,
      complaints: list,
      counts: computeCounts(list)
    };
  });

  ipcMain.handle("add-complaint", (event, data) => {
    const list = readAllComplaints();

    const newComplaint = {
      id: Date.now().toString(),
      studentName: data.studentName,
      title: data.title,
      category: data.category || "Other",
      date: data.date,
      contactInfo: data.contactInfo,
      description: data.description || "",
      status: "pending",
      createdAt: Date.now()
    };

    list.push(newComplaint);
    writeAllComplaints(list);

    return {
      success: true,
      complaint: newComplaint,
      counts: computeCounts(list)
    };
  });

  ipcMain.handle("update-complaint", (event, data) => {
    const list = readAllComplaints();
    const index = list.findIndex((complaint) => complaint.id === data.id);

    if (index === -1) {
      return {
        success: false,
        message: "Complaint not found."
      };
    }

    const oldComplaint = list[index];

    list[index] = {
      ...oldComplaint,
      studentName: data.studentName,
      title: data.title,
      category: data.category || "Other",
      date: data.date,
      contactInfo: data.contactInfo,
      description: data.description || ""
    };

    writeAllComplaints(list);

    return {
      success: true,
      complaint: list[index],
      counts: computeCounts(list)
    };
  });

  ipcMain.handle("set-status", (event, { id, status }) => {
    const allowedStatuses = ["pending", "in-progress", "resolved"];

    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        message: "Invalid status."
      };
    }

    const list = readAllComplaints();
    const complaint = list.find((item) => item.id === id);

    if (!complaint) {
      return {
        success: false,
        message: "Complaint not found."
      };
    }

    complaint.status = status;
    writeAllComplaints(list);

    return {
      success: true,
      complaint,
      counts: computeCounts(list)
    };
  });

  ipcMain.handle("delete-complaint", (event, id) => {
    const list = readAllComplaints();
    const newList = list.filter((complaint) => complaint.id !== id);

    if (newList.length === list.length) {
      return {
        success: false,
        message: "Complaint not found."
      };
    }

    writeAllComplaints(newList);

    return {
      success: true,
      counts: computeCounts(newList)
    };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
