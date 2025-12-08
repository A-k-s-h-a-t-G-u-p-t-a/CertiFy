const autocannon = require('autocannon');

// Configuration for the load test
const config = {
  url: 'http://localhost:3000/api/certificates/by-nqr',
  connections: 100, // Number of concurrent connections
  pipelining: 1,   // Number of pipelined requests
  duration: 30,    // Duration of the test in seconds
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  // REPLACE THIS with a valid NQR Code from your database for realistic results
  body: JSON.stringify({
    nqrCode: "DS-204" 
  })
};

console.log(`Starting load test on ${config.url}...`);
console.log(`Duration: ${config.duration}s, Connections: ${config.connections}`);

const instance = autocannon(config, (err, result) => {
  if (err) {
    console.error('Error running load test:', err);
    return;
  }
  
  console.log('Load test completed!');
  console.log(autocannon.printResult(result));
});

// Track progress in the console
autocannon.track(instance, { renderProgressBar: true });
