// Configuration
let CONFIG = {
  apiUrl: '',
  apiKey: ''
};

let galleryImagesState = [];
let draggedGalleryIndex = null;
let currentClientCoreConfig = {};
let currentClientId = null;
let clientSlugTouched = false;
let headerOverrideActive = false;
let savedHeaderState = null;

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
      if (typeof loadClientDropdown === 'function') {
        try {
          loadClientDropdown();
        } catch (err) {
          console.warn('Failed to load client dropdown during config load:', err);
        }
      }
      
      // Check for client parameter in URL to auto-filter
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('client');
      if (clientId) {
        console.log('Auto-filtering by client from URL:', clientId);
        // Wait for everything to load, then filter by client
        setTimeout(() => {
          console.log('Calling filterByClient with clientId:', clientId);
          filterByClient(clientId);
        }, 500);
      }
    }
    
          // Feather icons will be initialized by sidebar.js
  }
}

// Save config to localStorage
function saveConfig() {
  console.log('saveConfig function called');
  
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  
  console.log('API URL input:', apiUrlInput);
  console.log('API Key input:', apiKeyInput);
  
  if (!apiUrlInput || !apiKeyInput) {
    console.error('API URL or API Key input not found');
    alert('Error: Could not find API configuration inputs');
    return;
  }
  
  CONFIG.apiUrl = apiUrlInput.value.trim();
  CONFIG.apiKey = apiKeyInput.value.trim();
  
  console.log('Config values:', { apiUrl: CONFIG.apiUrl, apiKey: CONFIG.apiKey ? '***' : 'empty' });
  
  if (!CONFIG.apiUrl || !CONFIG.apiKey) {
    alert('Please enter both API URL and API Key');
    return;
  }
  
  try {
    localStorage.setItem('adminConfig', JSON.stringify(CONFIG));
    console.log('Configuration saved to localStorage');
    showSuccess('Configuration saved successfully!');
    
    // Load data
    loadClients();
    loadClientsForFilter();
    if (typeof loadClientDropdown === 'function') {
      try {
        loadClientDropdown();
      } catch (err) {
        console.warn('Failed to load client dropdown after saving config:', err);
      }
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
    alert('Error saving configuration: ' + error.message);
  }
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
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}`;
    const fullError = new Error(errorMsg);
    fullError.response = errorData;
    throw fullError;
  }
  
  return response.json();
}

// Tab Management
function showTab(event, tabName) {
  // Update sidebar navigation active states
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Handle special cases
  let actualTabName = tabName;
  if (tabName === 'dashboard') {
    actualTabName = 'clients'; // Dashboard shows clients tab
  }
  
  const targetTab = document.getElementById(actualTabName + 'Tab');
  if (targetTab) {
    targetTab.classList.add('active');
  } else {
    console.warn('Tab element not found:', actualTabName + 'Tab');
  }
  
  // Set active state for the clicked navigation link
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    // If no event target, find the appropriate sidebar link
    const sidebarLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (sidebarLink) {
      sidebarLink.classList.add('active');
    }
  }
  
  // Update page title and breadcrumb
  updatePageTitle(tabName);
  
  // Load data for the tab
  if (tabName === 'clients') loadClients();
  if (tabName === 'tours') loadTours();
}

// Update page title and breadcrumb
function updatePageTitle(tabName) {
  const pageTitle = document.getElementById('page-title');
  const currentPageBreadcrumb = document.getElementById('current-page-breadcrumb');
  
  if (!pageTitle || !currentPageBreadcrumb) {
    console.error('Page title elements not found');
    return;
  }
  
  const titles = {
    'dashboard': 'Dashboard',
    'tours': 'Tours',
    'clients': 'Clients',
    'apiDocs': 'Settings'
  };
  
  const title = titles[tabName] || 'Dashboard';
  pageTitle.textContent = title;
  currentPageBreadcrumb.textContent = title;
  
  console.log('Page title updated to:', title);
}

// Update page title for client selection
function updatePageTitleForClient(clientName) {
  const pageTitle = document.getElementById('page-title');
  const currentPageBreadcrumb = document.getElementById('current-page-breadcrumb');
  
  if (!pageTitle || !currentPageBreadcrumb) {
    console.error('Page title elements not found');
    return;
  }
  
  // Update title to show client name
  pageTitle.textContent = clientName;
  currentPageBreadcrumb.textContent = clientName;
  
  console.log('Page title updated to client:', clientName);
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
  console.log('showSuccess called with message:', message);
  
  // Use a simple alert for now to ensure visibility
  alert('✅ ' + message);
  
  // Also try to show a visual indicator by temporarily highlighting the save button
  const saveButton = document.querySelector('.btn-save-config');
  console.log('Save button found:', saveButton);
  
  if (saveButton) {
    const originalText = saveButton.textContent;
    const originalBg = saveButton.style.backgroundColor;
    
    console.log('Changing button text to:', '✅ ' + message);
    saveButton.textContent = '✅ ' + message;
    saveButton.style.backgroundColor = '#10b981';
    saveButton.style.color = 'white';
    
    setTimeout(() => {
      console.log('Reverting button text to:', originalText);
      saveButton.textContent = originalText;
      saveButton.style.backgroundColor = originalBg;
      saveButton.style.color = '';
    }, 2000);
  } else {
    console.error('Save button not found!');
  }
}

function setupBulkTourSelection() {
  const selectAllCheckbox = document.getElementById('selectAllTours');
  const tourCheckboxes = Array.from(document.querySelectorAll('.tour-select'));
  const bulkBar = document.getElementById('bulk-actions-bar');
  const activateBtn = document.getElementById('bulk-activate-btn');
  const deactivateBtn = document.getElementById('bulk-deactivate-btn');

  const normalizeStatus = status => {
    if (!status) return 'draft';
    return status === 'active' ? 'published' : status;
  };

  function updateBulkState() {
    const selected = tourCheckboxes.filter(cb => cb.checked);
    const hasSelected = selected.length > 0;
    if (bulkBar) {
      bulkBar.style.display = hasSelected ? 'flex' : 'none';
      const draftCount = selected.filter(cb => normalizeStatus(cb.dataset.tourStatus) !== 'published').length;
      const publishedCount = selected.filter(cb => normalizeStatus(cb.dataset.tourStatus) === 'published').length;
      if (activateBtn) activateBtn.disabled = draftCount === 0;
      if (deactivateBtn) deactivateBtn.disabled = publishedCount === 0;
    }
    if (selectAllCheckbox) {
      const allChecked = selected.length === tourCheckboxes.length && tourCheckboxes.length > 0;
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = !allChecked && hasSelected;
    }
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      tourCheckboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
      });
      updateBulkState();
    });
  }

  tourCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateBulkState);
  });

  updateBulkState();

  if (activateBtn) {
    activateBtn.onclick = async () => {
      const selectedCheckboxes = tourCheckboxes.filter(cb => cb.checked);
      const selectedIds = selectedCheckboxes
        .filter(cb => normalizeStatus(cb.dataset.tourStatus) === 'draft')
        .map(cb => cb.dataset.tourId);
      if (selectedIds.length === 0) return;
      await bulkUpdateTourStatus(selectedIds, 'published');
    };
  }

  if (deactivateBtn) {
    deactivateBtn.onclick = async () => {
      const selectedCheckboxes = tourCheckboxes.filter(cb => cb.checked);
      const selectedIds = selectedCheckboxes
        .filter(cb => normalizeStatus(cb.dataset.tourStatus) === 'published')
        .map(cb => cb.dataset.tourId);
      if (selectedIds.length === 0) return;
      await bulkUpdateTourStatus(selectedIds, 'draft');
    };
  }
}

async function bulkUpdateTourStatus(tourIds, status) {
  if (!Array.isArray(tourIds) || tourIds.length === 0) return;

  try {
    const normalizedStatus = status === 'active' ? 'published' : status;
    await Promise.all(tourIds.map(id => apiRequest(`/admin/tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: normalizedStatus })
    })));

    if (typeof window.currentClientId !== 'undefined' && window.currentClientId !== null) {
      await loadToursForClient(window.currentClientId);
    } else {
      await loadTours();
    }

    alert(`Updated ${tourIds.length} tour(s) to ${normalizedStatus === 'published' ? 'Published' : 'Draft'}.`);
  } catch (error) {
    console.error('Bulk status update failed:', error);
    alert('Failed to update tours: ' + error.message);
  } finally {
    const selectAllCheckbox = document.getElementById('selectAllTours');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
  }
}

// ==================== CLIENTS ====================

