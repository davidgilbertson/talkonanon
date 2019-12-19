// const API_URL = 'http://localhost:5001/velantrix/us-central1/api';
const API_URL = 'https://us-central1-velantrix.cloudfunctions.net/api';
const POLLING_INTERVAL = 2000;

const fetchJson = async (url, opts = {}) => fetch(url, {
  method: opts.method,
  headers: {
    ...opts.headers,
    'Content-Type': 'application/json',
  },
  body: opts.body ? JSON.stringify(opts.body) : undefined,
}).then(res => res.json());

const api = {
  async create(body) {
    return fetchJson(API_URL, {
      method: 'POST',
      body,
    });
  },

  async read(id) {
    const response = await fetchJson(`${API_URL}/${id}`);
    if (response.error) return response;

    try {
      return response;
    } catch (err) {
      return {
        error: 'Could not parse',
      };
    }
  },

  async update(id, body) {
    return fetchJson(`${API_URL}/${id}`, {
      method: 'PUT',
      body,
    });
  },

  async delete(id) {
    return fetchJson(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

api.poll = (id, callback) => setInterval(() => {
  api.read(id).then(callback);
}, POLLING_INTERVAL);

export default api;
