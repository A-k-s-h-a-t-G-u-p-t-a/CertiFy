/**
 * Script to insert demo Admin and Organisation records into MongoDB
 * 
 * This script will create:
 * - Demo Admin with credentials
 * - Demo Organisation with credentials
 * 
 * Usage: node seed-demo-data.js
 * 
 * Demo Credentials:
 * - Admin: username="admin", password="admin123"
 * - Organisation: username="demo_org", password="org123", name="Demo University"
 */

const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Demo data configuration
const DEMO_DATA = {
  admin: {
    username: 'demo_admin',
    password: 'admin123',
    name: 'Demo Admin'
  },
  organisation: {
    username: 'demo_org',
    password: 'org123',
    name: 'Demo Org'
  }
};

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function insertDemoAdmin() {
  try {
    console.log('👤 Creating demo admin...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: DEMO_DATA.admin.username }
    });
    
    if (existingAdmin) {
      console.log(`⚠️  Admin with username "${DEMO_DATA.admin.username}" already exists. Skipping...`);
      return existingAdmin;
    }
    
    const hashedPassword = await hashPassword(DEMO_DATA.admin.password);
    
    const admin = await prisma.admin.create({
      data: {
        username: DEMO_DATA.admin.username,
        hashedPassword: hashedPassword,
        name: DEMO_DATA.admin.name,
      }
    });
    
    console.log(`✅ Demo admin created successfully!`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   ID: ${admin.id}`);
    
    return admin;
    
  } catch (error) {
    console.error('❌ Error creating demo admin:', error.message);
    throw error;
  }
}

async function insertDemoOrganisation() {
  try {
    console.log('\n🏢 Creating demo organisation...');
    
    // Check if organisation already exists
    const existingOrg = await prisma.organisation.findUnique({
      where: { username: DEMO_DATA.organisation.username }
    });
    
    if (existingOrg) {
      console.log(`⚠️  Organisation with username "${DEMO_DATA.organisation.username}" already exists. Skipping...`);
      return existingOrg;
    }
    
    // Also check by name
    const existingOrgByName = await prisma.organisation.findUnique({
      where: { name: DEMO_DATA.organisation.name }
    });
    
    if (existingOrgByName) {
      console.log(`⚠️  Organisation with name "${DEMO_DATA.organisation.name}" already exists. Skipping...`);
      return existingOrgByName;
    }
    
    const hashedPassword = await hashPassword(DEMO_DATA.organisation.password);
    
    const organisation = await prisma.organisation.create({
      data: {
        username: DEMO_DATA.organisation.username,
        hashedPassword: hashedPassword,
        name: DEMO_DATA.organisation.name,
      }
    });
    
    console.log(`✅ Demo organisation created successfully!`);
    console.log(`   Username: ${organisation.username}`);
    console.log(`   Name: ${organisation.name}`);
    console.log(`   ID: ${organisation.id}`);
    
    return organisation;
    
  } catch (error) {
    console.error('❌ Error creating demo organisation:', error.message);
    throw error;
  }
}

async function insertSampleCertificate(organisationId) {
  try {
    console.log('\n📄 Creating sample certificate...');
    
    const certificate = await prisma.certificate.create({
      data: {
        name: 'John Doe',
        url: 'https://example.com/certificates/sample-cert-001.pdf',
        degree: 'Bachelor of Science in Computer Science',
        certificateId: 'CERT-2024-001',
        year: '2024',
        honors: 'Magna Cum Laude',
        rollNo: 'CS2024001',
        grade: 'A+',
        organisationId: organisationId
      }
    });
    
    console.log(`✅ Sample certificate created successfully!`);
    console.log(`   Student: ${certificate.name}`);
    console.log(`   Degree: ${certificate.degree}`);
    console.log(`   Certificate ID: ${certificate.certificateId}`);
    console.log(`   ID: ${certificate.id}`);
    
    return certificate;
    
  } catch (error) {
    console.error('❌ Error creating sample certificate:', error.message);
    throw error;
  }
}

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...\n');
    
    const admin = await insertDemoAdmin();
    const organisation = await insertDemoOrganisation();
    
    // Only create sample certificate if organisation was actually created
    let certificate = null;
    if (organisation && !await prisma.certificate.findFirst({ where: { organisationId: organisation.id } })) {
      certificate = await insertSampleCertificate(organisation.id);
    }
    
    console.log('\n🎉 Demo data seeding completed successfully!\n');
    console.log('=== LOGIN CREDENTIALS ===');
    console.log('📋 Admin Login:');
    console.log(`   Username: ${DEMO_DATA.admin.username}`);
    console.log(`   Password: ${DEMO_DATA.admin.password}`);
    console.log('');
    console.log('🏢 Organisation Login:');
    console.log(`   Username: ${DEMO_DATA.organisation.username}`);
    console.log(`   Password: ${DEMO_DATA.organisation.password}`);
    console.log('');
    
    if (certificate) {
      console.log('📄 Sample certificate created for testing verification features.');
    }
    
    console.log('\n💡 You can now use these credentials to test your application!');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed.');
  }
}

// Add confirmation option
async function promptConfirmation() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n📝 Do you want to proceed with creating demo data? (type "yes" to confirm): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Main execution
async function main() {
  console.log('🗄️  MongoDB Demo Data Seeder');
  console.log('============================\n');
  console.log('This script will create demo admin and organisation accounts for testing.');
  
  const confirmed = await promptConfirmation();
  
  if (!confirmed) {
    console.log('❌ Operation cancelled. No data was inserted.');
    process.exit(0);
  }
  
  await seedDemoData();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});