async function loadClients() {
  const clientList = document.getElementById('clientList');
  
  if (!clientList) {
    console.error('Client list container not found');
    return;
  }
  
  try {
    const data = await apiRequest('/admin/clients');
    
    if (!data.clients || data.clients.length === 0) {
      clientList.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">No clients found. Click "Add New Client" to create your first client.</p>';
      return;
    }
    
    clientList.innerHTML = data.clients.map(client => `
      <div class="client-card">
        <h3>${client.name}</h3>
        <p>${client.display_name || 'No display name'}</p>
        <p><strong>Status:</strong> <span class="status-badge ${client.status === 'active' ? 'active' : 'draft'}">${client.status}</span></p>
        <p><strong>Created:</strong> ${new Date(client.created_at).toLocaleDateString()}</p>
        <div class="actions">
          <button class="btn btn-primary" onclick="editClient(${client.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteClient(${client.id}, '${client.name}')">Delete</button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading clients:', error);
    clientList.innerHTML = '<p style="text-align:center;color:#ef4444;padding:40px;">Error loading clients: ' + error.message + '</p>';
  }
}

async function loadClientsForFilter() {
  try {
    const data = await apiRequest('/admin/clients');
    const select = document.getElementById('tourClientFilter');
    const tourSelect = document.getElementById('tourClient');
    
    // For filter dropdown
    if (select) {
      select.innerHTML = '<option value="">All Clients</option>';
      data.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.display_name || client.name;
        select.appendChild(option);
      });
    }
    
    // For tour creation dropdown
    if (tourSelect) {
      tourSelect.innerHTML = '<option value="">Select a client</option>';
      data.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.display_name || client.name;
        tourSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load clients:', error);
  }
}

function openClientPanel() {
  const panel = document.getElementById('edit-client-container');
  if (!panel) {
    console.error('[ClientPanel] Edit client container not found');
    return;
  }
  
  console.log('[ClientPanel] Panel element found:', panel);
  
  // Remove the inline display:none style first
  panel.removeAttribute('style');
  console.log('[ClientPanel] Removed inline style attribute');
  
  // Add editing class to main-content to show panel via CSS
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('editing');
    console.log('[ClientPanel] Added editing class to main-content');
  } else {
    console.warn('[ClientPanel] main-content element not found');
  }
  
  // Show the container with !important to override any CSS
  // Increase z-index to ensure it's above everything except the header
  panel.style.setProperty('display', 'block', 'important');
  panel.style.setProperty('visibility', 'visible', 'important');
  panel.style.setProperty('opacity', '1', 'important');
  panel.style.setProperty('z-index', '1099', 'important'); // Just below header (1100)
  
  // Check parent containers
  let parent = panel.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    const parentDisplay = window.getComputedStyle(parent).display;
    const parentVisibility = window.getComputedStyle(parent).visibility;
    const parentOpacity = window.getComputedStyle(parent).opacity;
    console.log(`[ClientPanel] Parent ${depth} (${parent.tagName}.${parent.className}): display=${parentDisplay}, visibility=${parentVisibility}, opacity=${parentOpacity}`);
    if (parentDisplay === 'none' || parentVisibility === 'hidden' || parentOpacity === '0') {
      console.warn(`[ClientPanel] Parent ${depth} is hiding the panel!`);
    }
    parent = parent.parentElement;
    depth++;
  }
  
  // Check if panel has content
  const content = panel.querySelector('.edit-client-content');
  console.log('[ClientPanel] Panel has content div:', !!content);
  if (content) {
    const contentDisplay = window.getComputedStyle(content).display;
    const contentHeight = window.getComputedStyle(content).height;
    console.log('[ClientPanel] Content display:', contentDisplay, 'height:', contentHeight);
  }
  
  console.log('[ClientPanel] Set panel display, visibility, opacity, and z-index');
  console.log('[ClientPanel] Panel computed display:', window.getComputedStyle(panel).display);
  console.log('[ClientPanel] Panel computed visibility:', window.getComputedStyle(panel).visibility);
  console.log('[ClientPanel] Panel computed opacity:', window.getComputedStyle(panel).opacity);
  console.log('[ClientPanel] Panel computed position:', window.getComputedStyle(panel).position);
  console.log('[ClientPanel] Panel computed z-index:', window.getComputedStyle(panel).zIndex);
  console.log('[ClientPanel] Panel computed top:', window.getComputedStyle(panel).top);
  console.log('[ClientPanel] Panel computed left:', window.getComputedStyle(panel).left);
  console.log('[ClientPanel] Panel computed width:', window.getComputedStyle(panel).width);
  console.log('[ClientPanel] Panel computed height:', window.getComputedStyle(panel).height);
  console.log('[ClientPanel] Panel offsetTop:', panel.offsetTop, 'offsetLeft:', panel.offsetLeft);
  console.log('[ClientPanel] Panel offsetWidth:', panel.offsetWidth, 'offsetHeight:', panel.offsetHeight);
  
  // Initialize Feather icons for the close button and other icons in the panel
  requestAnimationFrame(() => {
    try { 
      if (typeof feather !== 'undefined') {
        feather.replace({ scope: panel });
      }
    } catch (err) {
      console.warn('[ClientPanel] Failed to initialize Feather icons:', err);
    }
  });
}

function hideClientPanel() {
  const panel = document.getElementById('edit-client-container');
  if (panel) {
    // Force hide using inline style with !important equivalent
    panel.style.setProperty('display', 'none', 'important');
    
    // Remove editing class from main-content to ensure panel is hidden via CSS
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.remove('editing');
    }
  }
  
  // If we were editing a client, show their tours when panel closes
  const editingClientId = window.currentEditingClientId;
  const editingClientName = window.currentEditingClientName;
  
  if (editingClientId && editingClientName) {
    // Show the client's tours
    if (typeof window.showClientTours === 'function') {
      // Use a small delay to ensure panel is fully hidden first
      setTimeout(() => {
        window.showClientTours(parseInt(editingClientId, 10), editingClientName);
      }, 100);
    }
    // Clear the stored values
    window.currentEditingClientId = null;
    window.currentEditingClientName = null;
  } else {
    // No client was being edited, just restore default view
    restorePrimaryHeader();
    updatePageTitle('clients');
  }
}

// Expose hideClientPanel on window for use by sidebar-component.js
window.hideClientPanel = hideClientPanel;

function updateClientGatewayUi(gateway) {
  const footnote = document.getElementById('clientGatewayFootnote');
  const publicLabel = document.getElementById('clientPaymentPublicKeyLabel');
  const secretLabel = document.getElementById('clientPaymentSecretKeyLabel');
  const apiUrlInput = document.getElementById('clientPaymentApiUrl');

  const lowerGateway = (gateway || 'tilopay').toLowerCase();

  if (footnote) {
    const messages = {
      tilopay: 'Tilopay will be used with a 1% markup unless you override the endpoint or credentials above.',
      wipay: 'Provide your WiPay credentials. Leave the API endpoint blank to use the platform bridge.',
      custom: "Provide the full endpoint and credentials for the client's external payment provider."
    };
    footnote.textContent = messages[lowerGateway] || messages.tilopay;
  }

  if (publicLabel) {
    if (lowerGateway === 'wipay') publicLabel.textContent = 'WiPay Merchant Key';
    else if (lowerGateway === 'custom') publicLabel.textContent = 'Public Key / Client ID';
    else publicLabel.textContent = 'Tilopay Public Key';
  }

  if (secretLabel) {
    if (lowerGateway === 'wipay') secretLabel.textContent = 'WiPay Secret Key';
    else if (lowerGateway === 'custom') secretLabel.textContent = 'Secret Key';
    else secretLabel.textContent = 'Tilopay Secret Key';
  }

  if (apiUrlInput && !apiUrlInput.dataset.originalPlaceholder) {
    apiUrlInput.dataset.originalPlaceholder = apiUrlInput.placeholder || '';
  }

  if (apiUrlInput && !apiUrlInput.value) {
    if (lowerGateway === 'wipay') {
      apiUrlInput.placeholder = 'https://wipaycaribbean.com/api/payment/create';
    } else if (lowerGateway === 'custom') {
      apiUrlInput.placeholder = 'https://payments.example.com/api/payment/create';
    } else {
      apiUrlInput.placeholder = 'Leave blank to use the Tilopay-managed endpoint';
    }
  }
}

function showCreateClientPanel() {
  const form = document.getElementById('clientForm');
  if (!form) return;

  clientSlugTouched = false;
  currentClientCoreConfig = {};
  currentClientId = null;
  window.currentClientId = null;

  form.reset();

  const idInput = document.getElementById('clientId');
  if (idInput) idInput.value = '';

  const countryInput = document.getElementById('clientCountry');
  if (countryInput) countryInput.value = '';

  // Clear contact preference fields
  const emailInput = document.getElementById('clientEmail');
  if (emailInput) emailInput.value = '';

  const phoneInput = document.getElementById('clientPhone');
  if (phoneInput) phoneInput.value = '';

  const preferredContactSelect = document.getElementById('preferredContactMethod');
  if (preferredContactSelect) preferredContactSelect.value = '';

  const originInput = document.getElementById('clientOrigin');
  if (originInput) originInput.value = '';

  const googleKeyInput = document.getElementById('clientGoogleMapsKey');
  if (googleKeyInput) googleKeyInput.value = '';

  const transferInput = document.getElementById('clientTransferPaymentUrl');
  if (transferInput) transferInput.value = '';

  const gatewaySelect = document.getElementById('clientPaymentGateway');
  if (gatewaySelect) gatewaySelect.value = 'tilopay';

  const markupInput = document.getElementById('clientPaymentMarkup');
  if (markupInput) markupInput.value = '1';

  const modeSelect = document.getElementById('clientPaymentMode');
  if (modeSelect) modeSelect.value = 'live';

  ['clientPaymentApiUrl','clientPaymentPublicKey','clientPaymentSecretKey','clientPaymentAccountId','clientPaymentWebhookSecret','clientPaymentNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Clear pricing bands (other pricing fields removed)
  const bandsInput = document.getElementById('pricingBands');
  if (bandsInput) bandsInput.value = '';
  
  // Clear pricing bands table and load defaults
  clearPricingBandsTable();
  loadDefaultPricingBands();
  initializePricingBandsTable();

    const title = document.getElementById('client-panel-title');
    if (title) title.textContent = 'New Client';

    const breadcrumb = document.getElementById('client-panel-current-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = 'New Client';

    const subtitle = document.getElementById('client-panel-subtitle');
    if (subtitle) subtitle.textContent = 'Create Client';

  const statusBadge = document.getElementById('client-panel-status-badge');
  if (statusBadge) statusBadge.style.display = 'none';

  const deleteBtn = document.getElementById('delete-client-btn');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
  }

  updateClientGatewayUi(gatewaySelect ? gatewaySelect.value : 'tilopay');

  openClientPanel();
  overridePrimaryHeader({ 
    title: 'New Client', 
    parentLabel: 'Clients', 
    currentLabel: 'New Client',
    onClose: hideClientPanel
  });
}

async function editClient(id) {
  try {
    console.log('[ClientPanel] editClient called', id);
    const data = await apiRequest(`/admin/clients/${id}`);
    console.log('[ClientPanel] Client data loaded', data);
    const client = data.client || {};

    currentClientId = client.id || null;
    window.currentClientId = currentClientId;
    clientSlugTouched = true;
    try {
      currentClientCoreConfig = JSON.parse(JSON.stringify(client.core_config || {}));
    } catch (_) {
      currentClientCoreConfig = client.core_config || {};
    }

    const idInput = document.getElementById('clientId');
    if (idInput) idInput.value = client.id || '';

    const nameInput = document.getElementById('clientName');
    if (nameInput) nameInput.value = client.name || '';

    const displayInput = document.getElementById('clientDisplayName');
    if (displayInput) displayInput.value = client.display_name || client.name || '';


    const countryInput = document.getElementById('clientCountry');
    if (countryInput) {
      const rawCountry = client.country || client.CLIENT?.country || currentClientCoreConfig?.CLIENT?.country || '';
      countryInput.value = rawCountry ? String(rawCountry).toUpperCase() : '';
    }

    // Load contact preference fields
    const emailInput = document.getElementById('clientEmail');
    if (emailInput) emailInput.value = client.client_email || '';

    const phoneInput = document.getElementById('clientPhone');
    if (phoneInput) phoneInput.value = client.client_phone || '';

    const preferredContactSelect = document.getElementById('preferredContactMethod');
    if (preferredContactSelect) {
      preferredContactSelect.value = client.preferred_contact_method || '';
    }

    const originInput = document.getElementById('clientOrigin');
    if (originInput) {
      // Read allowed_origin directly from client object (same pattern as country)
      const rawOrigin = client.allowed_origin || '';
      console.log('[ClientPanel] Loading origin - client.allowed_origin:', client.allowed_origin, 'rawOrigin:', rawOrigin, 'client:', client);
      originInput.value = rawOrigin ? String(rawOrigin).trim() : '';
      console.log('[ClientPanel] Set origin for client:', client.name, 'origin:', rawOrigin, 'field value:', originInput.value);
    } else {
      console.error('[ClientPanel] originInput element not found!');
    }

    const googleKeyInput = document.getElementById('clientGoogleMapsKey');
    if (googleKeyInput) {
      googleKeyInput.value = client.google_maps_api_key || client.FORM_CONFIG?.GMAPS_KEY || currentClientCoreConfig?.FORM_CONFIG?.GMAPS_KEY || '';
    }

    const coreConfig = currentClientCoreConfig || {};

    const transferInput = document.getElementById('clientTransferPaymentUrl');
    if (transferInput) transferInput.value = coreConfig.TRANSFER_PAYMENT_URL || client.TRANSFER_PAYMENT_URL || '';

    const gatewaySelect = document.getElementById('clientPaymentGateway');
    const inferredGateway = (coreConfig.PAYMENT_GATEWAY || client.PAYMENT_GATEWAY || ((coreConfig.PAYMENT_API_URL || client.PAYMENT_API_URL) ? 'custom' : 'tilopay')).toLowerCase();
    if (gatewaySelect) gatewaySelect.value = inferredGateway;

    const gatewayConfig = coreConfig.PAYMENT_GATEWAY_CONFIG || client.PAYMENT_GATEWAY_CONFIG || {};

    const markupInput = document.getElementById('clientPaymentMarkup');
    if (markupInput) {
      const markupValue = typeof gatewayConfig.markupPercent === 'number'
        ? gatewayConfig.markupPercent
        : (inferredGateway === 'tilopay' ? 1 : '');
      markupInput.value = markupValue === '' ? '' : String(markupValue);
    }

    const modeSelect = document.getElementById('clientPaymentMode');
    if (modeSelect) modeSelect.value = gatewayConfig.mode || 'live';

    const apiUrlInput = document.getElementById('clientPaymentApiUrl');
    if (apiUrlInput) apiUrlInput.value = coreConfig.PAYMENT_API_URL || client.PAYMENT_API_URL || '';

    const publicKeyInput = document.getElementById('clientPaymentPublicKey');
    if (publicKeyInput) publicKeyInput.value = gatewayConfig.publicKey || '';

    const secretKeyInput = document.getElementById('clientPaymentSecretKey');
    if (secretKeyInput) secretKeyInput.value = gatewayConfig.secretKey || '';

    const accountIdInput = document.getElementById('clientPaymentAccountId');
    if (accountIdInput) accountIdInput.value = gatewayConfig.accountId || '';

    const webhookInput = document.getElementById('clientPaymentWebhookSecret');
    if (webhookInput) webhookInput.value = gatewayConfig.webhookSecret || '';

    const notesInput = document.getElementById('clientPaymentNotes');
    if (notesInput) notesInput.value = gatewayConfig.notes || '';

    const qrc = client.quote_results_config || client.QUOTE_RESULTS_CONFIG || coreConfig.QUOTE_RESULTS_CONFIG || {};

    // Removed pricing input fields: minPricePP, minPassengers, defaultPassengers, remoteSurchargePP, remoteKeywords

    // Load bands into table (new format)
    const bandsInput = document.getElementById('pricingBands');
    const bandsBody = document.getElementById('pricingBandsBody');
    
    if (bandsBody && qrc.bands && Array.isArray(qrc.bands) && qrc.bands.length > 0) {
      // Clear existing rows
      bandsBody.innerHTML = '';
      
      // Convert old format to new if needed, or use new format
      qrc.bands.forEach((band, index) => {
        let minMi, maxMi, priceType, priceAmount;
        
        if (band.minMi !== undefined) {
          // New format
          minMi = band.minMi ?? 0;
          maxMi = band.maxMi ?? null;
          priceType = band.price?.type || 'per_person';
          priceAmount = band.price?.amount || band.price || 0;
        } else {
          // Old format (maxMi, pricePP) - convert to new
          const prevBand = index > 0 ? qrc.bands[index - 1] : null;
          minMi = prevBand?.maxMi || 0;
          maxMi = band.maxMi ?? null;
          priceType = 'per_person';
          priceAmount = band.pricePP || band.price || 0;
        }
        
        addPricingBandRow(minMi, maxMi, priceType, priceAmount);
      });
      
      // Update hidden JSON field
      if (bandsInput) updatePricingBandsJSON();
    } else if (bandsBody) {
      // No bands configured - load defaults for this client
      loadDefaultPricingBands();
    }
    
    // Initialize table controls
    initializePricingBandsTable();

    const title = document.getElementById('client-panel-title');
    if (title) title.textContent = client.display_name || client.name || 'Edit Client';

    const breadcrumb = document.getElementById('client-panel-current-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = client.display_name || client.name || 'Edit Client';

    const subtitle = document.getElementById('client-panel-subtitle');
    if (subtitle) subtitle.textContent = 'Edit Client';

    const statusBadge = document.getElementById('client-panel-status-badge');
    if (statusBadge) {
      const statusText = (client.status || 'inactive').toUpperCase();
      statusBadge.textContent = statusText;
      statusBadge.style.display = 'inline-flex';
    }

    const deleteBtn = document.getElementById('delete-client-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'inline-flex';
      deleteBtn.onclick = handleDeleteClient;
    }

    updateClientGatewayUi(inferredGateway);
    console.log('[ClientPanel] Opening panel now');
    openClientPanel();
    
    // Preload tours for this client in the background
    if (client.id && typeof window.loadToursForClient === 'function') {
      window.loadToursForClient(client.id).catch(err => {
        console.warn('[ClientPanel] Failed to preload tours:', err);
      });
    }
    overridePrimaryHeader({
      title: client.display_name || client.name || 'Edit Client',
      parentLabel: 'Clients',
      currentLabel: 'Edit Client',
      onClose: hideClientPanel
    });
    console.log('[ClientPanel] Panel open completed');
  } catch (error) {
    console.error('[ClientPanel] Failed to load client', error);
    alert(`Failed to load client: ${error.message}`);
  }
}

async function saveClient(event) {
  // FORCE IMMEDIATE EXECUTION - Before any other code
  (function() {
    try {
      console.log('[saveClient] === FUNCTION CALLED === v17 FORCE');
      debugger; // Force breakpoint if DevTools is open
    } catch (e) {
      console.error('[saveClient] Error in immediate block:', e);
    }
  })();
  
  try {
    console.log('[saveClient] === FUNCTION CALLED === v17');
    console.log('[saveClient] Inside try block');
    console.log('[saveClient] Event:', event);
    console.log('[saveClient] typeof event:', typeof event);
    
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
      console.log('[saveClient] Prevented default');
    }
    
    console.log('[saveClient] Starting save...');
    
    // Use querySelector as fallback and add extensive logging
    const idEl = document.getElementById('clientId') || document.querySelector('#clientId');
    const nameEl = document.getElementById('clientName') || document.querySelector('#clientName');
    const displayNameEl = document.getElementById('clientDisplayName') || document.querySelector('#clientDisplayName');
    const googleMapsKeyEl = document.getElementById('clientGoogleMapsKey') || document.querySelector('#clientGoogleMapsKey');
    const clientCountryEl = document.getElementById('clientCountry') || document.querySelector('#clientCountry');
    
    console.log('[saveClient] Element lookup results:', {
      idEl: idEl,
      nameEl: nameEl,
      displayNameEl: displayNameEl,
      googleMapsKeyEl: googleMapsKeyEl,
      clientCountryEl: clientCountryEl
    });
    
    console.log('[saveClient] Elements existence check:', { 
      idEl: !!idEl, 
      nameEl: !!nameEl, 
      displayNameEl: !!displayNameEl,
      googleMapsKeyEl: !!googleMapsKeyEl,
      clientCountryEl: !!clientCountryEl
    });
    
    if (!idEl || !nameEl || !displayNameEl) {
      const missing = [];
      if (!idEl) missing.push('clientId');
      if (!nameEl) missing.push('clientName');
      if (!displayNameEl) missing.push('clientDisplayName');
      
      alert(`Required form fields are missing: ${missing.join(', ')}. Please refresh the page and try again.`);
      console.error('[saveClient] Missing required fields:', missing);
      return;
    }
    
    const id = idEl.value || '';
    const name = nameEl.value ? nameEl.value.trim() : '';
    const display_name = displayNameEl.value ? displayNameEl.value.trim() : '';
    const google_maps_api_key = googleMapsKeyEl && googleMapsKeyEl.value ? googleMapsKeyEl.value.trim() : '';
    const countryRaw = clientCountryEl && clientCountryEl.value ? clientCountryEl.value.trim().toUpperCase() : '';
    const originInputEl = document.getElementById('clientOrigin');
    const allowedOrigin = originInputEl && originInputEl.value ? originInputEl.value.trim() : '';
    
    console.log('[saveClient] Origin field value:', allowedOrigin, 'originInputEl:', originInputEl);
    
    if (!name || !display_name) {
      alert('Client name and display name are required.');
      return;
    }

  // Build optional QUOTE_RESULTS_CONFIG from fields (only include if any provided)
  // Get bands from table (update JSON first to ensure it's current)
  updatePricingBandsJSON();
  const bandsRaw = document.getElementById('pricingBands')?.value;

  let quote_results_config;
  try {
    const hasAny = bandsRaw;
    if (hasAny) {
      quote_results_config = {};
      
      // Get bands from table (update JSON first to ensure it's current)
      updatePricingBandsJSON();
      const bandsRaw = document.getElementById('pricingBands')?.value;
      
      if (bandsRaw && bandsRaw.trim()) {
        try {
          const parsed = JSON.parse(bandsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate before saving
            const validation = validatePricingBands();
            if (!validation) {
              alert('Please fix the validation errors in Distance Bands before saving.');
              return;
            }
            quote_results_config.bands = parsed;
          }
        } catch (e) {
          alert('Bands JSON is invalid. Please fix and try again.');
          return;
        }
      }
    }
  } catch (e) {
    console.warn('Failed building quote_results_config:', e);
  }

  const transferPaymentUrl = document.getElementById('clientTransferPaymentUrl')?.value?.trim() || '';
  const paymentGatewaySelect = document.getElementById('clientPaymentGateway');
  const paymentGateway = paymentGatewaySelect ? paymentGatewaySelect.value : 'tilopay';
  const paymentApiUrl = document.getElementById('clientPaymentApiUrl')?.value?.trim() || '';
  const paymentMarkupRaw = document.getElementById('clientPaymentMarkup')?.value || '';
  const paymentMode = document.getElementById('clientPaymentMode')?.value || 'live';
  const paymentPublicKey = document.getElementById('clientPaymentPublicKey')?.value?.trim() || '';
  const paymentSecretKey = document.getElementById('clientPaymentSecretKey')?.value?.trim() || '';
  const paymentAccountId = document.getElementById('clientPaymentAccountId')?.value?.trim() || '';
  const paymentWebhookSecret = document.getElementById('clientPaymentWebhookSecret')?.value?.trim() || '';
  const paymentNotes = document.getElementById('clientPaymentNotes')?.value?.trim() || '';

  const coreConfig = { ...(currentClientCoreConfig || {}) };
  coreConfig.PAYMENT_GATEWAY = paymentGateway;

  if (transferPaymentUrl) coreConfig.TRANSFER_PAYMENT_URL = transferPaymentUrl;
  else delete coreConfig.TRANSFER_PAYMENT_URL;

  if (paymentApiUrl) coreConfig.PAYMENT_API_URL = paymentApiUrl;
  else delete coreConfig.PAYMENT_API_URL;

  const gatewayConfig = {};

  if (paymentMode) gatewayConfig.mode = paymentMode;
  if (paymentPublicKey) gatewayConfig.publicKey = paymentPublicKey;
  if (paymentSecretKey) gatewayConfig.secretKey = paymentSecretKey;
  if (paymentAccountId) gatewayConfig.accountId = paymentAccountId;
  if (paymentWebhookSecret) gatewayConfig.webhookSecret = paymentWebhookSecret;
  if (paymentNotes) gatewayConfig.notes = paymentNotes;

  let markupValue = null;
  if (paymentMarkupRaw !== undefined && paymentMarkupRaw !== null && paymentMarkupRaw !== '') {
    const parsedMarkup = parseFloat(paymentMarkupRaw);
    if (!Number.isNaN(parsedMarkup)) markupValue = parsedMarkup;
  }
  if (markupValue === null && paymentGateway === 'tilopay') {
    markupValue = 1;
  }
  if (markupValue !== null) gatewayConfig.markupPercent = markupValue;

  Object.keys(gatewayConfig).forEach(key => {
    const val = gatewayConfig[key];
    if (val === undefined || val === null || val === '') {
      delete gatewayConfig[key];
    }
  });

  if (Object.keys(gatewayConfig).length) {
    coreConfig.PAYMENT_GATEWAY_CONFIG = gatewayConfig;
  } else {
    delete coreConfig.PAYMENT_GATEWAY_CONFIG;
  }

  currentClientCoreConfig = coreConfig;
  
  // Get contact preference fields
  const clientEmailEl = document.getElementById('clientEmail') || document.querySelector('#clientEmail');
  const clientPhoneEl = document.getElementById('clientPhone') || document.querySelector('#clientPhone');
  const preferredContactEl = document.getElementById('preferredContactMethod') || document.querySelector('#preferredContactMethod');
  
  const client_email = clientEmailEl && clientEmailEl.value ? clientEmailEl.value.trim() : null;
  const client_phone = clientPhoneEl && clientPhoneEl.value ? clientPhoneEl.value.trim() : null;
  const preferred_contact_method = preferredContactEl && preferredContactEl.value ? preferredContactEl.value.trim() : null;
  
  const payload = { name, display_name, google_maps_api_key: google_maps_api_key || null };
  if (countryRaw) {
    payload.country = countryRaw;
  } else if (clientCountryEl) {
    payload.country = null;
  }
  
  // Add contact preference fields
  if (clientEmailEl) payload.client_email = client_email;
  if (clientPhoneEl) payload.client_phone = client_phone;
  if (preferredContactEl) payload.preferred_contact_method = preferred_contact_method;
  
  // Handle allowed_origin similar to country - always include if field exists
  // Note: originInputEl was already retrieved above
  if (originInputEl) {
    if (allowedOrigin) {
      payload.allowed_origin = allowedOrigin.trim();
      console.log('[saveClient] Setting allowed_origin in payload:', payload.allowed_origin);
    } else {
      // Field exists but is empty - explicitly set to null to clear it (same as country)
      payload.allowed_origin = null;
      console.log('[saveClient] Setting allowed_origin to null (empty field)');
    }
  }
  console.log('[saveClient] Final payload allowed_origin:', payload.allowed_origin);
  console.log('[saveClient] Full payload:', JSON.stringify(payload, null, 2));
  if (quote_results_config) payload.quote_results_config = quote_results_config;
  if (Object.keys(coreConfig).length) {
    payload.core_config = coreConfig;
  }
  
  try {
    if (id) {
      const requestPayload = JSON.stringify(payload);
      console.log('[saveClient] Sending PUT request with payload:', requestPayload);
      await apiRequest(`/admin/clients/${id}`, {
        method: 'PUT',
        body: requestPayload
      });
      showSuccess('Client updated successfully!');
    } else {
      await apiRequest(`/admin/clients`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showSuccess('Client created successfully!');
    }
    // Don't close panel automatically - user can close manually after reviewing
    loadClients();
    loadClientsForFilter?.();
    if (typeof loadClientDropdown === 'function') {
      try { await loadClientDropdown(); } catch (e) { console.warn('Failed to refresh client dropdown:', e); }
    }
  } catch (error) {
    console.error('[saveClient] API error:', error);
    alert(`Failed to save client: ${error.message || 'Unknown error'}`);
  }
  } catch (error) {
    console.error('[saveClient] Form validation/processing error:', error);
    console.error('[saveClient] Error stack:', error.stack);
    console.error('[saveClient] Error details:', {
      message: error.message,
      name: error.name,
      line: error.line,
      column: error.column
    });
    alert(`Failed to save client: ${error.message || 'Unknown error'}\n\nCheck console for details.`);
  }
}

// Expose saveClient on window after it's defined
window.saveClient = saveClient;

function handleDeleteClient() {
  if (!currentClientId) {
    alert('Client details not loaded yet.');
    return;
  }
  const displayName = document.getElementById('clientDisplayName')?.value || document.getElementById('clientName')?.value || 'this client';
  deleteClient(currentClientId, displayName);
}

async function deleteClient(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated tours.`)) {
    return;
  }
  
  try {
    await apiRequest(`/admin/clients/${id}`, { method: 'DELETE' });
    showSuccess('Client deleted successfully!');
    await loadClients();
    loadClientsForFilter?.();
    if (typeof loadClientDropdown === 'function') {
      try {
        await loadClientDropdown();
      } catch (err) {
        console.warn('Failed to refresh client dropdown after delete:', err);
      }
    }

    if (String(currentClientId) === String(id) || String(window.currentClientId) === String(id)) {
      currentClientId = null;
      window.currentClientId = null;
      hideClientPanel();
      hideEditTour();
    }
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
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'data-table';
    
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Location</th>
          <th>Duration</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.tours.map(tour => {
          const normalizedStatus = tour.status === 'active' ? 'published' : (tour.status || 'draft');
          const statusLabel = normalizedStatus === 'published' ? 'Published' : 'Draft';
          const statusBadge = normalizedStatus === 'published' ? 'success' : 'warning';
          return `
          <tr>
            <td>${tour.id}</td>
            <td><strong>${tour.name}</strong><br><small style="color: #666;">${tour.slug}</small></td>
            <td>${tour.type || tour.category || '-'}</td>
            <td>${tour.location || '-'}</td>
            <td>${tour.duration || '-'}</td>
            <td>${tour.from_price ? `$${tour.from_price}` : '-'}</td>
            <td><span class="badge badge-${statusBadge}">${statusLabel}</span></td>
            <td>
              <button class="btn btn-primary" onclick="editTour(${tour.id})">Edit</button>
            </td>
          </tr>
        `;}).join('')}
      </tbody>
    `;
    
    tableContainer.appendChild(table);
    tableDiv.appendChild(tableContainer);
  } catch (error) {
    loading.style.display = 'none';
    showError('toursError', error.message);
  }
}

function showCreateTourModal() {
  if (typeof window.keepClientsDropdownOpen === 'function') {
    window.keepClientsDropdownOpen();
  }
  if (typeof showEditTour === 'function') {
    showEditTour(null);
  }
}

function closeTourModal() {
  document.getElementById('tourModal').classList.remove('active');
}

// editTour function moved to panel functionality section below

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

// showClientTours function moved to sidebar.js

// Load tours for a specific client
let isLoadingTours = false;

async function loadToursForClient(clientId) {
  const loading = document.getElementById('toursLoading');
  const tableDiv = document.getElementById('toursTable');
  
  console.log('=== loadToursForClient called ===');
  console.log('Client ID:', clientId);
  console.log('Is already loading:', isLoadingTours);
  
  // Prevent duplicate calls
  if (isLoadingTours) {
    console.log('Already loading, skipping duplicate call');
    return;
  }
  
  isLoadingTours = true;
  loading.style.display = 'block';
  tableDiv.innerHTML = ''; // Clear completely
  
  console.log('Table div after clear:', tableDiv.innerHTML.length);
  
  try {
    console.log('Loading tours for client ID:', clientId);
    // Load tours for this client with all statuses (draft, published, etc.)
    const data = await apiRequest(`/admin/tours?client_id=${clientId}&status=all`);
    console.log('Tours loaded for client:', data);
    
    const filteredTours = data.tours || [];
    console.log('Filtered tours for client:', filteredTours);
    
    loading.style.display = 'none';
    
    if (!filteredTours || filteredTours.length === 0) {
      tableDiv.innerHTML = `<p style="text-align:center;color:#666;padding:40px;">No tours found for this client.</p>`;
      return;
    }
    
    // Store tours globally for sorting
    window.currentClientTours = filteredTours;
    window.currentClientId = clientId;
    window.currentSortDirection = 'asc';
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'data-table';
    
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th class="checkbox-col"><input type="checkbox" id="selectAllTours" /></th>
          <th>Name</th>
          <th class="sortable-header" onclick="sortToursByType()" style="cursor: pointer; user-select: none;">
            Type <i data-feather="chevron-up" class="sort-icon" style="width: 14px; height: 14px; margin-left: 4px;"></i>
          </th>
          <th>Location</th>
          <th>Duration</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="toursTableBody">
        ${filteredTours.map(tour => {
          const normalizedStatus = tour.status === 'active' ? 'published' : (tour.status || 'draft');
          const statusLabel = normalizedStatus === 'published' ? 'Published' : 'Draft';
          const statusBadge = normalizedStatus === 'published' ? 'success' : 'warning';
          return `
          <tr>
            <td class="checkbox-col"><input type="checkbox" class="tour-select" data-tour-id="${tour.id}" data-tour-status="${normalizedStatus}"></td>
            <td><strong>${tour.name}</strong><br><small style="color: #666;">${tour.slug}</small></td>
            <td>${tour.type || tour.category || '-'}</td>
            <td>${tour.location || '-'}</td>
            <td>${tour.duration || '-'}</td>
            <td>${tour.from_price ? `$${tour.from_price}` : '-'}</td>
            <td><span class="badge badge-${statusBadge}">${statusLabel}</span></td>
            <td>
              <button class="btn btn-primary" onclick="editTour(${tour.id})">Edit</button>
            </td>
          </tr>
        `;}).join('')}
      </tbody>
    `;
    
    tableContainer.appendChild(table);
    tableDiv.appendChild(tableContainer);
    
    // Initialize Feather icons for the sort icon
    if (typeof feather !== 'undefined') {
      feather.replace();
    }

    setupBulkTourSelection();
  } catch (error) {
    loading.style.display = 'none';
    showError('toursError', error.message);
  } finally {
    isLoadingTours = false; // Reset loading flag
  }
}

