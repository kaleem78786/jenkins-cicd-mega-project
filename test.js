const assert = require('assert');

console.log("🔍 Running Automated Unit Tests...");

// Simple business logic test
function calculateUptimePercentage(upMinutes, totalMinutes) {
  return (upMinutes / totalMinutes) * 100;
}

try {
  const result = calculateUptimePercentage(99, 100);
  assert.strictEqual(result, 99, "Uptime calculation failed!");
  console.log("✅ All Unit Tests Passed Successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Unit Test Failed:", error.message);
  process.exit(1);
}