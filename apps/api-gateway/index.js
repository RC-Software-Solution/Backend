const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use('/users', createProxyMiddleware({ target: 'http://user-service:4001', changeOrigin: true }));
// app.use('/orders', createProxyMiddleware({ target: 'http://order-service:4002', changeOrigin: true }));

const PORT = 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