// Show all tours (clear client filter)
function showAllTours() {
  // Remove active class from all client links
  document.querySelectorAll('#clientsDropdown .sidebar-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Reset the page title
  const actionBar = document.querySelector('#toursTab .action-bar h2');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  
  if (actionBar) {
    actionBar.textContent = 'Tours';
  }
  if (clearFilterBtn) {
    clearFilterBtn.style.display = 'none';
  }
  
  // Reset the client filter dropdown
  const clientFilter = document.getElementById('tourClientFilter');
  if (clientFilter) {
    clientFilter.value = '';
  }
  
  // Load all tours
  loadTours();
}

// Filter by client (called from URL parameter)
async function filterByClient(clientId) {
  console.log('Auto-filtering by client:', clientId);
  
  // Switch to tours tab
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById('toursTab').classList.add('active');
  
  // Clear all sidebar active states
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  
  // Find and highlight the client
  const clientLink = document.querySelector(`#clientsDropdown .sidebar-link[data-client-id="${clientId}"]`);
  if (clientLink) {
    clientLink.classList.add('active');
    
    // Get client name for display
    const clientName = clientLink.textContent.trim();
    
    // Update the page title to show client name
    updatePageTitleForClient(clientName);
    
    // Show clear filter button
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    if (clearFilterBtn) {
      clearFilterBtn.style.display = 'inline-block';
    }
    
    // Load tours filtered by client
    await loadToursForClient(clientId);
  }
}

// showToursByStatus function moved to sidebar.js

// Load tours by status
async function loadToursByStatus(status) {
  const loading = document.getElementById('toursLoading');
  const tableDiv = document.getElementById('toursTable');
  
  loading.style.display = 'block';
  tableDiv.innerHTML = '';
  
  try {
    const data = await apiRequest('/admin/tours');
    loading.style.display = 'none';
    
    // Filter tours by status
    let filteredTours = data.tours;
    if (status === 'draft') {
      filteredTours = data.tours.filter(tour => tour.status === 'draft');
    } else if (status === 'published') {
      filteredTours = data.tours.filter(tour => tour.status === 'published');
    }
    
    if (!filteredTours || filteredTours.length === 0) {
      tableDiv.innerHTML = `<p style="text-align:center;color:#666;padding:40px;">No ${status} tours found.</p>`;
      return;
    }
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'data-table';
    
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Location</th>
          <th>Duration</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filteredTours.map(tour => {
          const normalizedStatus = tour.status === 'active' ? 'published' : (tour.status || 'draft');
          const statusLabel = normalizedStatus === 'published' ? 'Published' : 'Draft';
          const statusBadge = normalizedStatus === 'published' ? 'success' : 'warning';
          return `
          <tr>
            <td>${tour.id}</td>
            <td><strong>${tour.name}</strong><br><small style="color: #666;">${tour.slug}</small></td>
            <td>${tour.type || tour.category || '-'}</td>
            <td>${tour.location || '-'}</td>
            <td>${tour.duration || '-'}</td>
            <td>${tour.from_price ? `$${tour.from_price}` : '-'}</td>
            <td><span class="badge badge-${statusBadge}">${statusLabel}</span></td>
            <td>
              <button class="btn btn-primary" onclick="editTour(${tour.id})">Edit</button>
            </td>
          </tr>
        `;}).join('')}
      </tbody>
    `;
    
    tableContainer.appendChild(table);
    tableDiv.appendChild(tableContainer);
  } catch (error) {
    loading.style.display = 'none';
    showError('toursError', error.message);
  }
}

// loadClientDropdown function moved to sidebar.js

// Dropdown functionality moved to sidebar.js

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  loadConfig();
  // Load initial data
  loadClients();

  const gatewaySelect = document.getElementById('clientPaymentGateway');
  if (gatewaySelect) {
    gatewaySelect.addEventListener('change', (event) => updateClientGatewayUi(event.target.value));
  }

  const displayInput = document.getElementById('clientDisplayName');
  const slugInput = document.getElementById('clientName');
  if (displayInput && slugInput) {
    displayInput.addEventListener('input', () => {
      if (!clientSlugTouched) {
        slugInput.value = slugify(displayInput.value);
      }
    });
    slugInput.addEventListener('input', () => {
      clientSlugTouched = true;
    });
    slugInput.addEventListener('blur', () => {
      if (!slugInput.value && displayInput.value) {
        slugInput.value = slugify(displayInput.value);
      }
    });
  }

  const deleteBtn = document.getElementById('delete-client-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDeleteClient);
  }
});

// Initialize
loadConfig();

// ========================================
// EDIT TOUR TABBED INTERFACE FUNCTIONALITY
// ========================================

// Global variables for edit tour
let quillEditors = {};
let tourData = {
  highlights: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  faqs: [],
  tags: []
};

// Show edit tour interface
function showEditTour(tourId) {
  console.log('showEditTour called with tourId:', tourId);
  
  const container = document.getElementById('edit-tour-container');
  if (!container) {
    console.error('Edit tour container not found');
    return;
  }
  
  // Show the container
  container.style.display = 'block';
  console.log('Edit tour container display set to block');
  console.log('Container visible:', container.offsetWidth > 0 && container.offsetHeight > 0);
  console.log('Container display style:', window.getComputedStyle(container).display);
  
  // Update header
  const titleText = tourId ? 'Edit Tour' : 'New Tour';
  overridePrimaryHeader({
    title: titleText,
    parentLabel: 'Tours',
    currentLabel: titleText,
    onClose: hideEditTour
  });
  
  // Initialize Quill editors first
  initializeQuillEditors();
  initializeTagify();
  initializeTabNavigation();
  
  // Load tour data after editors are initialized
  if (tourId) {
    setTimeout(() => {
      loadTourForEdit(tourId);
    }, 200);
  } else {
    // New tour
    clearEditForm();
  }
}

// Hide edit tour interface
function hideEditTour() {
  console.log('hideEditTour called');
  
  const container = document.getElementById('edit-tour-container');
  if (container) {
    container.style.display = 'none';
  }
  
  // Restore header
  restorePrimaryHeader();
  
  // Keep clients dropdown open to maintain context
  if (typeof window.keepClientsDropdownOpen === 'function') {
    window.keepClientsDropdownOpen();
  }
}

// Load tour data for editing
async function loadTourForEdit(tourId) {
  try {
    console.log('Loading tour for edit:', tourId);
    
    const data = await apiRequest(`/admin/tours/${tourId}`);
    const tour = data.tour;
    
    console.log('Tour data loaded:', tour);
    
    const statusSelect = document.getElementById('editTourStatusSelect');
    if (statusSelect) {
      let statusValue = 'draft';
      if (tour.status) {
        statusValue = tour.status === 'active' ? 'published' : tour.status;
      } else if (tour.active || tour.is_active || tour.published) {
        statusValue = 'published';
      }
      if (!['draft', 'published'].includes(statusValue)) statusValue = 'draft';
      statusSelect.value = statusValue;
    }

    // Fill form fields
    console.log('Filling form fields...');
    const fields = [
      'editTourId', 'editTourSlug', 'editTourName', 'editTourCategory',
      'editTourTags', 'editTourLocation', 'editTourDuration', 'editTourPrice', 'editTourCurrency',
      'editTourAdultPrice', 'editTourChildPrice', 'editTourSeniorPrice', 'editTourVideoUrl', 'editTourVideoType'
    ];
    
    fields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        console.log(`Found field: ${fieldId}`);
      } else {
        console.error(`Field not found: ${fieldId}`);
      }
    });
    
    // Debug: Check which fields are not getting values
    console.log('Tour data fields available:', Object.keys(tour));
    console.log('Checking field values after population:');
    
    // Map tour data to form fields with proper field names
    // Wrap each assignment in try-catch to identify which field is failing
    try {
      const idEl = document.getElementById('editTourId');
      if (!idEl) {
        console.error('editTourId element not found');
        throw new Error('editTourId element not found in DOM');
      }
      idEl.value = String(tour.id || '');
    } catch (err) {
      console.error('Error setting editTourId:', err);
      throw new Error(`Failed to set tour ID: ${err.message}`);
    }
    
    try {
      const slugEl = document.getElementById('editTourSlug');
      if (!slugEl) {
        console.error('editTourSlug element not found');
        throw new Error('editTourSlug element not found in DOM');
      }
      slugEl.value = String(tour.slug || '');
    } catch (err) {
      console.error('Error setting editTourSlug:', err);
      throw new Error(`Failed to set tour slug: ${err.message}`);
    }
    
    try {
      const nameEl = document.getElementById('editTourName');
      if (!nameEl) {
        console.error('editTourName element not found');
        throw new Error('editTourName element not found in DOM');
      }
      nameEl.value = String(tour.name || '');
    } catch (err) {
      console.error('Error setting editTourName:', err);
      throw new Error(`Failed to set tour name: ${err.message}`);
    }
    
    // Status handled via sticky header select
    
    // Category field
    try {
      const categoryEl = document.getElementById('editTourCategory');
      if (categoryEl) {
        categoryEl.value = String(tour.category || '');
        if (categoryEl.tagify) {
          categoryEl.tagify.removeAllTags();
          if (tour.category) categoryEl.tagify.addTags([String(tour.category)]);
        }
      } else {
        console.warn('editTourCategory element not found');
      }
    } catch (err) {
      console.error('Error setting category:', err);
    }
    
    // Tags field
    try {
      const tagsInput = document.getElementById('editTourTags');
      if (tagsInput) {
        if (tagsInput.tagify) {
          if (tour.tags) {
            // Parse tags if it's a string or use as array
            const tags = typeof tour.tags === 'string' ? tour.tags.split(',').map(tag => tag.trim()) : tour.tags;
            tagsInput.tagify.addTags(tags);
          }
        } else {
          tagsInput.value = String(tour.tags || '');
        }
      } else {
        console.warn('editTourTags element not found');
      }
    } catch (err) {
      console.error('Error setting tags:', err);
    }
    
    // Location field
    try {
      const locationEl = document.getElementById('editTourLocation');
      if (locationEl) locationEl.value = String(tour.location || '');
      else console.warn('editTourLocation element not found');
    } catch (err) {
      console.error('Error setting location:', err);
    }
    
    // Duration field
    try {
      const durationEl = document.getElementById('editTourDuration');
      if (durationEl) durationEl.value = String(tour.duration || '');
      else console.warn('editTourDuration element not found');
    } catch (err) {
      console.error('Error setting duration:', err);
    }
    
    // Price field
    try {
      const priceEl = document.getElementById('editTourPrice');
      if (priceEl) priceEl.value = String(tour.from_price || '');
      else console.warn('editTourPrice element not found');
    } catch (err) {
      console.error('Error setting price:', err);
    }
    
    // Currency field
    try {
      const currencyEl = document.getElementById('editTourCurrency');
      if (currencyEl) currencyEl.value = String(tour.currency || 'USD');
      else console.warn('editTourCurrency element not found');
    } catch (err) {
      console.error('Error setting currency:', err);
    }
    
    // Adult price field
    try {
      const adultPriceEl = document.getElementById('editTourAdultPrice');
      if (adultPriceEl) adultPriceEl.value = String(tour.adult_price || '');
      else console.warn('editTourAdultPrice element not found');
    } catch (err) {
      console.error('Error setting adult price:', err);
    }
    
    // Child price field
    try {
      const childPriceEl = document.getElementById('editTourChildPrice');
      if (childPriceEl) childPriceEl.value = String(tour.child_price || '');
      else console.warn('editTourChildPrice element not found');
    } catch (err) {
      console.error('Error setting child price:', err);
    }
    
    // Senior price field
    try {
      const seniorPriceEl = document.getElementById('editTourSeniorPrice');
      if (seniorPriceEl) seniorPriceEl.value = String(tour.senior_price || '');
      else console.warn('editTourSeniorPrice element not found');
    } catch (err) {
      console.error('Error setting senior price:', err);
    }
    
    // Video URL field
    try {
      const videoUrlEl = document.getElementById('editTourVideoUrl');
      if (videoUrlEl) videoUrlEl.value = String(tour.video_url || '');
      else console.warn('editTourVideoUrl element not found');
    } catch (err) {
      console.error('Error setting video URL:', err);
    }
    
    // Video type field
    try {
      const videoTypeEl = document.getElementById('editTourVideoType');
      if (videoTypeEl) videoTypeEl.value = String(tour.video_type || '');
      else console.warn('editTourVideoType element not found');
    } catch (err) {
      console.error('Error setting video type:', err);
    }
    
    // Debug: Check specific fields that might have different names
    console.log('Status field mapping:', {
      'tour.status': tour.status,
      'tour.published': tour.published,
      'tour.active': tour.active,
      'tour.is_active': tour.is_active
    });
    
    console.log('Highlights field mapping:', {
      'tour.highlights': tour.highlights,
      'tour.highlights_html': tour.highlights_html,
      'tour.highlights_text': tour.highlights_text
    });
    
    console.log('Inclusions field mapping:', {
      'tour.inclusions': tour.inclusions,
      'tour.inclusions_html': tour.inclusions_html,
      'tour.inclusions_text': tour.inclusions_text,
      'tour.whats_included': tour.whats_included
    });
    
    console.log('Media field mapping:', {
      'tour.image': tour.image,
      'tour.images': tour.images,
      'tour.gallery': tour.gallery,
      'tour.media': tour.media,
      'tour.photos': tour.photos
    });
    
    // Handle gallery/media data - merge single image with gallery
    let allImages = [];
    
    // Add single featured image if it exists
    if (tour.image) {
      console.log('Found single image:', tour.image);
      allImages.push(tour.image);
    }
    
    // Add gallery images if they exist
    if (tour.gallery && Array.isArray(tour.gallery) && tour.gallery.length > 0) {
      console.log('Found gallery images:', tour.gallery);
      allImages = allImages.concat(tour.gallery);
    }
    
    // Add other image arrays if they exist
    if (tour.images && Array.isArray(tour.images) && tour.images.length > 0) {
      console.log('Found images array:', tour.images);
      allImages = allImages.concat(tour.images);
    }
    
    if (tour.photos && Array.isArray(tour.photos) && tour.photos.length > 0) {
      console.log('Found photos array:', tour.photos);
      allImages = allImages.concat(tour.photos);
    }
    
    // Remove duplicates and log final merged gallery
    const uniqueImages = [...new Set(allImages)];
    console.log('Merged image gallery:', uniqueImages);
    
    populateImageGallery(uniqueImages);

    if (uniqueImages.length > 0) {
      console.log('Total images found:', uniqueImages.length);
    } else {
      console.log('No images found in any field');
    }
    
    console.log('Form fields filled');
    
    // Debug: Check actual field values after population
    fields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        console.log(`${fieldId}: "${element.value}"`);
      }
    });
    
    // Debug: Check if form fields are visible
    const testField = document.getElementById('editTourName');
    if (testField) {
      console.log('Test field value:', testField.value);
      console.log('Test field visible:', testField.offsetWidth > 0 && testField.offsetHeight > 0);
      console.log('Test field display:', window.getComputedStyle(testField).display);
      console.log('Test field visibility:', window.getComputedStyle(testField).visibility);
      console.log('Test field width:', testField.offsetWidth);
      console.log('Test field height:', testField.offsetHeight);
      console.log('Test field computed width:', window.getComputedStyle(testField).width);
      console.log('Test field computed height:', window.getComputedStyle(testField).height);
      console.log('Test field parent:', testField.parentElement);
      console.log('Test field parent display:', window.getComputedStyle(testField.parentElement).display);
      console.log('Test field parent visibility:', window.getComputedStyle(testField.parentElement).visibility);
      
      // Check parent hierarchy for zero dimensions
      let currentElement = testField;
      let level = 0;
      while (currentElement && level < 10) {
        const computedStyle = window.getComputedStyle(currentElement);
        console.log(`Level ${level} - ${currentElement.tagName}.${currentElement.className}:`, {
          width: currentElement.offsetWidth,
          height: currentElement.offsetHeight,
          computedWidth: computedStyle.width,
          computedHeight: computedStyle.height,
          display: computedStyle.display,
          visibility: computedStyle.visibility
        });
        currentElement = currentElement.parentElement;
        level++;
      }
      
      // Field should be visible by default
      console.log('Field visibility check complete');
      
      // Form fields should be visible by default - no need for aggressive styling
      console.log('Form fields populated successfully');
    }
    
    // Debug: Check tab content visibility
    const overviewTab = document.getElementById('overview-tab');
    if (overviewTab) {
      console.log('Overview tab display:', window.getComputedStyle(overviewTab).display);
      console.log('Overview tab visibility:', window.getComputedStyle(overviewTab).visibility);
      console.log('Overview tab has active class:', overviewTab.classList.contains('active'));
    }
    
    // Set Quill content with debugging
    console.log('Setting Quill content...');
    
    if (tour.description_html) {
      console.log('Setting description content:', tour.description_html);
      setQuillContent('description', tour.description_html);
    } else {
      console.log('No description_html found');
    }
    
    if (tour.highlights_html) {
      console.log('Setting highlights content:', tour.highlights_html);
      setQuillContent('highlights', tour.highlights_html);
    } else {
      console.log('No highlights_html found, checking alternatives...');
      if (tour.highlights && Array.isArray(tour.highlights)) {
        console.log('Found highlights (array):', tour.highlights);
        // Convert array to HTML list
        const highlightsHtml = '<ul>' + tour.highlights.map(item => `<li>${item}</li>`).join('') + '</ul>';
        setQuillContent('highlights', highlightsHtml);
      } else if (tour.highlights) {
        console.log('Found highlights (text):', tour.highlights);
        setQuillContent('highlights', tour.highlights);
      }
    }
    
    if (tour.itinerary_html) {
      console.log('Setting itinerary content:', tour.itinerary_html);
      setQuillContent('itinerary', tour.itinerary_html);
    } else {
      console.log('No itinerary_html found');
    }
    
    if (tour.inclusions_html) {
      console.log('Setting inclusions content:', tour.inclusions_html);
      setQuillContent('inclusions', tour.inclusions_html);
    } else {
      console.log('No inclusions_html found, checking alternatives...');
      if (tour.inclusions && Array.isArray(tour.inclusions)) {
        console.log('Found inclusions (array):', tour.inclusions);
        // Convert array to HTML list
        const inclusionsHtml = '<ul>' + tour.inclusions.map(item => `<li>${item}</li>`).join('') + '</ul>';
        setQuillContent('inclusions', inclusionsHtml);
      } else if (tour.inclusions) {
        console.log('Found inclusions (text):', tour.inclusions);
        setQuillContent('inclusions', tour.inclusions);
      }
      if (tour.whats_included) {
        console.log('Found whats_included:', tour.whats_included);
        setQuillContent('inclusions', tour.whats_included);
      }
    }
    
    if (tour.exclusions_html) {
      console.log('Setting exclusions content:', tour.exclusions_html);
      setQuillContent('exclusions', tour.exclusions_html);
    } else {
      console.log('No exclusions_html found');
    }
    
    if (tour.what_to_bring_html) {
      console.log('Setting whatToBring content:', tour.what_to_bring_html);
      setQuillContent('whatToBring', tour.what_to_bring_html);
    } else {
      console.log('No what_to_bring_html found');
    }
    
    if (tour.restrictions_html) {
      console.log('Setting restrictions content:', tour.restrictions_html);
      setQuillContent('restrictions', tour.restrictions_html);
    } else {
      console.log('No restrictions_html found');
    }
    
    // Update title
    const pageTitleEl = document.getElementById('edit-tour-page-title');
    if (pageTitleEl) pageTitleEl.textContent = `Edit ${tour.name}`;
    
    const breadcrumbEl = document.getElementById('edit-tour-current-breadcrumb');
    if (breadcrumbEl) breadcrumbEl.textContent = tour.name;
    
  } catch (error) {
    console.error('Error loading tour:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      tourId: tourId
    });
    alert('Error loading tour: ' + error.message + '\n\nCheck console for details.');
  }
}

// Clear edit form for new tour
function clearEditForm() {
  const formEl = document.getElementById('edit-tour-form');
  if (formEl) formEl.reset();
  
  const pageTitleEl = document.getElementById('edit-tour-page-title');
  if (pageTitleEl) pageTitleEl.textContent = 'New Tour';
  
  const breadcrumbEl = document.getElementById('edit-tour-current-breadcrumb');
  if (breadcrumbEl) breadcrumbEl.textContent = 'New Tour';
  
  // Clear Quill editors
  Object.values(quillEditors).forEach(editor => {
    if (editor && editor.setContents) {
      editor.setContents([]);
    }
  });
  const cat = document.getElementById('editTourCategory'); if (cat && cat.tagify) cat.tagify.removeAllTags();
  const tags = document.getElementById('editTourTags'); if (tags && tags.tagify) tags.tagify.removeAllTags();
  const statusSelect = document.getElementById('editTourStatusSelect'); if (statusSelect) statusSelect.value = 'draft';

  setGalleryImages([]);
}

// Initialize Quill editors
function initializeQuillEditors() {
  console.log('Initializing Quill editors...');
  
  const editors = [
    { id: 'editTourDescription', name: 'description' },
    { id: 'editTourHighlights', name: 'highlights' },
    { id: 'editTourItinerary', name: 'itinerary' },
    { id: 'editTourInclusions', name: 'inclusions' },
    { id: 'editTourExclusions', name: 'exclusions' },
    { id: 'editTourWhatToBring', name: 'whatToBring' },
    { id: 'editTourRestrictions', name: 'restrictions' }
  ];
  
  editors.forEach(({ id, name }) => {
    const element = document.getElementById(id);
    if (element && !quillEditors[name]) {
      console.log(`Creating Quill editor for ${name}`);
      quillEditors[name] = new Quill(element, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean']
          ]
        }
      });
    }
  });
  
  console.log('Quill editors initialized:', Object.keys(quillEditors));
}

// Initialize Tagify for tags field
function initializeTagify() {
  console.log('Initializing Tagify...');
  
  const tagsInput = document.getElementById('editTourTags');
  if (tagsInput && !tagsInput.tagify) {
    console.log('Creating Tagify for tags field');
    tagsInput.tagify = new Tagify(tagsInput, {
      placeholder: 'Add keywords to help customers find this tour',
      delimiters: ',| ',
      maxTags: 10,
      dropdown: { maxItems: 20, classname: 'tags-look', enabled: 0, closeOnSelect: false }
    });
  }
  const categoryInput = document.getElementById('editTourCategory');
  if (categoryInput && !categoryInput.tagify) {
    const suggestions = Array.from(new Set((window.currentClientTours || []).map(t => (t.category || t.type || '').trim()).filter(Boolean)));
    categoryInput.tagify = new Tagify(categoryInput, {
      enforceWhitelist: false,
      maxTags: 1,
      dropdown: { enabled: 0, maxItems: 20 },
      whitelist: suggestions
    });
  }
}

// Sort tours by type
function sortToursByType() {
  console.log('Sorting tours by type');
  
  if (!window.currentClientTours) {
    console.log('No tours to sort');
    return;
  }
  
  // Toggle sort direction
  window.currentSortDirection = window.currentSortDirection === 'asc' ? 'desc' : 'asc';
  
  // Sort tours
  const sortedTours = [...window.currentClientTours].sort((a, b) => {
    const typeA = (a.type || a.category || '').toLowerCase();
    const typeB = (b.type || b.category || '').toLowerCase();
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    
    if (window.currentSortDirection === 'asc') {
      const typeCompare = typeA.localeCompare(typeB);
      return typeCompare !== 0 ? typeCompare : nameA.localeCompare(nameB);
    } else {
      const typeCompare = typeB.localeCompare(typeA);
      return typeCompare !== 0 ? typeCompare : nameB.localeCompare(nameA);
    }
  });
  
  // Update the table body
  const tbody = document.getElementById('toursTableBody');
  if (tbody) {
    tbody.innerHTML = sortedTours.map(tour => {
      const normalizedStatus = tour.status === 'active' ? 'published' : (tour.status || 'draft');
      const statusLabel = normalizedStatus === 'published' ? 'Published' : 'Draft';
      const statusBadge = normalizedStatus === 'published' ? 'success' : 'warning';
      return `
      <tr>
        <td class="checkbox-col"><input type="checkbox" class="tour-select" data-tour-id="${tour.id}" data-tour-status="${normalizedStatus}"></td>
        <td><strong>${tour.name}</strong><br><small style="color: #666;">${tour.slug}</small></td>
        <td>${tour.type || tour.category || '-'}</td>
        <td>${tour.location || '-'}</td>
        <td>${tour.duration || '-'}</td>
        <td>${tour.from_price ? `$${tour.from_price}` : '-'}</td>
        <td><span class="badge badge-${statusBadge}">${statusLabel}</span></td>
        <td>
          <button class="btn btn-primary" onclick="editTour(${tour.id})">Edit</button>
        </td>
      </tr>
    `;}).join('');
    setupBulkTourSelection();
  }
  
  // Update sort icon
  const sortIcon = document.querySelector('.sort-icon');
  if (sortIcon) {
    sortIcon.setAttribute('data-feather', window.currentSortDirection === 'asc' ? 'chevron-up' : 'chevron-down');
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
  
  console.log(`Tours sorted by type (${window.currentSortDirection})`);
}

// Get value from Tagify field
function getTagifyValue(fieldId) {
  const element = document.getElementById(fieldId);
  if (element && element.tagify) {
    return element.tagify.value.map(tag => tag.value).join(',');
  }
  return element ? element.value : '';
}

function getTagifyArray(fieldId) {
  const element = document.getElementById(fieldId);
  if (element && element.tagify) {
    return element.tagify.value.map(tag => tag.value).filter(Boolean);
  }
  if (element && typeof element.value === 'string') {
    return element.value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }
  return [];
}

// Initialize tab navigation
function initializeTabNavigation() {
  console.log('Initializing tab navigation...');
  
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  console.log('Found tab buttons:', tabButtons.length);
  console.log('Found tab panes:', tabPanes.length);
  
  // Ensure first tab is active by default
  if (tabButtons.length > 0 && tabPanes.length > 0) {
    tabButtons[0].classList.add('active');
    tabPanes[0].classList.add('active');
    // Ensure the first tab pane is visible
    tabPanes[0].style.display = 'block';
    console.log('Set first tab as active and visible');
  }
  
  // Ensure edit tour tab content is visible
  const editTourContainer = document.getElementById('edit-tour-container');
  const tabContent = editTourContainer ? editTourContainer.querySelector('.tab-content') : null;
  if (tabContent) {
    tabContent.style.setProperty('display', 'block', 'important');
    console.log('Edit tour tab content display set to block with !important');
  }
  
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      console.log('Tab clicked:', targetTab);
      
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none';
      });
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const targetPane = document.getElementById(`${targetTab}-tab`);
      if (targetPane) {
        targetPane.classList.add('active');
        targetPane.style.display = 'block';
        console.log('Activated tab pane:', targetTab);
      } else {
        console.error('Target tab pane not found:', `${targetTab}-tab`);
      }
    });
  });
  
  console.log('Tab navigation initialized');

  const nameEl = document.getElementById('editTourName');
  const slugEl = document.getElementById('editTourSlug');
  if (nameEl && slugEl) {
    if (!slugEl.dataset.userEdited) slugEl.dataset.userEdited = 'false';
    nameEl.addEventListener('blur', () => {
      if (slugEl.dataset.userEdited !== 'true' || !slugEl.value) slugEl.value = slugify(nameEl.value);
    });
    nameEl.addEventListener('input', () => {
      if (slugEl.dataset.userEdited !== 'true') slugEl.value = slugify(nameEl.value);
    });
    slugEl.addEventListener('input', () => { if (slugEl.value) slugEl.dataset.userEdited = 'true'; });
  }
}

// Get Quill content
function getQuillContent(editorName) {
  if (quillEditors[editorName]) {
    return quillEditors[editorName].root.innerHTML;
  }
  return '';
}

// Set Quill content
function setQuillContent(editorName, content) {
  console.log(`Setting Quill content for ${editorName}:`, content);
  
  if (quillEditors[editorName]) {
    quillEditors[editorName].root.innerHTML = content;
  } else {
    // If editor not ready, try again after a short delay
    setTimeout(() => {
      if (quillEditors[editorName]) {
        quillEditors[editorName].root.innerHTML = content;
      }
    }, 100);
  }
}

// Save tour from edit form
async function saveEditTour() {
  try {
    const tourId = document.getElementById('editTourId').value;
    const isNewTour = !tourId;
    
    const statusSelect = document.getElementById('editTourStatusSelect');
    const selectedStatus = statusSelect ? statusSelect.value || 'draft' : 'draft';

    const tourData = {
      slug: document.getElementById('editTourSlug').value,
      name: document.getElementById('editTourName').value,
      status: selectedStatus,
      category: (document.getElementById('editTourCategory')?.tagify ? document.getElementById('editTourCategory').tagify.value.map(t=>t.value).join(',') : document.getElementById('editTourCategory').value),
      tags: getTagifyArray('editTourTags'),
      location: document.getElementById('editTourLocation').value,
      duration: document.getElementById('editTourDuration').value,
      from_price: parseFloat(document.getElementById('editTourPrice').value) || 0,
      currency: document.getElementById('editTourCurrency').value,
      adult_price: parseFloat(document.getElementById('editTourAdultPrice').value) || 0,
      child_price: parseFloat(document.getElementById('editTourChildPrice').value) || 0,
      senior_price: parseFloat(document.getElementById('editTourSeniorPrice').value) || 0,
      video_url: document.getElementById('editTourVideoUrl').value,
      video_type: document.getElementById('editTourVideoType').value,
      description_html: getQuillContent('description'),
      highlights_html: getQuillContent('highlights'),
      itinerary_html: getQuillContent('itinerary'),
      inclusions_html: getQuillContent('inclusions'),
      exclusions_html: getQuillContent('exclusions'),
      what_to_bring_html: getQuillContent('whatToBring'),
      restrictions_html: getQuillContent('restrictions')
    };

    const galleryImages = getGalleryImages();
    tourData.gallery = galleryImages;
    tourData.image = galleryImages.length > 0 ? galleryImages[0] : null;
    
    console.log('Saving tour data:', tourData);
    
    let response;
    if (isNewTour) {
      const payload = { ...tourData };
      response = await apiRequest('/admin/tours', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } else {
      response = await apiRequest(`/admin/tours/${tourId}`, {
        method: 'PUT',
        body: JSON.stringify(tourData)
      });
    }
    
    console.log('Tour saved successfully:', response);
    
    // Hide edit interface
    hideEditTour();
    
    // Refresh tours list
    if (typeof window.currentClientId !== 'undefined' && window.currentClientId !== null) {
      loadToursForClient(window.currentClientId);
    } else {
      loadTours();
    }
    
    alert('Tour saved successfully!');
    
  } catch (error) {
    console.error('Error saving tour:', error);
    alert('Error saving tour: ' + error.message);
  }
}

// Delete tour from edit form
async function deleteEditTour() {
  const tourId = document.getElementById('editTourId').value;
  if (!tourId) {
    alert('No tour selected to delete');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
    return;
  }
  
  try {
    await apiRequest(`/admin/tours/${tourId}`, {
      method: 'DELETE'
    });
    
    console.log('Tour deleted successfully');
    
    // Hide edit interface
    hideEditTour();
    
    // Refresh tours list
    if (typeof window.currentClientId !== 'undefined' && window.currentClientId !== null) {
      loadToursForClient(window.currentClientId);
    } else {
      loadTours();
    }
    
    alert('Tour deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting tour:', error);
    alert('Error deleting tour: ' + error.message);
  }
}

// Update edit button click handler
function editTour(tourId) {
  console.log('editTour called with tourId:', tourId);
  
  // Keep clients dropdown open to maintain context
  if (typeof window.keepClientsDropdownOpen === 'function') {
    window.keepClientsDropdownOpen();
  } else {
    // Fallback method
    const clientsDropdown = document.getElementById('clientsDropdown');
    const clientsToggle = document.querySelector('[data-dropdown="clientsDropdown"]');
    if (clientsDropdown && clientsToggle) {
      clientsDropdown.classList.add('show');
      clientsToggle.classList.add('active');
      console.log('Kept clients dropdown open for context (fallback)');
    }
  }
  
  showEditTour(tourId);
  
  // Also keep dropdown open after edit tour is shown
  setTimeout(() => {
    if (typeof window.keepClientsDropdownOpen === 'function') {
      window.keepClientsDropdownOpen();
    }
  }, 100);
}

function normalizeImageUrl(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    return trimmed || null;
  }
  if (typeof entry === 'object') {
    const candidate = entry.url || entry.src || entry.image || entry.path || entry.href;
    return candidate ? String(candidate).trim() : null;
  }
  return null;
}

function setGalleryImages(images = []) {
  const normalized = images.map(normalizeImageUrl).filter(Boolean);
  const unique = [];
  const seen = new Set();

  normalized.forEach(url => {
    if (!seen.has(url)) {
      seen.add(url);
      unique.push(url);
    }
  });

  galleryImagesState = unique;
  renderGalleryImages();
}

function getGalleryImages() {
  return [...galleryImagesState];
}

function handleGalleryDragStart(event) {
  const item = event.currentTarget;
  draggedGalleryIndex = Number(item.dataset.index);
  item.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', String(draggedGalleryIndex));
  item.setAttribute('aria-grabbed', 'true');
}

function handleGalleryDragOver(event) {
  event.preventDefault();
  const item = event.currentTarget;
  event.dataTransfer.dropEffect = 'move';
  item.classList.add('drag-over');
}

function handleGalleryDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function moveGalleryImage(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  if (fromIndex < 0 || toIndex < 0) return;
  if (fromIndex >= galleryImagesState.length || toIndex >= galleryImagesState.length) return;

  const updated = [...galleryImagesState];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  galleryImagesState = updated;
  renderGalleryImages();
}

function handleGalleryDrop(event) {
  event.preventDefault();
  const target = event.currentTarget;
  const toIndex = Number(target.dataset.index);
  const fromIndex = draggedGalleryIndex !== null ? draggedGalleryIndex : Number(event.dataTransfer.getData('text/plain'));

  target.classList.remove('drag-over');

  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
  moveGalleryImage(fromIndex, toIndex);
}

function handleGalleryDragEnd(event) {
  const item = event.currentTarget;
  item.classList.remove('dragging');
  item.removeAttribute('aria-grabbed');
  const siblings = item.parentElement ? item.parentElement.querySelectorAll('.image-preview-item') : [];
  siblings.forEach(node => node.classList.remove('drag-over'));
  draggedGalleryIndex = null;
}

function renderGalleryImages() {
  const imageUploadZone = document.getElementById('image-upload-zone');
  if (!imageUploadZone) {
    console.error('Image upload zone not found');
    return;
  }

  imageUploadZone.innerHTML = '';

  if (galleryImagesState.length === 0) {
    imageUploadZone.innerHTML = `
      <div class="upload-placeholder">
        <i data-feather="upload"></i>
        <p>Drag & drop images here or click to browse</p>
      </div>
    `;
    if (window.feather) {
      feather.replace();
    }
    return;
  }

  const imagePreview = document.createElement('div');
  imagePreview.className = 'image-preview';

  galleryImagesState.forEach((imageUrl, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-preview-item';
    imageItem.setAttribute('draggable', 'true');
    imageItem.dataset.index = index;
    imageItem.setAttribute('role', 'listitem');
    imageItem.setAttribute('aria-label', index === 0 ? 'Featured image' : `Image ${index + 1}`);

    const badgeLabel = index === 0 ? 'Featured' : `#${index + 1}`;

    imageItem.innerHTML = `
      <img src="${imageUrl}" alt="Tour image ${index + 1}" loading="lazy">
      <div class="image-order-badge">${badgeLabel}</div>
      <button type="button" class="remove-image" data-index="${index}" title="Remove image">
        <i data-feather="x"></i>
      </button>
    `;

    imageItem.addEventListener('dragstart', handleGalleryDragStart);
    imageItem.addEventListener('dragover', handleGalleryDragOver);
    imageItem.addEventListener('dragleave', handleGalleryDragLeave);
    imageItem.addEventListener('drop', handleGalleryDrop);
    imageItem.addEventListener('dragend', handleGalleryDragEnd);

    imagePreview.appendChild(imageItem);
  });

  const uploadButton = document.createElement('div');
  uploadButton.className = 'upload-placeholder';
  uploadButton.innerHTML = `
    <i data-feather="plus"></i>
    <p>Add more images</p>
  `;
  uploadButton.style.cursor = 'pointer';
  uploadButton.addEventListener('click', () => {
    console.log('Add more images clicked');
  });

  imageUploadZone.appendChild(imagePreview);
  imageUploadZone.appendChild(uploadButton);

  imagePreview.querySelectorAll('.remove-image').forEach(button => {
    button.addEventListener('click', event => {
      const index = Number(event.currentTarget.dataset.index);
      removeImage(index);
    });
  });

  if (window.feather) {
    feather.replace();
  }

  console.log('Image gallery populated with', galleryImagesState.length, 'images');
}

