import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { createThirdwebClient } from "thirdweb";
import { readContract } from "thirdweb";

// Initialize Thirdweb client and contract
const client = createThirdwebClient({
  clientId: "46d711b3df7e82f546ee080b590da647",
});

const factoryContract = getContract({
  client,
  chain: defineChain(11155111),
  address: "0x6601b9e1272d02bC3AdC4353fC11b5c57BF2C22d",
});

export async function POST(request) {
  try {
    console.log("Starting organization sync from blockchain...");

    // Get all organization addresses from blockchain
    const organizationAddresses = await readContract({
      contract: factoryContract,
      method: "function getAllOrganizations() view returns (address[])",
      params: [],
    });

    console.log(`Found ${organizationAddresses.length} organizations on blockchain`);

    if (!organizationAddresses || organizationAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No organizations found on blockchain",
        synced: 0,
      });
    }

    let syncedCount = 0;
    let updatedCount = 0;
    const errors = [];

    // Fetch details for each organization and sync to database
    for (const orgWallet of organizationAddresses) {
      try {
        console.log(`Fetching details for organization: ${orgWallet}`);

        // Get organization details from blockchain
        const orgDetails = await readContract({
          contract: factoryContract,
          method:
            "function getOrganization(address orgWallet) view returns (address _orgWallet, address _certContract, string _name, string _meta, bool _isActive, bool _isFlagged, uint256 _issuedCertCount)",
          params: [orgWallet],
        });

        const [
          _orgWallet,
          certContract,
          name,
          metadata,
          isActive,
          isFlagged,
          issuedCertCount,
        ] = orgDetails;

        console.log(`Organization details:`, {
          wallet: _orgWallet,
          contract: certContract,
          name,
          isActive,
          isFlagged,
        });

        // Check if organization already exists in database
        const existingOrg = await prisma.organisation.findUnique({
          where: { walletAddress: _orgWallet.toLowerCase() },
        });

        if (existingOrg) {
          // Update existing organization
          await prisma.organisation.update({
            where: { walletAddress: _orgWallet.toLowerCase() },
            data: {
              contractAddress: certContract.toLowerCase(),
              metadata: metadata || "",
              isActive: isActive,
              isFlagged: isFlagged,
              issuedCertCount: Number(issuedCertCount),
              updatedAt: new Date(),
            },
          });
          updatedCount++;
          console.log(`Updated organization: ${name}`);
        } else {
          // Create new organization
          // Generate username from wallet address (first 8 chars)
          const username = `org_${_orgWallet.slice(2, 10).toLowerCase()}`;
          
          // Generate a default password (org should change this)
          const defaultPassword = `pass_${_orgWallet.slice(2, 10)}`;

          await prisma.organisation.create({
            data: {
              username: username,
              hashedPassword: defaultPassword, // In production, this should be properly hashed
              name: name,
              walletAddress: _orgWallet.toLowerCase(),
              contractAddress: certContract.toLowerCase(),
              metadata: metadata || "",
              isActive: isActive,
              isFlagged: isFlagged,
              issuedCertCount: Number(issuedCertCount),
            },
          });
          syncedCount++;
          console.log(`Created new organization: ${name}`);
        }
      } catch (error) {
        console.error(`Error syncing organization ${orgWallet}:`, error);
        errors.push({
          wallet: orgWallet,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced organizations`,
      synced: syncedCount,
      updated: updatedCount,
      total: organizationAddresses.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in organization sync:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
