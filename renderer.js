const STORAGE_KEY = "studentComplaintManagementSystem";

const complaintForm = document.getElementById("complaintForm");
const studentNameInput = document.getElementById("studentName");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const contactInput = document.getElementById("contactInfo");
const descriptionInput = document.getElementById("description");

const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formHeading = document.getElementById("formHeading");
const formMessage = document.getElementById("formMessage");

const searchInput = document.getElementById("searchInput");
const filterInput = document.getElementById("filterInput");

const complaintList = document.getElementById("complaintList");
const emptyState = document.getElementById("emptyState");

const pendingCount = document.getElementById("pendingCount");
const inProgressCount = document.getElementById("inProgressCount");
const resolvedCount = document.getElementById("resolvedCount");
const totalText = document.getElementById("totalText");

let allComplaints = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  dateInput.value = new Date().toISOString().split("T")[0];
  loadComplaints();
});

complaintForm.addEventListener("submit", handleFormSubmit);
cancelEditBtn.addEventListener("click", () => resetForm());
searchInput.addEventListener("input", renderComplaints);
filterInput.addEventListener("change", renderComplaints);

function loadComplaints() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    allComplaints = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(allComplaints)) {
      allComplaints = [];
    }
  } catch (error) {
    console.error("Could not load complaints:", error);
    allComplaints = [];
  }

  updateCounts();
  renderComplaints();
}

function saveComplaints() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allComplaints));
}

function handleFormSubmit(event) {
  event.preventDefault();

  const studentName = studentNameInput.value.trim();
  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  const date = dateInput.value;
  const contactInfo = contactInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!studentName || !title || !category || !date || !contactInfo) {
    showMessage("Please fill in all required fields.", "error");
    return;
  }

  if (category.toLowerCase() === title.toLowerCase()) {
    showMessage("Category can't be the same as the complaint title.", "error");
    return;
  }

  const payload = {
    studentName,
    title,
    category,
    date,
    contactInfo,
    description
  };

  if (editingId) {
    const index = allComplaints.findIndex((item) => item.id === editingId);

    if (index !== -1) {
      allComplaints[index] = {
        ...allComplaints[index],
        ...payload
      };
    }

    showMessage("Complaint updated successfully.", "success");
  } else {
    allComplaints.push({
      id: Date.now().toString(),
      ...payload,
      status: "pending",
      createdAt: Date.now()
    });

    showMessage("Complaint submitted successfully.", "success");
  }

  saveComplaints();
  updateCounts();
  renderComplaints();
  resetForm(false);
}

function renderComplaints() {
  const filterValue = filterInput.value;
  const query = searchInput.value.trim().toLowerCase();

  let filtered = [...allComplaints];

  if (filterValue !== "all") {
    filtered = filtered.filter((complaint) => complaint.status === filterValue);
  }

  if (query) {
    filtered = filtered.filter((complaint) =>
      complaint.title.toLowerCase().includes(query) ||
      complaint.studentName.toLowerCase().includes(query) ||
      complaint.category.toLowerCase().includes(query)
    );
  }

  filtered.sort((a, b) => b.createdAt - a.createdAt);
  complaintList.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");

    emptyState.querySelector("h3").textContent =
      allComplaints.length === 0 ? "No complaints yet" : "No matching complaints";

    emptyState.querySelector("p").textContent =
      allComplaints.length === 0
        ? "Submit a complaint above to get started."
        : "Try changing the search or status filter.";
  } else {
    emptyState.classList.add("hidden");

    filtered.forEach((complaint) => {
      complaintList.appendChild(createComplaintCard(complaint));
    });
  }

  totalText.textContent =
    `${allComplaints.length} complaint${allComplaints.length === 1 ? "" : "s"}`;
}

function createComplaintCard(complaint) {
  const card = document.createElement("article");
  card.className = "complaint-card";

  card.innerHTML = `
    <div class="complaint-top">
      <div>
        <div class="title-row">
          <h3>${escapeHtml(complaint.title)}</h3>
          <span class="status-badge ${complaint.status}">
            ${formatStatus(complaint.status)}
          </span>
        </div>

        <p class="student-name">
          Submitted by <strong>${escapeHtml(complaint.studentName)}</strong>
        </p>
      </div>

      <span class="category-badge">${escapeHtml(complaint.category)}</span>
    </div>

    <div class="complaint-meta">
      <span>📅 ${formatDate(complaint.date)}</span>
      <span>📞 ${escapeHtml(complaint.contactInfo)}</span>
    </div>

    ${
      complaint.description
        ? `<p class="description">${escapeHtml(complaint.description)}</p>`
        : ""
    }

    <div class="complaint-actions">
      <select class="status-select">
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>

      <button class="btn btn-secondary edit-btn">Edit</button>
      <button class="btn btn-danger delete-btn">Delete</button>
    </div>
  `;

  const statusSelect = card.querySelector(".status-select");
  const editButton = card.querySelector(".edit-btn");
  const deleteButton = card.querySelector(".delete-btn");

  statusSelect.value = complaint.status;

  statusSelect.addEventListener("change", (event) => {
    changeStatus(complaint.id, event.target.value);
  });

  editButton.addEventListener("click", () => startEdit(complaint.id));
  deleteButton.addEventListener("click", () => deleteComplaint(complaint.id));

  return card;
}

function changeStatus(id, status) {
  const complaint = allComplaints.find((item) => item.id === id);

  if (!complaint) return;

  complaint.status = status;
  saveComplaints();
  updateCounts();
  renderComplaints();
  showMessage("Complaint status updated.", "success");
}

function startEdit(id) {
  const complaint = allComplaints.find((item) => item.id === id);

  if (!complaint) return;

  editingId = id;

  studentNameInput.value = complaint.studentName;
  titleInput.value = complaint.title;
  categoryInput.value = complaint.category;
  dateInput.value = complaint.date;
  contactInput.value = complaint.contactInfo;
  descriptionInput.value = complaint.description || "";

  formHeading.textContent = "Edit Complaint";
  submitBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function resetForm(clearMessage = true) {
  editingId = null;
  complaintForm.reset();

  dateInput.value = new Date().toISOString().split("T")[0];

  formHeading.textContent = "Submit a Complaint";
  submitBtn.textContent = "Submit Complaint";
  cancelEditBtn.classList.add("hidden");

  if (clearMessage) {
    hideMessage();
  }
}

function deleteComplaint(id) {
  const complaint = allComplaints.find((item) => item.id === id);

  if (!complaint) return;

  const confirmed = confirm(
    `Are you sure you want to delete "${complaint.title}"?`
  );

  if (!confirmed) return;

  allComplaints = allComplaints.filter((item) => item.id !== id);

  if (editingId === id) {
    resetForm();
  }

  saveComplaints();
  updateCounts();
  renderComplaints();
  showMessage("Complaint deleted successfully.", "success");
}

function updateCounts() {
  pendingCount.textContent =
    allComplaints.filter((c) => c.status === "pending").length;

  inProgressCount.textContent =
    allComplaints.filter((c) => c.status === "in-progress").length;

  resolvedCount.textContent =
    allComplaints.filter((c) => c.status === "resolved").length;
}

function formatStatus(status) {
  return {
    pending: "Pending",
    "in-progress": "In Progress",
    resolved: "Resolved"
  }[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return "No date";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `message ${type}`;
}

function hideMessage() {
  formMessage.textContent = "";
  formMessage.className = "message hidden";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
