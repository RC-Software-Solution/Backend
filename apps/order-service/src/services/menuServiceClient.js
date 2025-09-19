const http = require('http');

class MenuServiceClient {
  constructor() {
    this.menuServiceHost = process.env.MENU_SERVICE_HOST || 'menu-service';
    this.menuServicePort = process.env.MENU_SERVICE_PORT || 4005;
    this.baseUrl = `http://${this.menuServiceHost}:${this.menuServicePort}`;
    this.internalToken = process.env.MENU_SERVICE_TOKEN || null;
  }

  getAuthHeaders(passedToken) {
    const token = this.internalToken || passedToken;
    const hdrs = {};
    if (token) hdrs['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return hdrs;
  }

  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${endpoint}`);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const msg = parsed.message || parsed.error || `HTTP ${res.statusCode}`;
              reject(new Error(msg));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Request failed: ${err.message}`)));
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async getSessionItems(mealSessionId, authToken) {
    const res = await this.makeRequest(
      `/api/meal-session-items/${mealSessionId}`,
      'GET',
      null,
      this.getAuthHeaders(authToken)
    );
    return res.data || [];
  }

  async getMealSessionByTime(date, mealTime, authToken) {
    const params = new URLSearchParams();
    if (mealTime) params.set('meal_time', mealTime);
    if (date) params.set('date', date);
    const res = await this.makeRequest(
      `/api/meal-sessions?${params.toString()}`,
      'GET',
      null,
      this.getAuthHeaders(authToken)
    );
    const list = (res.data && res.data.mealSessions) || res.data || [];
    return Array.isArray(list) ? list[0] : null;
  }

  async decrementInventory(mealSessionId, foodItemId, quantity, authToken) {
    const res = await this.makeRequest(
      `/api/inventory/decrement`,
      'POST',
      {
        meal_session_id: mealSessionId,
        food_item_id: foodItemId,
        quantity,
      },
      this.getAuthHeaders(authToken)
    );
    return res.data;
  }

  async incrementInventory(mealSessionId, foodItemId, quantity, authToken) {
    const res = await this.makeRequest(
      `/api/inventory/increment`,
      'POST',
      {
        meal_session_id: mealSessionId,
        food_item_id: foodItemId,
        quantity,
      },
      this.getAuthHeaders(authToken)
    );
    return res.data;
  }
}

module.exports = new MenuServiceClient();


