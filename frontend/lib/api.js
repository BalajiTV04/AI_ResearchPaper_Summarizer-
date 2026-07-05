const API = process.env.NEXT_PUBLIC_API_URL;

const getToken = () => {
  if (typeof window === 'undefined') return '';
  // Check for admin token first, then regular user token
  return localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
};

const getHeaders = (customHeaders = {}) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
  ...customHeaders
});

export const api = {
  get: async (path, options = {}) => {
    const { headers: customHeaders } = options;
    const res = await fetch(`${API}${path}`, { 
      headers: getHeaders(customHeaders) 
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (path, body, options = {}) => {
    const { headers: customHeaders } = options;
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: getHeaders(customHeaders),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  upload: async (path, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}${path}`);
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText || "Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(formData);
    });
  },
  delete: async (path, options = {}) => {
    const { headers: customHeaders } = options;
    const res = await fetch(`${API}${path}`, {
      method: 'DELETE',
      headers: getHeaders(customHeaders)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

export const logout = async () => {
  // Clear both regular and admin tokens
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  // Also sign out from Supabase if available
  try {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
  } catch (e) {
    // Supabase not configured, that's ok
  }
  // Check if we're in admin area
  if (window.location.pathname.startsWith('/admin')) {
    window.location.href = '/admin/login';
  } else {
    window.location.href = '/login';
  }
};