/**
 * Background job: check all accepted customers and auto-block when unpaid count >= 2.
 * Run via cron or scheduler, e.g.:
 *   node src/jobs/runCustomerBlockingJob.js
 * Or: node -e "require('./src/jobs/runCustomerBlockingJob').run().then(console.log).catch(console.error)"
 */
require('dotenv').config();
const { checkAllAcceptedCustomers } = require('../services/customerBlockingService');

async function run() {
  const result = await checkAllAcceptedCustomers();
  console.log('Customer blocking job:', result);
  return result;
}

if (require.main === module) {
  run()
    .then((r) => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { run };
