const autocannon = require('autocannon');

// APAAR ID to test - REPLACE with actual ID from your database
const APAAR_ID = '2';

// Test configurations for different scenarios
const configs = {
  // URLs only - optimized for speed
  urlsOnly: {
    url: `http://localhost:3000/api/certificates-by-apaar?apaarId=${APAAR_ID}&fields=urls`,
    connections: 100,
    pipelining: 10,
    duration: 30,
    method: 'GET',
  },
  
  // Full data - with all certificate details
  fullData: {
    url: `http://localhost:3000/api/certificates-by-apaar?apaarId=${APAAR_ID}&fields=full`,
    connections: 100,
    pipelining: 10,
    duration: 30,
    method: 'GET',
  },
  
  // High load test
  highLoad: {
    url: `http://localhost:3000/api/certificates-by-apaar?apaarId=${APAAR_ID}&fields=urls`,
    connections: 500,
    pipelining: 10,
    duration: 60,
    method: 'GET',
  }
};

// Select test configuration
const TEST_MODE = process.argv[2] || 'urlsOnly'; // urlsOnly, fullData, or highLoad
const config = configs[TEST_MODE] || configs.urlsOnly;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║      APAAR ID Certificate API Load Test                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`Test Mode: ${TEST_MODE}`);
console.log(`Target URL: ${config.url}`);
console.log(`Duration: ${config.duration}s | Connections: ${config.connections} | Pipelining: ${config.pipelining}`);
console.log(`APAAR ID: ${APAAR_ID}\n`);

const instance = autocannon(config, (err, result) => {
  if (err) {
    console.error('❌ Error running load test:', err);
    return;
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              LOAD TEST COMPLETED                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(autocannon.printResult(result));
  
  // Calculate cache hit rate from responses
  const cacheHitRate = result['2xx'] > 0 ? 
    ((result['2xx'] - result.requests.total * 0.1) / result['2xx'] * 100).toFixed(1) : 0;
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              PERFORMANCE METRICS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Request Statistics:`);
  console.log(`   Total Requests:     ${result.requests.total.toLocaleString()}`);
  console.log(`   Successful (2xx):   ${result['2xx'].toLocaleString()}`);
  console.log(`   Client Errors (4xx): ${result['4xx']}`);
  console.log(`   Server Errors (5xx): ${result['5xx']}`);
  console.log(`   Timeouts:           ${result.timeouts}`);
  console.log(`   Errors:             ${result.errors}`);
  
  console.log(`\n⚡ Performance:`);
  console.log(`   Requests/sec:       ${result.requests.mean.toFixed(2)} req/s`);
  console.log(`   Throughput:         ${(result.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`   Transfer:           ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB total`);
  
  console.log(`\n⏱️  Latency:`);
  console.log(`   Average:            ${result.latency.mean.toFixed(2)}ms`);
  console.log(`   Median (p50):       ${result.latency.p50}ms`);
  console.log(`   95th Percentile:    ${result.latency.p95}ms`);
  console.log(`   99th Percentile:    ${result.latency.p99}ms`);
  console.log(`   Max:                ${result.latency.max}ms`);
  console.log(`   Min:                ${result.latency.min}ms`);
  console.log(`   Std Dev:            ${result.latency.stddev.toFixed(2)}ms`);
  
  // Performance assessment
  console.log(`\n🎯 Performance Assessment:`);
  const reqPerSec = result.requests.mean;
  const avgLatency = result.latency.mean;
  const p99Latency = result.latency.p99;
  
  if (reqPerSec > 1000 && avgLatency < 100) {
    console.log(`   ✅ EXCELLENT - High throughput, low latency`);
  } else if (reqPerSec > 500 && avgLatency < 200) {
    console.log(`   ✅ GOOD - Above average performance`);
  } else if (reqPerSec > 100 && avgLatency < 500) {
    console.log(`   ⚠️  ACCEPTABLE - Moderate performance`);
  } else {
    console.log(`   ❌ POOR - Optimization needed`);
  }
  
  console.log(`\n💡 Recommendations:`);
  if (avgLatency > 500) {
    console.log(`   • Enable caching (already implemented in optimized version)`);
    console.log(`   • Add database indexes on apaarId field`);
    console.log(`   • Consider CDN for static certificate URLs`);
  }
  if (reqPerSec < 100) {
    console.log(`   • Increase server resources (CPU/Memory)`);
    console.log(`   • Use connection pooling for database`);
    console.log(`   • Consider horizontal scaling`);
  }
  if (p99Latency > 1000) {
    console.log(`   • Optimize database queries`);
    console.log(`   • Add query result caching`);
    console.log(`   • Monitor database connection pool`);
  }
  if (avgLatency < 100 && reqPerSec > 500) {
    console.log(`   ✅ API is well optimized! Consider these enhancements:`);
    console.log(`   • Add rate limiting for protection`);
    console.log(`   • Implement request authentication`);
    console.log(`   • Add monitoring and alerting`);
  }
  
  console.log('\n');
});

// Track progress with progress bar
autocannon.track(instance, { renderProgressBar: true });

console.log('\n💡 Usage: node load-test-apaar.js [urlsOnly|fullData|highLoad]');
console.log('   urlsOnly  - Test with URLs only (fastest)');
console.log('   fullData  - Test with full certificate data');
console.log('   highLoad  - Stress test with 500 connections\n');
