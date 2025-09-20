// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  Permission model changed:
  - Anyone can call addOrganization(...) on CertificateFactory to register an org.
  - Factory will deploy a CertificateContract for the org and store mapping.
  - notifyCertificateIssued still requires the call to come from the stored certContract for that org.
  - NOTE: allowing anyone to add organizations is intentionally permissive and may be insecure
    for production. Consider adding off-chain verification, owner gating, or a moderation flow.
*/

/* ----------------------- CertificateContract (per-organization) ----------------------- */
contract CertificateContract {
    address public orgOwner;          // organization wallet (can issue certs)
    address public factory;           // factory that deployed this contract
    string public organizationName;

    enum CertStatus { Unknown, Valid, Flagged, Revoked }

    struct Certificate {
        string certID;
        bytes32 filePhash;       // perceptual hash of file (pHash) represented as bytes32
        bytes32 dataHash;        // SHA-256 of canonicalized structured data (bytes32)
        bytes   encryptedData;   // AES-256 ciphertext (opaque)
        uint256 issuedAt;
        CertStatus status;
        bytes32 adminDecryptedHash; // SHA-256(plaintext) recorded by admin (0 if not present)
    }

    // certID => Certificate
    mapping(string => Certificate) private certs;
    string[] private certIds; // enumeration

    // stats
    uint256 public totalIssued;
    uint256 public totalFlagged;
    uint256 public totalRevoked;

    // events
    event CertificateIssued(string indexed certID, bytes32 filePhash, bytes32 dataHash, uint256 issuedAt);
    event CertificateFlagged(string indexed certID, string reason);
    event CertificateRevoked(string indexed certID, string reason);
    event AdminRecordedDecryptedHash(string indexed certID, bytes32 decryptedHash, bool matchesDataHash);

    modifier onlyOrg() {
        require(msg.sender == orgOwner, "only org owner");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "only factory");
        _;
    }

    constructor(address _orgOwner, string memory _orgName, address _factory) {
        require(_orgOwner != address(0), "org zero");
        require(_factory != address(0), "factory zero");
        orgOwner = _orgOwner;
        organizationName = _orgName;
        factory = _factory;
    }

    /// Issue a certificate (called by org off-chain system)
    /// filePhash: perceptual hash (pHash) represented as bytes32
    /// dataHash: SHA-256 of canonical data (bytes32)
    /// encryptedData: AES-256 ciphertext (bytes)
    function issueCertificate(
        string calldata certID,
        bytes32 filePhash,
        bytes32 dataHash,
        bytes calldata encryptedData
    ) external onlyOrg {
        require(bytes(certID).length > 0, "empty certID");
        require(certs[certID].issuedAt == 0, "already exists");

        certs[certID] = Certificate({
            certID: certID,
            filePhash: filePhash,
            dataHash: dataHash,
            encryptedData: encryptedData,
            issuedAt: block.timestamp,
            status: CertStatus.Valid,
            adminDecryptedHash: bytes32(0)
        });

        certIds.push(certID);
        totalIssued += 1;

        // notify factory so it can update org-level analytics
        CertificateFactory(factory).notifyCertificateIssued(orgOwner);

        emit CertificateIssued(certID, filePhash, dataHash, block.timestamp);
    }

    /// Org can revoke its own certificate
    function revokeCertificateByOrg(string calldata certID, string calldata reason) external onlyOrg {
        Certificate storage c = certs[certID];
        require(c.issuedAt != 0, "not found");
        if (c.status != CertStatus.Revoked) {
            c.status = CertStatus.Revoked;
            totalRevoked += 1;
        }
        emit CertificateRevoked(certID, reason);
    }

    /// Factory (Govt) can flag a certificate for review
    function flagCertificateByFactory(string calldata certID, string calldata reason) external onlyFactory {
        Certificate storage c = certs[certID];
        require(c.issuedAt != 0, "not found");
        if (c.status != CertStatus.Flagged) {
            c.status = CertStatus.Flagged;
            totalFlagged += 1;
        }
        emit CertificateFlagged(certID, reason);
    }

    /// Factory (Govt) can revoke a certificate
    function revokeCertificateByFactory(string calldata certID, string calldata reason) external onlyFactory {
        Certificate storage c = certs[certID];
        require(c.issuedAt != 0, "not found");
        if (c.status != CertStatus.Revoked) {
            c.status = CertStatus.Revoked;
            totalRevoked += 1;
            // if it was flagged previously we don't auto-decrement flagged count here
        }
        emit CertificateRevoked(certID, reason);
    }

    /// Admin decrypts encryptedData off-chain (AES-256) and records SHA-256(plaintext) on-chain for audit.
    /// decryptedHash must be SHA-256(plaintext) computed off-chain.
    function adminRecordDecryptedHash(string calldata certID, bytes32 decryptedHash) external onlyFactory {
        Certificate storage c = certs[certID];
        require(c.issuedAt != 0, "not found");
        c.adminDecryptedHash = decryptedHash;
        bool matches = (decryptedHash == c.dataHash);
        emit AdminRecordedDecryptedHash(certID, decryptedHash, matches);
    }

    /// View a certificate (encryptedData is returned so Admin UI can fetch & decrypt off-chain).
    function getCertificate(string calldata certID) external view returns (
        string memory outCertID,
        bytes32 filePhash,
        bytes32 dataHash,
        bytes memory encryptedData,
        uint256 issuedAt,
        uint8 status,
        bytes32 adminDecryptedHash
    ) {
        Certificate memory c = certs[certID];
        require(c.issuedAt != 0, "not found");
        return (c.certID, c.filePhash, c.dataHash, c.encryptedData, c.issuedAt, uint8(c.status), c.adminDecryptedHash);
    }

    /// Enumeration helpers
    function getCertificateCount() external view returns (uint256) {
        return certIds.length;
    }

    function getCertificateIdByIndex(uint256 index) external view returns (string memory) {
        require(index < certIds.length, "index OOB");
        return certIds[index];
    }

    /// Stats summary
    function getStats() external view returns (uint256 _totalIssued, uint256 _totalFlagged, uint256 _totalRevoked) {
        return (totalIssued, totalFlagged, totalRevoked);
    }

    /// verifyCertificateView: view-only verification. Returns:
    /// code: 0 not found, 1 exact file+data match, 2 file match but data mismatch,
    /// 3 data match only (file differs / scanned), 4 no match, 5 flagged, 6 revoked
    /// adminMatch: whether adminRecordedDecryptedHash == dataHash (audit)
    function verifyCertificateView(string calldata certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash)
        external view returns (uint8 code, string memory message, bool adminMatch, bytes32 storedFilePhash, bytes32 storedDataHash)
    {
        Certificate memory c = certs[certID];
        if (c.issuedAt == 0) {
            return (0, "Certificate not found", false, bytes32(0), bytes32(0));
        }
        if (c.status == CertStatus.Revoked) {
            return (6, "Certificate revoked", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        if (c.status == CertStatus.Flagged) {
            return (5, "Certificate flagged - admin review required", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }

        // exact match both
        if (c.filePhash != bytes32(0) && recomputedFilePhash == c.filePhash && recomputedDataHash == c.dataHash) {
            return (1, "Exact file (pHash) & data (SHA-256) match", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        // file matches but data differs
        if (c.filePhash != bytes32(0) && recomputedFilePhash == c.filePhash && recomputedDataHash != c.dataHash) {
            return (2, "File pHash matches but data hash differs - possible metadata tamper", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        // data matches only (scan/re-export)
        if (recomputedDataHash == c.dataHash) {
            return (3, "Data hash matches (file differs) - likely scanned/re-exported copy", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        // no match
        return (4, "No match - certificate likely invalid or forged", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
    }
}

/* ----------------------- CertificateFactory (permissionless addOrganization) ----------------------- */
contract CertificateFactory {
    // owner is kept for potential admin ops (update/flag) but addOrganization is permissionless.
    address public owner;
    uint256 public organizationCount;

    struct Organization {
        address orgWallet;
        address certContract;
        string name;
        string meta;
        bool isActive;
        bool isFlagged;
        uint256 issuedCertCount; // incremented by cert contract notify
    }

    mapping(address => Organization) private organizations; // key = org wallet
    address[] private orgList;

    event OrganizationAdded(address indexed orgWallet, address certContract, string name);
    event OrganizationUpdated(address indexed orgWallet, string name, bool isActive, bool isFlagged);
    event OrganizationFlagged(address indexed orgWallet, bool flagged);
    event NotifiedCertificateIssued(address indexed orgWallet);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        organizationCount = 0;
    }

    /// Anyone can add an organization. Factory will deploy a CertificateContract for it.
    /// NOTE: This is intentionally permissionless.
    function addOrganization(address orgWallet, string calldata name, string calldata meta) external {
        require(orgWallet != address(0), "org zero");
        require(organizations[orgWallet].orgWallet == address(0), "org exists");

        // deploy per-org contract
        CertificateContract cert = new CertificateContract(orgWallet, name, address(this));
        address certAddr = address(cert);

        organizations[orgWallet] = Organization({
            orgWallet: orgWallet,
            certContract: certAddr,
            name: name,
            meta: meta,
            isActive: true,
            isFlagged: false,
            issuedCertCount: 0
        });

        orgList.push(orgWallet);
        organizationCount += 1;

        emit OrganizationAdded(orgWallet, certAddr, name);
    }

    /// Update organization metadata & status (restricted to owner)
    function updateOrganization(address orgWallet, string calldata name, string calldata meta, bool isActive) external onlyOwner {
        require(organizations[orgWallet].orgWallet != address(0), "not exists");
        organizations[orgWallet].name = name;
        organizations[orgWallet].meta = meta;
        organizations[orgWallet].isActive = isActive;
        emit OrganizationUpdated(orgWallet, name, isActive, organizations[orgWallet].isFlagged);
    }

    /// Flag/unflag organization (restricted to owner)
    function flagOrganization(address orgWallet, bool flagged) external onlyOwner {
        require(organizations[orgWallet].orgWallet != address(0), "not exists");
        organizations[orgWallet].isFlagged = flagged;
        emit OrganizationFlagged(orgWallet, flagged);
    }

    /// Called by CertificateContract to notify Factory of issued certificate
    /// cert contract will call: notifyCertificateIssued(orgOwner)
    function notifyCertificateIssued(address orgWallet) external {
        Organization storage o = organizations[orgWallet];
        require(o.orgWallet != address(0), "org not registered");
        // require caller is the registered certContract for this org
        require(msg.sender == o.certContract, "not authorized");
        o.issuedCertCount += 1;
        emit NotifiedCertificateIssued(orgWallet);
    }

    /// Query functions
    function getOrganizationCount() external view returns (uint256) {
        return orgList.length;
    }

    function getAllOrganizations() external view returns (address[] memory) {
        return orgList;
    }

    function getOrganization(address orgWallet) external view returns (
        address _orgWallet,
        address _certContract,
        string memory _name,
        string memory _meta,
        bool _isActive,
        bool _isFlagged,
        uint256 _issuedCertCount
    ) {
        Organization memory o = organizations[orgWallet];
        require(o.orgWallet != address(0), "not exists");
        return (o.orgWallet, o.certContract, o.name, o.meta, o.isActive, o.isFlagged, o.issuedCertCount);
    }
}

/* ------------------------ VerifierContract (view helper) ------------------------ */
contract VerifierContract {
    struct VerificationResult {
        uint8 code;
        string message;
        address certContract;
        bytes32 storedFilePhash;
        bytes32 storedDataHash;
        bytes32 recomputedFilePhash;
        bytes32 recomputedDataHash;
        bool adminDecryptedMatches;
    }

    /// Verify by calling certContract.verifyCertificateView (staticcall -> gasless as eth_call)
    function verify(
        address certContract,
        string calldata certID,
        bytes32 recomputedFilePhash,
        bytes32 recomputedDataHash
    ) external view returns (VerificationResult memory result) {
        // staticcall the verifyCertificateView function
        (bool ok, bytes memory resp) = certContract.staticcall(
            abi.encodeWithSignature(
                "verifyCertificateView(string,bytes32,bytes32)",
                certID,
                recomputedFilePhash,
                recomputedDataHash
            )
        );

        if (!ok) {
            result.code = 0;
            result.message = "verify call failed";
            result.certContract = certContract;
            result.recomputedFilePhash = recomputedFilePhash;
            result.recomputedDataHash = recomputedDataHash;
            return result;
        }

        // decode (uint8 code, string message, bool adminMatch, bytes32 storedFilePhash, bytes32 storedDataHash)
        (uint8 code, string memory message, bool adminMatch, bytes32 storedFilePhash, bytes32 storedDataHash) =
            abi.decode(resp, (uint8, string, bool, bytes32, bytes32));

        result.code = code;
        result.message = message;
        result.certContract = certContract;
        result.storedFilePhash = storedFilePhash;
        result.storedDataHash = storedDataHash;
        result.recomputedFilePhash = recomputedFilePhash;
        result.recomputedDataHash = recomputedDataHash;
        result.adminDecryptedMatches = adminMatch;
        return result;
    }
}
