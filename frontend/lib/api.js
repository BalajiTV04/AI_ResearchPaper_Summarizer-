const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token()}`
});

export const api = {
  get: async (path) => {
    const res = await fetch(`${API}${path}`, { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  upload: async (path, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}${path}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token()}`);
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
  delete: async (path) => {
    const res = await fetch(`${API}${path}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
