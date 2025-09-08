const http = require('http');

/**
 * Service to communicate with order-service
 * Handles HTTP calls to order-service endpoints
 */
class OrderServiceClient {
  constructor(authHeader = null) {
    this.orderServiceHost = process.env.ORDER_SERVICE_HOST || 'order-service';
    this.orderServicePort = process.env.ORDER_SERVICE_PORT || 4002;
    this.baseUrl = `http://${this.orderServiceHost}:${this.orderServicePort}`;
    this.authHeader = authHeader;
  }

  setAuthHeader(token) {
    this.authHeader = token;
  }

  /**
   * Make HTTP request to order-service
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request body data
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${endpoint}`);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(
                new Error(
                  `HTTP ${res.statusCode}: ${
                    parsedData.message || parsedData.error || 'Request failed'
                  }`
                )
              );
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      if (
        data &&
        (method === 'POST' || method === 'PUT' || method === 'PATCH')
      ) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Get orders by area_id for delivery person
   * @param {string} areaId - Area ID
   * @param {string} mealTime - Meal time (optional)
   * @param {string} date - Date (optional, defaults to today)
   * @param {string} paymentStatus - Payment status (optional)
   * @returns {Promise<Object>} Orders data
   */
  async getOrdersByArea(
    areaId,
    mealTime = null,
    date = null,
    paymentStatus = 'pending',
    authHeader = null
  ) {
    try {
      let queryParams = `area_id=${areaId}&payment_status=${paymentStatus}&type=current`;

      if (mealTime) {
        queryParams += `&meal_time=${mealTime}`;
      }

      if (date) {
        queryParams += `&date=${date}`;
      }

      const headers = {};
      if (authHeader) {
        headers['Authorization'] = authHeader; // forward JWT
      }

      console.log(
        `Fetching orders for area ${areaId} from ${this.baseUrl}/api/orders?${queryParams}`
      );
      const response = await this.makeRequest(
        `/api/orders?${queryParams}`,
        'GET',
        null,
        headers
      );
      return response;
    } catch (error) {
      console.error('Error fetching orders by area:', error.message);
      throw error;
    }
  }

  /**
   * Update payment status of an order
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - New payment status
   * @returns {Promise<Object>} Update response
   */
  async updatePaymentStatus(orderId, paymentStatus, authHeader = null) {
    try {
      
      const headers = {};
      if (authHeader) {
        headers['Authorization'] = authHeader; // forward JWT
      }

      console.log(
        `Updating payment status for order ${orderId} to ${paymentStatus}`
      );
      const response = await this.makeRequest(
        `/api/orders/${orderId}/payment`,
        'PUT',
        {
          payment_status: paymentStatus,
        },
        headers
      );
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error.message);
      throw error;
    }
  }
}

module.exports = new OrderServiceClient();