// Populate image gallery in media tab
function populateImageGallery(images) {
  console.log('Populating image gallery with:', images);
  setGalleryImages(Array.isArray(images) ? images : []);
}

// Remove image from gallery
function removeImage(index) {
  if (!Number.isInteger(index)) return;
  if (index < 0 || index >= galleryImagesState.length) return;
  galleryImagesState.splice(index, 1);
  renderGalleryImages();
}

// Helper functions for dynamic content
function addTimeSlot() {
  const container = document.getElementById('time-slots-container');
  const timeSlot = document.createElement('div');
  timeSlot.className = 'time-slot-item';
  timeSlot.innerHTML = `
    <input type="time" name="time_slots[]" placeholder="HH:MM">
    <button type="button" onclick="removeTimeSlot(this)" class="btn btn-sm btn-danger">Remove</button>
  `;
  container.appendChild(timeSlot);
}

function removeTimeSlot(button) {
  button.parentElement.remove();
}

function addBlackoutDate() {
  const container = document.getElementById('blackout-dates-container');
  const dateItem = document.createElement('div');
  dateItem.className = 'blackout-date-item';
  dateItem.innerHTML = `
    <input type="date" name="blackout_dates[]">
    <button type="button" onclick="removeBlackoutDate(this)" class="btn btn-sm btn-danger">Remove</button>
  `;
  container.appendChild(dateItem);
}

