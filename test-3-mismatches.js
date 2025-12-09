/**
 * Test script for 3 consecutive mismatches email alert
 * 
 * This script will create 3 consecutive notifications with mismatches
 * to trigger the critical alert email system.
 * 
 * Usage: node test-3-mismatches.js <organizationName>
 * Example: node test-3-mismatches.js "Test Organization"
 */

const organizationName = process.argv[2] || "Test Organization";

console.log(`🧪 Testing 3 consecutive mismatches for: ${organizationName}`);
console.log('⚠️  Make sure your dev server is running on http://localhost:3000\n');

async function createMismatchNotification(attemptNumber) {
  console.log(`\n📤 Attempt ${attemptNumber}: Creating notification with mismatches...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organisationName: organizationName,
        isFileHashMatch: false,  // Mismatch!
        isDataHashMatch: false,  // Mismatch!
        tamperedImageUrl: null,
        heatmapImageUrl: null,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Notification created successfully:`, {
        id: data.notification.id,
        isFileHashMatch: data.notification.isFileHashMatch,
        isDataHashMatch: data.notification.isDataHashMatch,
      });
      return true;
    } else {
      console.error(`❌ Failed to create notification:`, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

async function runTest() {
  console.log('Starting test in 2 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create 3 notifications with mismatches
  for (let i = 1; i <= 3; i++) {
    const success = await createMismatchNotification(i);
    
    if (!success) {
      console.log('\n❌ Test failed. Stopping.');
      process.exit(1);
    }
    
    if (i < 3) {
      console.log('⏳ Waiting 1 second before next attempt...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n📧 Expected behavior:');
  console.log('   - 3 notifications created successfully');
  console.log('   - Critical alert email sent to organization (if valid email)');
  console.log('   - Critical alert email sent to admin (if ADMIN_EMAIL set)');
  console.log('\n💡 Check your server console logs and email inbox!');
  console.log('   Look for: "🚨 ALERT: 3 consecutive mismatches detected"');
  console.log('   Look for: "✅ Critical alert email sent to..."');
  console.log('\n⚠️  To test again, delete the notifications from the database first.');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with built-in fetch support.');
  console.error('   Or run: npm install node-fetch');
  process.exit(1);
}

runTest();
