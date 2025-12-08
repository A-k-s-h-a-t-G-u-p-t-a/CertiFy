const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function clearCertificatesTable() {
  try {
    console.log('🗑️  Starting to clear certificates table...\n');

    // Get count before deletion
    const countBefore = await prisma.certificate.count();
    console.log(`📊 Total certificates before deletion: ${countBefore}`);

    if (countBefore === 0) {
      console.log('✅ Certificates table is already empty!');
      return;
    }

    // Delete all certificates
    const deleteResult = await prisma.certificate.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${deleteResult.count} certificates!`);

    // Verify deletion
    const countAfter = await prisma.certificate.count();
    console.log(`📊 Total certificates after deletion: ${countAfter}`);

    if (countAfter === 0) {
      console.log('🎉 Certificates table is now empty!');
    } else {
      console.log(`⚠️  Warning: ${countAfter} certificates still remain in the table`);
    }

  } catch (error) {
    console.error('❌ Error clearing certificates table:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Check if script is run directly
if (require.main === module) {
  console.log('🚀 Certificate Table Clearer');
  console.log('============================\n');
  
  clearCertificatesTable()
    .then(() => {
      console.log('\n🏁 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { clearCertificatesTable };