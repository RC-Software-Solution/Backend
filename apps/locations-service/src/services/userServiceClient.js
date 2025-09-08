const http = require('http');

class UserServiceClient {
  constructor() {
    this.userServiceHost = process.env.USER_SERVICE_HOST || 'user-service';
    this.userServicePort = process.env.USER_SERVICE_PORT || 4001;
    this.baseUrl = `http://${this.userServiceHost}:${this.userServicePort}`;
  }

  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${endpoint}`);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => { responseData += chunk; });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || parsedData.error || 'Request failed'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => { reject(new Error(`Request failed: ${error.message}`)); });

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async getUserById(userId) {
    try {
      const response = await this.makeRequest(`/api/users/${userId}`, 'GET');
      return response;
    } catch (error) {
      console.error('Error fetching user by ID:', error.message);
      throw error;
    }
  }
}

module.exports = new UserServiceClient();


