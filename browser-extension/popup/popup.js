// Configuration management
const CONFIG_KEY = 'jobsync_config';

let config = {
  apiUrl: 'http://localhost:3000'
};

// Load configuration from storage
async function loadConfig() {
  try {
    const result = await chrome.storage.sync.get(CONFIG_KEY);
    if (result[CONFIG_KEY]) {
      config = result[CONFIG_KEY];
    }
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return config;
  }
}

// Save configuration to storage
async function saveConfig(newConfig) {
  try {
    config = { ...config, ...newConfig };
    await chrome.storage.sync.set({ [CONFIG_KEY]: config });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// UI state management
const UI = {
  showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
    }
  },

  showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status show ${type}`;
    setTimeout(() => {
      status.classList.remove('show');
    }, 5000);
  },

  updatePreview(data) {
    document.getElementById('preview-title').textContent = data.title || 'Not detected';
    document.getElementById('preview-company').textContent = data.company || 'Not detected';
    document.getElementById('preview-location').textContent = data.location || 'Not detected';
    document.getElementById('preview-url').textContent = data.url || '';
    document.getElementById('preview-url').title = data.url || '';
  },

  enableCaptureButton() {
    document.getElementById('capture-btn').disabled = false;
  },

  disableCaptureButton() {
    document.getElementById('capture-btn').disabled = true;
  }
};

// Get current tab data
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Extract job data from current page
async function extractJobData() {
  const tab = await getCurrentTab();
  
  try {
    // Try to get data from content script first
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });
    return { ...response, url: tab.url };
  } catch (error) {
    console.log('Content script not available, using basic data:', error);
    // Fallback to basic data
    return {
      url: tab.url,
      title: tab.title,
      company: undefined,
      location: undefined,
      description: undefined
    };
  }
}

// Capture job to JobSync API
async function captureJob(jobData) {
  const apiUrl = `${config.apiUrl}/api/jobs/capture`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: jobData.url,
        scrapedData: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          url: jobData.url
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409 && result.isDuplicate) {
        throw new Error('This job is already in your JobSync');
      }
      throw new Error(result.message || 'Failed to capture job');
    }

    return result;
  } catch (error) {
    console.error('Error capturing job:', error);
    throw error;
  }
}

// Initialize popup
async function initialize() {
  await loadConfig();
  
  // Load current page data
  const jobData = await extractJobData();
  UI.updatePreview(jobData);
  UI.enableCaptureButton();
  
  // Store job data for capture
  window.currentJobData = jobData;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  
  // Capture button
  document.getElementById('capture-btn').addEventListener('click', async () => {
    UI.disableCaptureButton();
    UI.showStatus('Capturing job...', 'info');
    
    try {
      await captureJob(window.currentJobData);
      UI.showSection('success-section');
    } catch (error) {
      UI.enableCaptureButton();
      UI.showStatus(error.message, 'error');
    }
  });
  
  // Config button
  document.getElementById('config-btn').addEventListener('click', () => {
    document.getElementById('api-url').value = config.apiUrl;
    UI.showSection('config-section');
  });
  
  // Save config button
  document.getElementById('save-config').addEventListener('click', async () => {
    const apiUrl = document.getElementById('api-url').value.trim();
    
    if (!apiUrl) {
      UI.showStatus('API URL is required', 'error');
      return;
    }
    
    const saved = await saveConfig({ apiUrl });
    if (saved) {
      UI.showStatus('Configuration saved!', 'info');
      UI.showSection('capture-section');
    } else {
      UI.showStatus('Failed to save configuration', 'error');
    }
  });
  
  // Capture another button
  document.getElementById('capture-another').addEventListener('click', async () => {
    UI.showSection('capture-section');
    await initialize();
  });
});
