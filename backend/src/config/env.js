const path = require('path');

function loadEnv() {
  // Lazy-load dotenv to avoid dependency if already provided by environment
  try {
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
  } catch (e) {
    // Ignore if dotenv is not available
  }
}

module.exports = { loadEnv };