function removeBlackoutDate(button) {
  button.parentElement.remove();
}

function addAddon() {
  const container = document.getElementById('addons-container');
  const addonItem = document.createElement('div');
  addonItem.className = 'addon-item';
  addonItem.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <input type="text" name="addon_name[]" placeholder="Add-on name">
      </div>
      <div class="form-group">
        <input type="number" name="addon_price[]" placeholder="Price" step="0.01">
      </div>
      <div class="form-group">
        <select name="addon_type[]">
          <option value="per_person">Per Person</option>
          <option value="per_booking">Per Booking</option>
        </select>
      </div>
      <div class="form-group">
        <select name="addon_required[]">
          <option value="optional">Optional</option>
          <option value="required">Required</option>
        </select>
      </div>
      <div class="form-group">
        <button type="button" onclick="removeAddon(this)" class="btn btn-sm btn-danger">Remove</button>
      </div>
    </div>
  `;
  container.appendChild(addonItem);
}

function removeAddon(button) {
  button.closest('.addon-item').remove();
}

// Add event listeners for edit tour
document.addEventListener('DOMContentLoaded', function() {
  // Edit form submission
  const editForm = document.getElementById('edit-tour-form');
  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveEditTour();
    });
  }
  
  // Delete button
  const deleteBtn = document.getElementById('delete-edit-tour-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteEditTour);
  }
});

// Legacy helper: open client panel (kept for backward compatibility)
function showClientModal() {
  showCreateClientPanel();
}

function closeClientModal() {
  hideClientPanel();
}

// Utility: slugify
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

// ===== Bulk Upload Tours (static bundle) =====
function showBulkUploadModal(clientId, clientName) {
  const modal = document.getElementById('bulkUploadModal');
  if (!modal) return;
  
  const bulkClientId = document.getElementById('bulkClientId');
  if (bulkClientId) bulkClientId.value = clientId;
  
  const bulkClientName = document.getElementById('bulkClientName');
  if (bulkClientName) bulkClientName.value = clientName || '';
  
  const bulkCsvFile = document.getElementById('bulkCsvFile');
  if (bulkCsvFile) bulkCsvFile.value = '';
  
  const res = document.getElementById('bulkUploadResult');
  if (res) res.style.display = 'none';
  
  const err = document.getElementById('bulkUploadError');
  if (err) err.style.display = 'none';
  
  modal.classList.add('active');
}
function closeBulkUploadModal() { const m = document.getElementById('bulkUploadModal'); if (m) m.classList.remove('active'); }
function downloadToursCsvTemplate() {
  const headers = ['slug','name','category','tags','location','duration','from_price','currency','excerpt','description','highlights','itinerary','inclusions','exclusions','what_to_bring','restrictions','gallery_images'];
  const sample = ['blue-hole-adventure','Blue Hole Adventure','Adventure','waterfall; swim','Ocho Rios','3 hours','79','USD','Discover the Blue Hole with guided swimming.','Experience cliff jumps and pools','Guide intro; Hike to pools; Swim time','Arrive; Safety briefing; Swim; Return','Guide; Transport; Water','Lunch; Towels','Swimwear; Water shoes','Not suitable for non-swimmers','https://example.com/img1.jpg|https://example.com/img2.jpg'];
  const esc = v => `"${String(v).replace(/"/g,'""')}"`;
  const csv = headers.join(',') + '\n' + sample.map(esc).join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tours-template.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
