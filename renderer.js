let allComplaints = [];
let editingId = null;

const form = document.getElementById('complaint-form');
const studentNameInput = document.getElementById('studentName');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const contactInfoInput = document.getElementById('contactInfo');
const descriptionInput = document.getElementById('description');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formHeading = document.getElementById('form-heading');

const searchInput = document.getElementById('search');
const filterInput = document.getElementById('filter');
const listEl = document.getElementById('complaint-list');
const emptyMessage = document.getElementById('empty-message');

const countPending = document.getElementById('count-pending');
const countInProgress = document.getElementById('count-in-progress');
const countResolved = document.getElementById('count-resolved');

function showStatus(message, isError = true) {
  formStatus.textContent = message;
  formStatus.className = 'form-status ' + (isError ? 'error' : 'success');
  if (message) {
    setTimeout(() => { formStatus.textContent = ''; formStatus.className = 'form-status'; }, 3000);
  }
}

function updateCounts(counts) {
  countPending.textContent = counts.pendingCount;
  countInProgress.textContent = counts.inProgressCount;
  countResolved.textContent = counts.resolvedCount;
}

function statusLabel(status) {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'resolved') return 'Resolved';
  return 'Pending';
}

function renderComplaints() {
  const filterValue = filterInput.value;
  const query = searchInput.value.trim().toLowerCase();

  let filtered = allComplaints;
  if (filterValue !== 'all') {
    filtered = filtered.filter((c) => c.status === filterValue);
  }
  if (query) {
    filtered = filtered.filter((c) =>
      c.title.toLowerCase().includes(query) ||
      c.studentName.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
    );
  }

  listEl.innerHTML = '';
  emptyMessage.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((c) => {
      const li = document.createElement('li');
      li.className = 'complaint-item status-' + c.status;

      li.innerHTML = `
        <div class="item-main">
          <div class="item-top">
            <span class="item-title">${escapeHtml(c.title)}</span>
            <span class="status-badge ${c.status}">${statusLabel(c.status)}</span>
          </div>
          <div class="item-meta">
            <span>${escapeHtml(c.studentName)}</span>
            <span>${escapeHtml(c.category)}</span>
            <span>${escapeHtml(c.date || '')}</span>
            <span>${escapeHtml(c.contactInfo)}</span>
          </div>
          ${c.description ? `<p class="item-desc">${escapeHtml(c.description)}</p>` : ''}
        </div>
        <div class="item-actions">
          <select class="status-select" data-id="${c.id}">
            <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in-progress" ${c.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${c.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
          <button class="edit-btn" data-id="${c.id}">Edit</button>
          <button class="delete-btn" data-id="${c.id}">Delete</button>
        </div>
      `;
      listEl.appendChild(li);
    });

  document.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const result = await window.complaintAPI.setStatus(id, e.target.value);
      if (result.success) {
        const idx = allComplaints.findIndex((c) => c.id === id);
        if (idx !== -1) allComplaints[idx] = result.complaint;
        updateCounts(result.counts);
        renderComplaints();
      }
    });
  });

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteComplaint(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function startEdit(id) {
  const c = allComplaints.find((x) => x.id === id);
  if (!c) return;
  editingId = id;
  studentNameInput.value = c.studentName;
  titleInput.value = c.title;
  categoryInput.value = c.category;
  dateInput.value = c.date || '';
  contactInfoInput.value = c.contactInfo;
  descriptionInput.value = c.description || '';

  formHeading.textContent = 'Edit Complaint';
  submitBtn.textContent = 'Save Changes';
  cancelEditBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  form.reset();
  formHeading.textContent = 'Submit a Complaint';
  submitBtn.textContent = 'Submit Complaint';
  cancelEditBtn.classList.add('hidden');
}

async function deleteComplaint(id) {
  const confirmed = confirm('Delete this complaint? This cannot be undone.');
  if (!confirmed) return;
  const result = await window.complaintAPI.deleteComplaint(id);
  if (result.success) {
    allComplaints = allComplaints.filter((c) => c.id !== id);
    updateCounts(result.counts);
    renderComplaints();
    if (editingId === id) resetForm();
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const studentName = studentNameInput.value.trim();
  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  const date = dateInput.value;
  const contactInfo = contactInfoInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!studentName || !title || !contactInfo) {
    showStatus('Name, complaint title, and contact info are required.');
    return;
  }

  if (category && category.toLowerCase() === title.toLowerCase()) {
    showStatus("Category can't be the same as the complaint title.");
    return;
  }

  const payload = { studentName, title, category, date, contactInfo, description };

  const result = editingId
    ? await window.complaintAPI.updateComplaint({ id: editingId, ...payload })
    : await window.complaintAPI.addComplaint(payload);

  if (result.success) {
    if (editingId) {
      const idx = allComplaints.findIndex((c) => c.id === editingId);
      if (idx !== -1) allComplaints[idx] = result.complaint;
    } else {
      allComplaints.push(result.complaint);
    }
    updateCounts(result.counts);
    renderComplaints();
    showStatus(editingId ? 'Complaint updated.' : 'Complaint submitted.', false);
    resetForm();
  } else {
    showStatus(result.error || 'Something went wrong.');
  }
});

cancelEditBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderComplaints);
filterInput.addEventListener('change', renderComplaints);

async function init() {
  const { complaints, counts } = await window.complaintAPI.getComplaints();
  allComplaints = complaints;
  updateCounts(counts);
  renderComplaints();
}

init();
