// Configuration
let CONFIG = {
  apiUrl: '',
  apiKey: ''
};

// Load config from localStorage
function loadConfig() {
  const saved = localStorage.getItem('adminConfig');
  if (saved) {
    CONFIG = JSON.parse(saved);
    document.getElementById('apiUrl').value = CONFIG.apiUrl || '';
    document.getElementById('apiKey').value = CONFIG.apiKey || '';
    
    if (CONFIG.apiUrl && CONFIG.apiKey) {
      loadClients();
      loadClientsForFilter();
    }
  }
}

// Save config to localStorage
function saveConfig() {
  CONFIG.apiUrl = document.getElementById('apiUrl').value.trim();
  CONFIG.apiKey = document.getElementById('apiKey').value.trim();
  
  if (!CONFIG.apiUrl || !CONFIG.apiKey) {
    alert('Please enter both API URL and API Key');
    return;
  }
  
  localStorage.setItem('adminConfig', JSON.stringify(CONFIG));
  showSuccess('Configuration saved successfully!');
  
  // Load data
  loadClients();
  loadClientsForFilter();
}

// API Helper
async function apiRequest(endpoint, options = {}) {
  if (!CONFIG.apiUrl || !CONFIG.apiKey) {
    throw new Error('Please configure API URL and API Key first');
  }
  
  const url = `${CONFIG.apiUrl}${endpoint}`;
  const headers = {
    'Authorization': CONFIG.apiKey,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Tab Management
function showTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  // Load data for the tab
  if (tabName === 'clients') loadClients();
  if (tabName === 'tours') loadTours();
}

// Show messages
function showError(container, message) {
  const errorDiv = document.getElementById(container);
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success';
  successDiv.textContent = message;
  document.querySelector('.container').insertBefore(successDiv, document.querySelector('.tabs'));
  setTimeout(() => successDiv.remove(), 3000);
}

// ==================== CLIENTS ====================

async function loadClients() {
  const loading = document.getElementById('clientsLoading');
  const tableDiv = document.getElementById('clientsTable');
  
  loading.style.display = 'block';
  tableDiv.innerHTML = '';
  
  try {
    const data = await apiRequest('/admin/clients');
    loading.style.display = 'none';
    
    if (!data.clients || data.clients.length === 0) {
      tableDiv.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">No clients found. Click "Add Client" to create your first client.</p>';
      return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Display Name</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.clients.map(client => `
          <tr>
            <td>${client.id}</td>
            <td><strong>${client.name}</strong></td>
            <td>${client.display_name || '-'}</td>
            <td><span class="badge badge-${client.status === 'active' ? 'success' : 'warning'}">${client.status}</span></td>
            <td>${new Date(client.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-primary" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;" onclick="editClient(${client.id})">Edit</button>
              <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClient(${client.id}, '${client.name}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    
    tableDiv.appendChild(table);
  } catch (error) {
    loading.style.display = 'none';
    showError('clientsError', error.message);
  }
}

async function loadClientsForFilter() {
  try {
    const data = await apiRequest('/admin/clients');
    const select = document.getElementById('tourClientFilter');
    const tourSelect = document.getElementById('tourClient');
    
    // For filter dropdown
    select.innerHTML = '<option value="">All Clients</option>';
    data.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.display_name || client.name;
      select.appendChild(option);
    });
    
    // For tour creation dropdown
    tourSelect.innerHTML = '<option value="">Select a client</option>';
    data.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.display_name || client.name;
      tourSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load clients:', error);
  }
}

function showCreateClientModal() {
  document.getElementById('clientModalTitle').textContent = 'Add Client';
  document.getElementById('clientForm').reset();
  document.getElementById('clientId').value = '';
  document.getElementById('clientModal').classList.add('active');
}

function closeClientModal() {
  document.getElementById('clientModal').classList.remove('active');
}

async function editClient(id) {
  try {
    const data = await apiRequest(`/admin/clients/${id}`);
    const client = data.client;
    
    document.getElementById('clientModalTitle').textContent = 'Edit Client';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientDisplayName').value = client.display_name || '';
    document.getElementById('clientStatus').value = client.status;
    document.getElementById('clientModal').classList.add('active');
  } catch (error) {
    showError('clientsError', `Failed to load client: ${error.message}`);
  }
}

async function saveClient(event) {
  event.preventDefault();
  
  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const display_name = document.getElementById('clientDisplayName').value.trim();
  const status = document.getElementById('clientStatus').value;
  
  const payload = { name, display_name, status };
  
  try {
    if (id) {
      // Update existing
      await apiRequest(`/admin/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showSuccess('Client updated successfully!');
    } else {
      // Create new
      await apiRequest('/admin/clients', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showSuccess('Client created successfully!');
    }
    
    closeClientModal();
    loadClients();
    loadClientsForFilter();
  } catch (error) {
    alert(`Failed to save client: ${error.message}`);
  }
}

async function deleteClient(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated tours.`)) {
    return;
  }
  
  try {
    await apiRequest(`/admin/clients/${id}`, { method: 'DELETE' });
    showSuccess('Client deleted successfully!');
    loadClients();
    loadClientsForFilter();
  } catch (error) {
    showError('clientsError', `Failed to delete client: ${error.message}`);
  }
}

// ==================== TOURS ====================

async function loadTours() {
  const loading = document.getElementById('toursLoading');
  const tableDiv = document.getElementById('toursTable');
  const clientFilter = document.getElementById('tourClientFilter').value;
  
  loading.style.display = 'block';
  tableDiv.innerHTML = '';
  
  try {
    const endpoint = clientFilter 
      ? `/admin/tours?client_id=${clientFilter}` 
      : '/admin/tours';
    
    const data = await apiRequest(endpoint);
    loading.style.display = 'none';
    
    if (!data.tours || data.tours.length === 0) {
      tableDiv.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">No tours found. Click "Add Tour" to create your first tour.</p>';
      return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Slug</th>
          <th>Client ID</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.tours.map(tour => `
          <tr>
            <td>${tour.id}</td>
            <td><strong>${tour.name}</strong></td>
            <td>${tour.slug}</td>
            <td>${tour.client_id}</td>
            <td>${tour.from_price ? `$${tour.from_price}` : '-'}</td>
            <td><span class="badge badge-${tour.status === 'active' ? 'success' : 'warning'}">${tour.status}</span></td>
            <td>
              <button class="btn btn-primary" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;" onclick="editTour(${tour.id})">Edit</button>
              <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" onclick="deleteTour(${tour.id}, '${tour.name}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    
    tableDiv.appendChild(table);
  } catch (error) {
    loading.style.display = 'none';
    showError('toursError', error.message);
  }
}

function showCreateTourModal() {
  document.getElementById('tourModalTitle').textContent = 'Add Tour';
  document.getElementById('tourForm').reset();
  document.getElementById('tourId').value = '';
  document.getElementById('tourModal').classList.add('active');
}

function closeTourModal() {
  document.getElementById('tourModal').classList.remove('active');
}

async function editTour(id) {
  try {
    const data = await apiRequest(`/admin/tours/${id}`);
    const tour = data.tour;
    
    document.getElementById('tourModalTitle').textContent = 'Edit Tour';
    document.getElementById('tourId').value = tour.id;
    document.getElementById('tourClient').value = tour.client_id;
    document.getElementById('tourSlug').value = tour.slug;
    document.getElementById('tourName').value = tour.name;
    document.getElementById('tourExcerpt').value = tour.excerpt || '';
    document.getElementById('tourPrice').value = tour.from_price || '';
    document.getElementById('tourStatus').value = tour.status;
    document.getElementById('tourModal').classList.add('active');
  } catch (error) {
    showError('toursError', `Failed to load tour: ${error.message}`);
  }
}

async function saveTour(event) {
  event.preventDefault();
  
  const id = document.getElementById('tourId').value;
  const client_id = parseInt(document.getElementById('tourClient').value);
  const slug = document.getElementById('tourSlug').value.trim();
  const name = document.getElementById('tourName').value.trim();
  const excerpt = document.getElementById('tourExcerpt').value.trim();
  const from_price = parseFloat(document.getElementById('tourPrice').value) || null;
  const status = document.getElementById('tourStatus').value;
  
  const payload = { 
    client_id, 
    slug, 
    name, 
    excerpt, 
    from_price,
    status
  };
  
  try {
    if (id) {
      // Update existing
      await apiRequest(`/admin/tours/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showSuccess('Tour updated successfully!');
    } else {
      // Create new
      await apiRequest('/admin/tours', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showSuccess('Tour created successfully!');
    }
    
    closeTourModal();
    loadTours();
  } catch (error) {
    alert(`Failed to save tour: ${error.message}`);
  }
}

async function deleteTour(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }
  
  try {
    await apiRequest(`/admin/tours/${id}`, { method: 'DELETE' });
    showSuccess('Tour deleted successfully!');
    loadTours();
  } catch (error) {
    showError('toursError', `Failed to delete tour: ${error.message}`);
  }
}

// Initialize
loadConfig();

