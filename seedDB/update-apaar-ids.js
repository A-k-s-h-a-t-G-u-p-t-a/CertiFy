const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function updateApaarIds() {
  try {
    console.log('🔄 Starting to update certificates with missing apaarId...\n');

    // First, let's use raw MongoDB query to find documents without apaarId field
    const certificatesWithoutApaarIdRaw = await prisma.$runCommandRaw({
      find: "Certificate",
      filter: {
        $or: [
          { apaarId: { $exists: false } },  // Field doesn't exist
          { apaarId: null },                // Field exists but is null
          { apaarId: "" }                   // Field exists but is empty string
        ]
      },
      projection: { _id: 1, name: 1, apaarId: 1 }
    });

    console.log(`📊 Found ${certificatesWithoutApaarIdRaw.cursor.firstBatch.length} certificates without proper apaarId using raw query`);

    // Also use Prisma query as backup
    const certificatesWithoutApaarId = await prisma.certificate.findMany({
      where: {
        OR: [
          { apaarId: null },
          { apaarId: undefined },
          { apaarId: { equals: null } },
          { apaarId: { equals: "" } },
          { NOT: { apaarId: { not: null } } }  // Field doesn't exist
        ]
      },
      select: {
        id: true,
        name: true,
        apaarId: true
      }
    });

    console.log(`📊 Found ${certificatesWithoutApaarId.length} certificates without apaarId using Prisma query`);

    if (certificatesWithoutApaarId.length === 0 && certificatesWithoutApaarIdRaw.cursor.firstBatch.length === 0) {
      console.log('✅ All certificates already have apaarId assigned!');
      return;
    }

    // Display the certificates that will be updated
    if (certificatesWithoutApaarId.length > 0) {
      console.log('\n📋 Certificates to be updated:');
      certificatesWithoutApaarId.forEach((cert, index) => {
        console.log(`   ${index + 1}. ${cert.name} (ID: ${cert.id}) - Current apaarId: ${cert.apaarId || 'undefined'}`);
      });
    }

    console.log('\n🔄 Updating certificates using raw MongoDB command...');

    // Use raw MongoDB update command to handle missing fields properly
    const rawUpdateResult = await prisma.$runCommandRaw({
      update: "Certificate",
      updates: [{
        q: {
          $or: [
            { apaarId: { $exists: false } },  // Field doesn't exist
            { apaarId: null },                // Field exists but is null
            { apaarId: "" }                   // Field exists but is empty string
          ]
        },
        u: { $set: { apaarId: "1" } },
        multi: true
      }]
    });

    console.log(`✅ Raw MongoDB update result:`, rawUpdateResult);

    // Also run Prisma update as additional safety measure
    console.log('\n🔄 Running Prisma update as backup...');
    const updateResult = await prisma.certificate.updateMany({
      where: {
        OR: [
          { apaarId: null },
          { apaarId: undefined },
          { apaarId: { equals: null } },
          { apaarId: { equals: "" } },
          { NOT: { apaarId: { not: null } } }  // Field doesn't exist
        ]
      },
      data: {
        apaarId: "1"
      }
    });

    console.log(`\n✅ Successfully updated ${updateResult.count} certificates with Prisma!`);
    console.log(`   All updated certificates now have apaarId = "1"`);

    // Verify the update using raw MongoDB query
    const verifyRawCount = await prisma.$runCommandRaw({
      find: "Certificate",
      filter: {
        $or: [
          { apaarId: { $exists: false } },
          { apaarId: null },
          { apaarId: "" }
        ]
      }
    });

    // Verify with Prisma as well
    const verifyCount = await prisma.certificate.count({
      where: {
        OR: [
          { apaarId: null },
          { apaarId: undefined },
          { apaarId: { equals: null } },
          { apaarId: { equals: "" } },
          { NOT: { apaarId: { not: null } } }  // Field doesn't exist
        ]
      }
    });

    const remainingRawCount = verifyRawCount.cursor.firstBatch.length;

    if (verifyCount === 0 && remainingRawCount === 0) {
      console.log('🎉 Verification successful: No certificates remain without apaarId');
    } else {
      console.log(`⚠️  Warning: ${verifyCount} certificates still don't have apaarId (Prisma count)`);
      console.log(`⚠️  Warning: ${remainingRawCount} certificates still don't have apaarId (Raw MongoDB count)`);
    }

  } catch (error) {
    console.error('❌ Error updating certificates:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Check if script is run directly
if (require.main === module) {
  console.log('🚀 Certificate apaarId Update Script');
  console.log('=====================================\n');
  
  updateApaarIds()
    .then(() => {
      console.log('\n🏁 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { updateApaarIds };