function parseCsv(text) {
  const rows = []; let i=0, field='', row=[], inQ=false; while (i<text.length){ const c=text[i]; if(inQ){ if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQ=false; } else field+=c; } else { if(c==='"') inQ=true; else if(c===','){ row.push(field); field=''; } else if(c==='\n'||c==='\r'){ if(field.length||row.length){ row.push(field); rows.push(row);} field=''; row=[]; if(c==='\r'&&text[i+1]==='\n') i++; } else field+=c; } i++; } if(field.length||row.length){ row.push(field); rows.push(row);} return rows; }
async function processBulkUpload() {
  const clientId = parseInt(document.getElementById('bulkClientId').value, 10);
  const fileInput = document.getElementById('bulkCsvFile');
  const resultDiv = document.getElementById('bulkUploadResult');
  const errDiv = document.getElementById('bulkUploadError');
  if (resultDiv) resultDiv.style.display='none'; if (errDiv) errDiv.style.display='none';
  if (!clientId) { if (errDiv){ errDiv.textContent='Missing client id.'; errDiv.style.display='block'; } return; }
  if (!fileInput.files || !fileInput.files[0]) { if (errDiv){ errDiv.textContent='Please choose a CSV file.'; errDiv.style.display='block'; } return; }
  const text = await fileInput.files[0].text();
  const rows = parseCsv(text).filter(r => r.length && r.join('').trim());
  if (!rows.length) { if (errDiv){ errDiv.textContent='CSV appears empty.'; errDiv.style.display='block'; } return; }
  const headers = rows[0].map(h => h.trim().toLowerCase()); const idx = k => headers.indexOf(k);
  if (idx('slug')===-1 || idx('name')===-1) { if (errDiv){ errDiv.textContent='Missing required columns: slug, name'; errDiv.style.display='block'; } return; }
  const toListArray = s => { if (!s) return []; const parts = String(s).split(/\r?\n|;|\|/).map(t=>t.trim()).filter(Boolean); return parts; };
  const toParagraphs = s => { if (!s) return ''; const lines = String(s).split(/\r?\n/).map(t=>t.trim()).filter(Boolean); if (!lines.length) return ''; return lines.map(l=>`<p>${l}</p>`).join(''); };
  const stripHtml = s => { if (!s) return ''; return String(s).replace(/<[^>]*>/g, '').trim(); };

  const payloads = rows.slice(1).map(cols => {
    const g = k => { const p = idx(k); return p >= 0 ? cols[p] : ''; };
    const galleryStr = g('gallery_images');
    const gallery = galleryStr ? galleryStr.split(/\s*[,|]\s*/).map(u => u.trim()).filter(Boolean) : [];
    const p = { client_id: clientId, slug: g('slug').trim(), name: g('name').trim(), status: 'draft' };
    const excerpt = g('excerpt').trim(); if (excerpt) p.excerpt = excerpt;
    const fromPrice = g('from_price'); if (fromPrice) {
      const cleaned = String(fromPrice).replace(/[$,\s]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) p.from_price = parsed;
    }
    const category = g('category').trim(); if (category) p.category = category;
    const tags = g('tags').trim(); if (tags) {
      const tagsArray = tags.split(/[;,]|\s*,\s*/).map(t=>t.trim()).filter(Boolean);
      if (tagsArray.length > 0) p.tags = tagsArray;
    }
    const location = g('location').trim(); if (location) p.location = location;
    const duration = g('duration').trim(); if (duration) p.duration = duration;
    const currency = g('currency').trim(); if (currency) p.currency = currency;
    const descHtml = toParagraphs(g('description')); if (descHtml) p.description_html = descHtml;
    const highlights = toListArray(g('highlights')); if (highlights.length > 0) p.highlights = highlights;
    const itinerary = toListArray(g('itinerary')); if (itinerary.length > 0) p.itinerary = itinerary;
    const inclusions = toListArray(g('inclusions')); if (inclusions.length > 0) p.inclusions = inclusions;
    const exclusions = toListArray(g('exclusions')); if (exclusions.length > 0) p.exclusions = exclusions;
    const whatToBring = stripHtml(g('what_to_bring')); if (whatToBring) p.what_to_bring = whatToBring;
    const restrictions = stripHtml(g('restrictions')); if (restrictions) p.restrictions = restrictions;
    if (gallery.length > 0) p.gallery = gallery;
    return p;
  }).filter(p => p.slug && p.name);
  if (!payloads.length) { if (errDiv){ errDiv.textContent='No valid rows found.'; errDiv.style.display='block'; } return; }
  const results = await Promise.allSettled(
    payloads.map(async (p, i) => {
      try {
        return await apiRequest('/admin/tours', { method:'POST', body: JSON.stringify(p) });
      } catch (err) {
        const errorMsg = err.message || (err.response?.message || err.response?.error) || 'Unknown error';
        console.error(`Row ${i + 2} failed:`, errorMsg, err.response, p);
        return { error: errorMsg, row: i + 2, payload: p };
      }
    })
  );
  const success = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
  const failed = results.length - success;
  const errors = results
    .map((r, i) => {
      if (r.status === 'rejected') return `Row ${i + 2}: ${r.reason?.message || 'Unknown error'}`;
      if (r.value?.error) return `Row ${r.value.row}: ${r.value.error}`;
      return null;
    })
    .filter(Boolean);
  if (failed > 0 && errDiv) {
    errDiv.innerHTML = `<strong>${failed} row(s) failed:</strong><br>` + errors.slice(0, 5).join('<br>') + (errors.length > 5 ? `<br>...and ${errors.length - 5} more` : '');
    errDiv.style.display = 'block';
  }
  if (success > 0 && resultDiv) {
    resultDiv.textContent = `Successfully uploaded ${success} tour(s). ${failed ? failed + ' failed.' : ''}`;
    resultDiv.style.display = 'block';
    if (typeof loadToursForClient === 'function') await loadToursForClient(clientId);
  } else if (failed === payloads.length && resultDiv) {
    resultDiv.style.display = 'none';
  }
}

