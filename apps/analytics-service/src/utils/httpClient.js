const http = require('http');

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Make HTTP request with timeout for service-to-service calls.
 * @param {Object} options - { hostname, port, path, method, headers, body, timeoutMs }
 * @returns {Promise<Object>} Parsed JSON response
 */
function request(options) {
  const {
    hostname,
    port,
    path,
    method = 'GET',
    headers = {},
    body = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname,
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(
                new Error(
                  parsed.message || parsed.error || `HTTP ${res.statusCode}`
                )
              );
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(new Error(`Request failed: ${err.message}`)));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Build internal auth headers for service-to-service calls.
 */
function getInternalHeaders() {
  const key = process.env.INTERNAL_API_KEY;
  const headers = {};
  if (key) headers['X-Internal-Key'] = key;
  return headers;
}

module.exports = { request, getInternalHeaders, DEFAULT_TIMEOUT_MS };
