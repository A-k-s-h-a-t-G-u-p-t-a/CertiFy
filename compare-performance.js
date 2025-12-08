const autocannon = require('autocannon');

const APAAR_ID = '2';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║     API Performance Comparison: Before vs After Cache       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const tests = [
  {
    name: 'With Cache (Optimized)',
    url: `http://localhost:3000/api/certificates-by-apaar?apaarId=${APAAR_ID}&fields=urls`,
    description: 'Using in-memory cache + optimized query'
  },
  {
    name: 'Without Cache (Raw Performance)',
    url: `http://localhost:3000/api/certificates-by-apaar?apaarId=${APAAR_ID}&fields=urls&nocache=1`,
    description: 'Direct database query with index'
  }
];

const results = [];
let currentTest = 0;

function runNextTest() {
  if (currentTest >= tests.length) {
    printComparison();
    return;
  }

  const test = tests[currentTest];
  console.log(`\n🧪 Running Test ${currentTest + 1}/${tests.length}: ${test.name}`);
  console.log(`   ${test.description}`);
  console.log(`   URL: ${test.url}\n`);

  const instance = autocannon({
    url: test.url,
    connections: 100,
    pipelining: 10,
    duration: 20,
    method: 'GET'
  }, (err, result) => {
    if (err) {
      console.error(`❌ Error in ${test.name}:`, err);
      currentTest++;
      runNextTest();
      return;
    }

    results.push({
      name: test.name,
      avgLatency: result.latency.mean,
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99,
      reqPerSec: result.requests.mean,
      throughput: result.throughput.mean,
      requests2xx: result['2xx'],
      errors: result.errors + result['4xx'] + result['5xx']
    });

    console.log(`\n✅ ${test.name} completed`);
    console.log(`   Avg Latency: ${result.latency.mean.toFixed(2)}ms`);
    console.log(`   Requests/sec: ${result.requests.mean.toFixed(2)}`);

    currentTest++;
    setTimeout(runNextTest, 2000); // 2 second delay between tests
  });

  autocannon.track(instance, { renderProgressBar: true });
}

function printComparison() {
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   COMPARISON RESULTS                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (results.length < 2) {
    console.log('❌ Not enough test results to compare');
    return;
  }

  const cached = results[0];
  const uncached = results[1];

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│  Metric              │ With Cache │ Without Cache │ Improvement│');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  const improvement = (metric) => {
    const diff = ((uncached[metric] - cached[metric]) / uncached[metric] * 100);
    return diff > 0 ? `↓ ${diff.toFixed(1)}%` : `↑ ${Math.abs(diff).toFixed(1)}%`;
  };

  const improvementReverse = (metric) => {
    const diff = ((cached[metric] - uncached[metric]) / uncached[metric] * 100);
    return diff > 0 ? `↑ ${diff.toFixed(1)}%` : `↓ ${Math.abs(diff).toFixed(1)}%`;
  };

  console.log(`│  Avg Latency (ms)    │ ${cached.avgLatency.toFixed(2).padStart(10)} │ ${uncached.avgLatency.toFixed(2).padStart(13)} │ ${improvement('avgLatency').padStart(11)}│`);
  console.log(`│  p50 Latency (ms)    │ ${cached.p50.toString().padStart(10)} │ ${uncached.p50.toString().padStart(13)} │ ${improvement('p50').padStart(11)}│`);
  console.log(`│  p95 Latency (ms)    │ ${cached.p95.toString().padStart(10)} │ ${uncached.p95.toString().padStart(13)} │ ${improvement('p95').padStart(11)}│`);
  console.log(`│  p99 Latency (ms)    │ ${cached.p99.toString().padStart(10)} │ ${uncached.p99.toString().padStart(13)} │ ${improvement('p99').padStart(11)}│`);
  console.log(`│  Requests/sec        │ ${cached.reqPerSec.toFixed(2).padStart(10)} │ ${uncached.reqPerSec.toFixed(2).padStart(13)} │ ${improvementReverse('reqPerSec').padStart(11)}│`);
  console.log(`│  Throughput (B/s)    │ ${(cached.throughput).toFixed(0).padStart(10)} │ ${(uncached.throughput).toFixed(0).padStart(13)} │ ${improvementReverse('throughput').padStart(11)}│`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Summary
  const latencyImprovement = ((uncached.avgLatency - cached.avgLatency) / uncached.avgLatency * 100);
  const throughputImprovement = ((cached.reqPerSec - uncached.reqPerSec) / uncached.reqPerSec * 100);

  console.log('📊 SUMMARY:\n');
  console.log(`   Cache reduces latency by ${latencyImprovement.toFixed(1)}%`);
  console.log(`   Cache increases throughput by ${throughputImprovement.toFixed(1)}%`);
  
  if (latencyImprovement > 50) {
    console.log(`\n   ✅ Cache is working EXCELLENTLY! Keep it enabled.`);
  } else if (latencyImprovement > 20) {
    console.log(`\n   ✅ Cache provides good improvement.`);
  } else {
    console.log(`\n   ⚠️  Cache benefit is minimal. Check database indexing.`);
  }

  console.log('\n💡 RECOMMENDATIONS:\n');
  if (uncached.avgLatency > 500) {
    console.log('   ⚠️  Uncached latency is high (>500ms)');
    console.log('   → Ensure database index is applied: npx prisma db push');
    console.log('   → Check database connection and network latency');
  }
  if (cached.avgLatency > 100) {
    console.log('   ⚠️  Cached latency still high (>100ms)');
    console.log('   → Cache might not be warming up properly');
    console.log('   → Check server resources (CPU/RAM)');
  }
  if (cached.avgLatency < 50 && cached.reqPerSec > 500) {
    console.log('   ✅ API performance is EXCELLENT!');
    console.log('   → Ready for production use');
    console.log('   → Consider adding rate limiting for security');
  }

  console.log('\n');
}

// Start the test sequence
runNextTest();
