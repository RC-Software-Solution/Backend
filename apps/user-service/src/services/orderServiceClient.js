const axios = require('axios');

/**
 * Client to call order-service internal endpoints (unpaid count, order history).
 * Uses INTERNAL_API_KEY for X-Internal-Key header.
 */
class OrderServiceClient {
  constructor() {
    this.baseUrl =
      process.env.ORDER_SERVICE_URL ||
      `http://${process.env.ORDER_SERVICE_HOST || 'localhost'}:${process.env.ORDER_SERVICE_PORT || '4002'}`;
    this.internalKey = process.env.INTERNAL_API_KEY || '';
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.internalKey ? { 'X-Internal-Key': this.internalKey } : {}),
    };
  }

  /**
   * Get unpaid orders count for a customer (or global if no customer_id).
   * @param {string} [customerId] - Optional customer UUID
   * @returns {Promise<{ count: number }>}
   */
  async getUnpaidOrdersCount(customerId = null) {
    const params = customerId ? { customer_id: customerId } : {};
    const { data } = await axios.get(
      `${this.baseUrl}/api/internal/analytics/unpaid-orders-count`,
      { params, headers: this._headers(), timeout: 5000 }
    );
    return data;
  }

  /**
   * Get order history for a customer.
   * @param {string} customerId - Customer UUID
   * @param {number} [limit=50] - Max orders to return
   * @returns {Promise<{ orders: Array }>}
   */
  async getOrdersByCustomerId(customerId, limit = 50) {
    const { data } = await axios.get(
      `${this.baseUrl}/api/internal/analytics/orders-by-customer`,
      {
        params: { customer_id: customerId, limit },
        headers: this._headers(),
        timeout: 5000,
      }
    );
    return data;
  }
}

const orderServiceClient = new OrderServiceClient();
module.exports = orderServiceClient;