let closeButtonHandler = null;

function overridePrimaryHeader({ title, parentLabel, currentLabel, onClose }) {
  const pageTitleEl = document.getElementById('page-title');
  const breadcrumbLink = document.querySelector('#page-breadcrumb a');
  const breadcrumbCurrent = document.getElementById('current-page-breadcrumb');
  const headerRight = document.querySelector('.header-right');

  if (!pageTitleEl || !breadcrumbLink || !breadcrumbCurrent) return;

  if (!headerOverrideActive) {
    // Save original header state
    savedHeaderState = {
      title: pageTitleEl.textContent,
      parentLabel: breadcrumbLink.textContent,
      currentLabel: breadcrumbCurrent.textContent,
      handler: breadcrumbLink.onclick,
      headerRightHTML: headerRight?.innerHTML || ''
    };
  }

  // Update title and breadcrumb
  pageTitleEl.textContent = title || 'Client';
  breadcrumbLink.textContent = parentLabel || 'Clients';
  breadcrumbLink.onclick = (event) => {
    event.preventDefault();
    if (onClose) {
      onClose();
    } else if (closeButtonHandler) {
      closeButtonHandler();
    } else {
      hideClientPanel();
    }
  };
  breadcrumbCurrent.textContent = currentLabel || title || 'Client';
  
  // Store close handler
  closeButtonHandler = onClose || hideClientPanel;
  
  // Update header buttons - hide "New Tour" and "New Client", show close button
  if (headerRight) {
    headerRight.innerHTML = `
      <button class="btn-header-close" id="header-close-btn" title="Close" aria-label="Close">
        <i data-feather="x"></i>
      </button>
    `;
    // Attach event listener
    const closeBtn = document.getElementById('header-close-btn');
    if (closeBtn) {
      closeBtn.onclick = (event) => {
        event.preventDefault();
        if (closeButtonHandler) {
          closeButtonHandler();
        }
      };
    }
    // Re-initialize Feather icons - use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace({ scope: headerRight });
      } else {
        // Fallback: use text if Feather isn't loaded
        const icon = closeBtn?.querySelector('i[data-feather="x"]');
        if (icon && !icon.querySelector('svg')) {
          icon.textContent = '×';
          icon.style.fontSize = '20px';
          icon.style.lineHeight = '1';
        }
      }
    }, 10);
  }
  
  headerOverrideActive = true;
}

function restorePrimaryHeader() {
  if (!headerOverrideActive) return;

  const pageTitleEl = document.getElementById('page-title');
  const breadcrumbLink = document.querySelector('#page-breadcrumb a');
  const breadcrumbCurrent = document.getElementById('current-page-breadcrumb');
  const headerRight = document.querySelector('.header-right');

  if (pageTitleEl && savedHeaderState) {
    pageTitleEl.textContent = savedHeaderState.title || 'Dashboard';
  }
  if (breadcrumbLink && savedHeaderState) {
    breadcrumbLink.textContent = savedHeaderState.parentLabel || 'Home';
    breadcrumbLink.onclick = savedHeaderState.handler || ((event) => showTab(event, 'dashboard'));
  }
  if (breadcrumbCurrent && savedHeaderState) {
    breadcrumbCurrent.textContent = savedHeaderState.currentLabel || 'Dashboard';
  }
  
  // Restore header buttons
  if (headerRight && savedHeaderState && savedHeaderState.headerRightHTML) {
    headerRight.innerHTML = savedHeaderState.headerRightHTML;
    // Re-initialize Feather icons
    if (typeof feather !== 'undefined') {
      feather.replace({ scope: headerRight });
    }
  }

  headerOverrideActive = false;
  savedHeaderState = null;
  closeButtonHandler = null;
}

// ==================== PRICING BANDS TABLE MANAGEMENT ====================

