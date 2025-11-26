/**
 * Script to clear all documents from MongoDB collections
 * 
 * This script will delete all records from:
 * - Admin collection
 * - Organisation collection  
 * - Certificate collection
 * 
 * Usage: node clear-database.js
 * 
 * WARNING: This will permanently delete all data from your database!
 * Make sure you have a backup if needed.
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function clearAllCollections() {
  try {
    console.log('🚨 WARNING: This will delete ALL data from your MongoDB collections!');
    console.log('Starting database cleanup...\n');

    // Delete all certificates first (due to foreign key constraints)
    console.log('📄 Deleting all certificates...');
    const deletedCertificates = await prisma.certificate.deleteMany({});
    console.log(`✅ Deleted ${deletedCertificates.count} certificates\n`);

    // Delete all organisations
    console.log('🏢 Deleting all organisations...');
    const deletedOrganisations = await prisma.organisation.deleteMany({});
    console.log(`✅ Deleted ${deletedOrganisations.count} organisations\n`);

    // Delete all admins
    console.log('👤 Deleting all admins...');
    const deletedAdmins = await prisma.admin.deleteMany({});
    console.log(`✅ Deleted ${deletedAdmins.count} admins\n`);

    console.log('🎉 Database cleanup completed successfully!');
    console.log('\nSummary:');
    console.log(`- Certificates deleted: ${deletedCertificates.count}`);
    console.log(`- Organisations deleted: ${deletedOrganisations.count}`);
    console.log(`- Admins deleted: ${deletedAdmins.count}`);
    console.log('\nAll collections are now empty.');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed.');
  }
}

// Add confirmation prompt
async function promptConfirmation() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  Are you sure you want to delete ALL data from your database? This action cannot be undone! (type "yes" to confirm): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Main execution
async function main() {
  console.log('🗄️  MongoDB Database Cleaner');
  console.log('============================\n');
  
  const confirmed = await promptConfirmation();
  
  if (!confirmed) {
    console.log('❌ Operation cancelled. Database remains unchanged.');
    process.exit(0);
  }
  
  await clearAllCollections();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});