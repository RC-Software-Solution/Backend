const { request, getInternalHeaders, DEFAULT_TIMEOUT_MS } = require('../utils/httpClient');

const host = process.env.ORDER_SERVICE_HOST || 'order-service';
const port = process.env.ORDER_SERVICE_PORT || 4002;
const basePath = '/api/internal/analytics';

function buildUrl(pathname, searchParams = {}) {
  const search = new URLSearchParams(searchParams).toString();
  return search ? `${pathname}?${search}` : pathname;
}

async function call(path, query = {}) {
  const pathWithQuery = buildUrl(path, query);
  const res = await request({
    hostname: host,
    port,
    path: pathWithQuery,
    method: 'GET',
    headers: getInternalHeaders(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return res;
}

async function getSalesTotals(period) {
  return call(`${basePath}/sales-totals`, { period });
}

async function getOrdersMetrics(period) {
  return call(`${basePath}/orders-metrics`, { period });
}

async function getUnpaidOrdersCount() {
  return call(`${basePath}/unpaid-orders-count`);
}

async function getTopSellingItems(dateRange = {}, limit = 10) {
  const query = { limit };
  if (dateRange.startDate) query.startDate = dateRange.startDate;
  if (dateRange.endDate) query.endDate = dateRange.endDate;
  return call(`${basePath}/top-selling-items`, query);
}

async function getSessionPerformance(sessionType, dateRange = {}) {
  const query = { sessionType };
  if (dateRange.startDate) query.startDate = dateRange.startDate;
  if (dateRange.endDate) query.endDate = dateRange.endDate;
  return call(`${basePath}/session-performance`, query);
}

async function getAreaMetrics(areaId, dateRange = {}) {
  const query = {};
  if (areaId) query.areaId = areaId;
  if (dateRange.startDate) query.startDate = dateRange.startDate;
  if (dateRange.endDate) query.endDate = dateRange.endDate;
  return call(`${basePath}/area-metrics`, query);
}

module.exports = {
  getSalesTotals,
  getOrdersMetrics,
  getUnpaidOrdersCount,
  getTopSellingItems,
  getSessionPerformance,
  getAreaMetrics,
};
