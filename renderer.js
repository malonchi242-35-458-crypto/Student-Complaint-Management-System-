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
cancelEditBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderComplaints);
filterInput.addEventListener("change", renderComplaints);

async function loadComplaints() {
  const result = await window.complaintAPI.getComplaints();

  if (!result.success) {
    showMessage("Could not load complaints.", "error");
    return;
  }

  allComplaints = result.complaints;
  updateCounts(result.counts);
  renderComplaints();
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const studentName = studentNameInput.value.trim();
  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  const date = dateInput.value;
  const contactInfo = contactInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!studentName || !title || !contactInfo || !date || !category) {
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

  let result;

  if (editingId) {
    result = await window.complaintAPI.updateComplaint({
      id: editingId,
      ...payload
    });
  } else {
    result = await window.complaintAPI.addComplaint(payload);
  }

  if (!result.success) {
    showMessage(result.message || "Something went wrong.", "error");
    return;
  }

  if (editingId) {
    showMessage("Complaint updated successfully.", "success");
  } else {
    showMessage("Complaint submitted successfully.", "success");
  }

  await loadComplaints();
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

  const statusLabel = formatStatus(complaint.status);
  const statusClass = complaint.status;

  card.innerHTML = `
    <div class="complaint-top">
      <div>
        <div class="title-row">
          <h3>${escapeHtml(complaint.title)}</h3>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
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
      <select class="status-select" data-id="${complaint.id}">
        <option value="pending" ${complaint.status === "pending" ? "selected" : ""}>
          Pending
        </option>
        <option value="in-progress" ${complaint.status === "in-progress" ? "selected" : ""}>
          In Progress
        </option>
        <option value="resolved" ${complaint.status === "resolved" ? "selected" : ""}>
          Resolved
        </option>
      </select>

      <button class="btn btn-secondary edit-btn" data-id="${complaint.id}">
        Edit
      </button>

      <button class="btn btn-danger delete-btn" data-id="${complaint.id}">
        Delete
      </button>
    </div>
  `;

  const statusSelect = card.querySelector(".status-select");
  const editButton = card.querySelector(".edit-btn");
  const deleteButton = card.querySelector(".delete-btn");

  statusSelect.addEventListener("change", async (event) => {
    const result = await window.complaintAPI.setStatus(
      complaint.id,
      event.target.value
    );

    if (result.success) {
      await loadComplaints();
      showMessage("Complaint status updated.", "success");
    } else {
      showMessage(result.message || "Could not update status.", "error");
    }
  });

  editButton.addEventListener("click", () => startEdit(complaint.id));

  deleteButton.addEventListener("click", () => deleteComplaint(complaint.id));

  return card;
}

function startEdit(id) {
  const complaint = allComplaints.find((item) => item.id === id);

  if (!complaint) {
    return;
  }

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

async function deleteComplaint(id) {
  const complaint = allComplaints.find((item) => item.id === id);

  if (!complaint) {
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete "${complaint.title}"?`
  );

  if (!confirmed) {
    return;
  }

  const result = await window.complaintAPI.deleteComplaint(id);

  if (!result.success) {
    showMessage(result.message || "Could not delete complaint.", "error");
    return;
  }

  if (editingId === id) {
    resetForm();
  }

  await loadComplaints();
  showMessage("Complaint deleted successfully.", "success");
}

function updateCounts(counts) {
  pendingCount.textContent = counts.pendingCount;
  inProgressCount.textContent = counts.inProgressCount;
  resolvedCount.textContent = counts.resolvedCount;
}

function formatStatus(status) {
  const labels = {
    pending: "Pending",
    "in-progress": "In Progress",
    resolved: "Resolved"
  };

  return labels[status] || status;
}

function formatDate(dateString) {
  if (!dateString) {
    return "No date";
  }

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
