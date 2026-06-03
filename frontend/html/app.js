// API Configuration
const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('token') || '';
}

// API helper functions
async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth helpers
function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function getUsernameFromToken() {
  const token = getToken();
  if (!token) return 'User';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.email || 'User';
  } catch {
    return 'User';
  }
}

// Toast notification
function showToast(message, type = 'error') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Format AI response content
function formatContent(content) {
  if (!content) return '';
  // Bold text between ** **
  let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert bullet points with • to list items
  formatted = formatted.replace(/^•\s(.*?)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  formatted = formatted.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

// Skeleton loader HTML
function getSkeletonLoader(type = 'default') {
  if (type === 'card') {
    return `
      <div class="skeleton-card glass-card">
        <div class="skeleton" style="width: 60%; height: 24px; margin-bottom: 16px;"></div>
        <div class="skeleton" style="width: 100%; height: 100px;"></div>
        <div class="skeleton" style="width: 80%; height: 16px; margin-top: 12px;"></div>
      </div>
    `;
  }
  return `
    <div class="loading-container">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
        <div class="skeleton" style="width: 300px; height: 32px;"></div>
        <div class="skeleton" style="width: 100%; max-width: 600px; height: 200px;"></div>
        <div class="skeleton" style="width: 80%; max-width: 400px; height: 16px;"></div>
      </div>
    </div>
  `;
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Render navbar for authenticated pages
function renderNavbar() {
  const username = getUsernameFromToken();
  document.getElementById('navbar').innerHTML = `
    <a href="dashboard.html" class="logo">📄 PaperAI</a>
    <div class="nav-links">
      <a href="dashboard.html">Dashboard</a>
      <span class="username-text">👤 ${username}</span>
      <button class="logout-btn" onclick="logout()">Logout</button>
    </div>
  `;
}

// Render navbar for auth pages (no auth needed)
function renderAuthNavbar() {
  document.getElementById('navbar').innerHTML = `
    <a href="index.html" class="logo">📄 PaperAI</a>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="login.html">Login</a>
      <a href="register.html">Register</a>
    </div>
  `;
}