function addPricingBandRow(minMi = null, maxMi = null, priceType = 'per_person', priceAmount = 0) {
  const tbody = document.getElementById('pricingBandsBody');
  if (!tbody) return;
  
  const rowIndex = tbody.children.length;
  const row = document.createElement('tr');
  row.dataset.rowIndex = rowIndex;
  row.style.borderBottom = '1px solid #e5e7eb';
  
  // Auto-calculate minMi from previous row's maxMi if not provided
  if (minMi === null && rowIndex > 0) {
    const prevRow = tbody.children[rowIndex - 1];
    const prevMaxInput = prevRow.querySelector('input[data-field="maxMi"]');
    if (prevMaxInput && prevMaxInput.value && prevMaxInput.value !== 'Open-ended') {
      minMi = parseFloat(prevMaxInput.value);
    }
  }
  if (minMi === null) minMi = 0;
  
  row.innerHTML = `
    <td style="padding: 8px;">
      <input type="number" data-field="minMi" value="${minMi}" step="0.1" min="0" placeholder="0" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" onchange="validatePricingBands(); updatePricingBandsJSON();" />
    </td>
    <td style="padding: 8px;">
      <input type="text" data-field="maxMi" value="${maxMi === null ? 'Open-ended' : maxMi}" step="0.1" min="0" placeholder="Open-ended" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" onchange="validatePricingBands(); updatePricingBandsJSON();" onblur="handleMaxMiBlur(this)" />
    </td>
    <td style="padding: 8px;">
      <select data-field="priceType" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" onchange="validatePricingBands(); updatePricingBandsJSON();">
        <option value="per_person" ${priceType === 'per_person' ? 'selected' : ''}>Per Person</option>
        <option value="flat" ${priceType === 'flat' ? 'selected' : ''}>Flat</option>
      </select>
    </td>
    <td style="padding: 8px;">
      <input type="number" data-field="priceAmount" value="${priceAmount}" step="0.01" min="0" placeholder="0.00" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" onchange="validatePricingBands(); updatePricingBandsJSON();" />
    </td>
    <td style="padding: 8px; text-align: center;">
      <button type="button" onclick="deletePricingBandRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
    </td>
  `;
  
  tbody.appendChild(row);
  updatePricingBandsJSON();
  validatePricingBands();
}

function handleMaxMiBlur(input) {
  const value = input.value.trim();
  if (value === '' || value.toLowerCase() === 'open-ended' || value.toLowerCase() === 'open ended') {
    input.value = 'Open-ended';
  } else {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      input.value = num;
    }
  }
  validatePricingBands();
  updatePricingBandsJSON();
}

function deletePricingBandRow(button) {
  const row = button.closest('tr');
  if (row) {
    row.remove();
    // Re-index rows
    const tbody = document.getElementById('pricingBandsBody');
    if (tbody) {
      Array.from(tbody.children).forEach((r, i) => {
        r.dataset.rowIndex = i;
      });
    }
    updatePricingBandsJSON();
    validatePricingBands();
  }
}

function updatePricingBandsJSON() {
  const tbody = document.getElementById('pricingBandsBody');
  const bandsInput = document.getElementById('pricingBands');
  if (!tbody || !bandsInput) return;
  
  const bands = [];
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  rows.forEach(row => {
    const minMiInput = row.querySelector('input[data-field="minMi"]');
    const maxMiInput = row.querySelector('input[data-field="maxMi"]');
    const priceTypeSelect = row.querySelector('select[data-field="priceType"]');
    const priceAmountInput = row.querySelector('input[data-field="priceAmount"]');
    
    if (!minMiInput || !maxMiInput || !priceTypeSelect || !priceAmountInput) return;
    
    const minMi = parseFloat(minMiInput.value);
    const maxMiValue = maxMiInput.value.trim();
    const maxMi = (maxMiValue === '' || maxMiValue.toLowerCase() === 'open-ended' || maxMiValue.toLowerCase() === 'open ended') 
      ? null 
      : parseFloat(maxMiValue);
    const priceType = priceTypeSelect.value;
    const priceAmount = parseFloat(priceAmountInput.value);
    
    if (!isNaN(minMi) && !isNaN(priceAmount) && priceAmount > 0) {
      bands.push({
        minMi: minMi,
        maxMi: maxMi,
        price: {
          type: priceType,
          amount: priceAmount
        }
      });
    }
  });
  
  // Sort by minMi
  bands.sort((a, b) => (a.minMi ?? 0) - (b.minMi ?? 0));
  
  bandsInput.value = JSON.stringify(bands, null, 2);
  
  // Trigger preview update if preview distance is set
  const previewDistance = document.getElementById('pricingBandsPreviewDistance')?.value;
  if (previewDistance) {
    showPricingBandsPreview(parseFloat(previewDistance));
  }
}

function validatePricingBands() {
  const tbody = document.getElementById('pricingBandsBody');
  const validationDiv = document.getElementById('pricingBandsValidation');
  const errorsList = document.getElementById('pricingBandsErrors');
  if (!tbody || !validationDiv || !errorsList) return true;
  
  const errors = [];
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const bands = [];
  
  // Collect and validate each row
  rows.forEach((row, index) => {
    const minMiInput = row.querySelector('input[data-field="minMi"]');
    const maxMiInput = row.querySelector('input[data-field="maxMi"]');
    const priceTypeSelect = row.querySelector('select[data-field="priceType"]');
    const priceAmountInput = row.querySelector('input[data-field="priceAmount"]');
    
    if (!minMiInput || !maxMiInput || !priceTypeSelect || !priceAmountInput) return;
    
    const minMiValue = minMiInput.value.trim();
    const maxMiValue = maxMiInput.value.trim();
    const priceAmountValue = priceAmountInput.value.trim();
    
    if (minMiValue === '') {
      errors.push(`Row ${index + 1}: "From" is required`);
      return;
    }
    
    const minMi = parseFloat(minMiValue);
    if (isNaN(minMi) || minMi < 0) {
      errors.push(`Row ${index + 1}: "From" must be a number ≥ 0`);
      return;
    }
    
    const isOpenEnded = maxMiValue === '' || maxMiValue.toLowerCase() === 'open-ended' || maxMiValue.toLowerCase() === 'open ended';
    const maxMi = isOpenEnded ? null : parseFloat(maxMiValue);
    
    if (!isOpenEnded && (isNaN(maxMi) || maxMi <= minMi)) {
      errors.push(`Row ${index + 1}: "To" must be > "From" or left as "Open-ended"`);
      return;
    }
    
    const priceAmount = parseFloat(priceAmountValue);
    if (priceAmountValue === '' || isNaN(priceAmount) || priceAmount <= 0) {
      errors.push(`Row ${index + 1}: "Amount" must be > 0`);
      return;
    }
    
    const priceType = priceTypeSelect.value;
    if (!['per_person', 'flat'].includes(priceType)) {
      errors.push(`Row ${index + 1}: Invalid price type`);
      return;
    }
    
    bands.push({ minMi, maxMi, price: { type: priceType, amount: priceAmount } });
  });
  
  // Validate overlaps and continuity
  const sorted = [...bands].sort((a, b) => (a.minMi ?? 0) - (b.minMi ?? 0));
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    
    if (i > 0) {
      const prev = sorted[i - 1];
      
      // Check if previous row is open-ended (should be last)
      if (prev.maxMi === null) {
        errors.push(`Row ${i + 1}: Cannot have rows after an open-ended row`);
      }
      
      // Check for overlaps
      if (prev.maxMi !== null && prev.maxMi > current.minMi) {
        errors.push(`Row ${i + 1}: Overlaps with previous row (${prev.minMi}-${prev.maxMi} overlaps with ${current.minMi}-${current.maxMi || 'open'})`);
      }
      
      // Check for gaps (warn only - gaps are allowed but not recommended)
      if (prev.maxMi !== null && prev.maxMi < current.minMi) {
        errors.push(`Row ${i + 1}: Gap detected (previous ends at ${prev.maxMi}, current starts at ${current.minMi})`);
      }
    }
  }
  
  // Display errors or hide validation div
  if (errors.length > 0) {
    errorsList.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
    validationDiv.style.display = 'block';
    return false;
  } else {
    validationDiv.style.display = 'none';
    return true;
  }
}

function showPricingBandsPreview(distance) {
  const tbody = document.getElementById('pricingBandsBody');
  const previewDiv = document.getElementById('pricingBandsPreview');
  const previewContent = document.getElementById('pricingBandsPreviewContent');
  
  if (!tbody || !previewDiv || !previewContent) return;
  
  const bands = [];
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  rows.forEach(row => {
    const minMiInput = row.querySelector('input[data-field="minMi"]');
    const maxMiInput = row.querySelector('input[data-field="maxMi"]');
    const priceTypeSelect = row.querySelector('select[data-field="priceType"]');
    const priceAmountInput = row.querySelector('input[data-field="priceAmount"]');
    
    if (!minMiInput || !maxMiInput || !priceTypeSelect || !priceAmountInput) return;
    
    const minMi = parseFloat(minMiInput.value);
    const maxMiValue = maxMiInput.value.trim();
    const maxMi = (maxMiValue === '' || maxMiValue.toLowerCase() === 'open-ended') ? null : parseFloat(maxMiValue);
    const priceType = priceTypeSelect.value;
    const priceAmount = parseFloat(priceAmountInput.value);
    
    if (!isNaN(minMi) && !isNaN(priceAmount)) {
      bands.push({ minMi, maxMi, price: { type: priceType, amount: priceAmount } });
    }
  });
  
  const sorted = bands.sort((a, b) => (a.minMi ?? 0) - (b.minMi ?? 0));
  const matchedBand = sorted.find(b => 
    distance >= (b.minMi ?? 0) && (b.maxMi === null || distance < b.maxMi)
  ) || sorted[sorted.length - 1];
  
  if (matchedBand) {
    const priceInfo = matchedBand.price.type === 'per_person' 
      ? `$${matchedBand.price.amount} per person`
      : `$${matchedBand.price.amount} flat`;
    
    previewContent.innerHTML = `
      For ${distance} miles: <strong>${priceInfo}</strong> 
      (Range: ${matchedBand.minMi}${matchedBand.maxMi === null ? '+' : '-' + matchedBand.maxMi} miles)
    `;
    previewDiv.style.display = 'block';
  } else {
    previewDiv.style.display = 'none';
  }
}

// Initialize pricing bands table when page loads or client panel opens
function initializePricingBandsTable() {
  const addBtn = document.getElementById('addPricingBandBtn');
  if (addBtn && !addBtn.dataset.initialized) {
    addBtn.dataset.initialized = 'true';
    addBtn.addEventListener('click', () => {
      const tbody = document.getElementById('pricingBandsBody');
      const lastRow = tbody?.lastElementChild;
      let nextMinMi = 0;
      
      if (lastRow) {
        const lastMaxInput = lastRow.querySelector('input[data-field="maxMi"]');
        if (lastMaxInput && lastMaxInput.value && lastMaxInput.value !== 'Open-ended') {
          nextMinMi = parseFloat(lastMaxInput.value) || 0;
        }
      }
      
      addPricingBandRow(nextMinMi, null, 'per_person', 0);
    });
  }
  
  // Add preview distance input
  const container = document.getElementById('pricingBandsContainer');
  if (container && !document.getElementById('pricingBandsPreviewDistance')) {
    const previewInput = document.createElement('input');
    previewInput.id = 'pricingBandsPreviewDistance';
    previewInput.type = 'number';
    previewInput.placeholder = 'Enter distance (miles) to preview';
    previewInput.step = '0.1';
    previewInput.min = '0';
    previewInput.style.cssText = 'width: 100%; padding: 8px; margin-top: 12px; border: 1px solid #d1d5db; border-radius: 4px;';
    previewInput.oninput = (e) => {
      const dist = parseFloat(e.target.value);
      if (!isNaN(dist) && dist >= 0) {
        showPricingBandsPreview(dist);
      } else {
        document.getElementById('pricingBandsPreview').style.display = 'none';
      }
    };
    
    const previewLabel = document.createElement('label');
    previewLabel.htmlFor = 'pricingBandsPreviewDistance';
    previewLabel.textContent = 'Preview Calculator:';
    previewLabel.style.cssText = 'display: block; font-weight: 600; font-size: 13px; color: #374151; margin-top: 16px; margin-bottom: 6px;';
    
    const previewDiv = document.getElementById('pricingBandsPreview');
    if (previewDiv && previewDiv.parentNode) {
      previewDiv.parentNode.insertBefore(previewLabel, previewDiv);
      previewDiv.parentNode.insertBefore(previewInput, previewDiv);
    }
  }
}

// Clear pricing bands table
function clearPricingBandsTable() {
  const tbody = document.getElementById('pricingBandsBody');
  if (tbody) {
    tbody.innerHTML = '';
  }
  const bandsInput = document.getElementById('pricingBands');
  if (bandsInput) {
    bandsInput.value = '';
  }
}

// Load default pricing bands (platform defaults)
function loadDefaultPricingBands() {
  const tbody = document.getElementById('pricingBandsBody');
  const bandsInput = document.getElementById('pricingBands');
  
  if (!tbody) return;
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Default bands from platform defaults
  const defaultBands = [
    { minMi: 0, maxMi: 50, price: { type: 'per_person', amount: 30 } },
    { minMi: 50, maxMi: 60, price: { type: 'per_person', amount: 40 } },
    { minMi: 60, maxMi: 70, price: { type: 'per_person', amount: 50 } },
    { minMi: 70, maxMi: null, price: { type: 'per_person', amount: 80 } }
  ];
  
  // Add default bands to table
  defaultBands.forEach(band => {
    addPricingBandRow(
      band.minMi,
      band.maxMi,
      band.price.type,
      band.price.amount
    );
  });
  
  // Update hidden JSON field
  if (bandsInput) updatePricingBandsJSON();
}
