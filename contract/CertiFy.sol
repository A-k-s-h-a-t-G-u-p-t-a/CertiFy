// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* ----------------------- CertificateFactory ----------------------- */
contract CertificateFactory {
    address public owner;
    uint256 public organizationCount;

    struct Organization {
        address orgWallet;
        address certContract;
        string name;
        string meta;
        bool isActive;
        bool isFlagged;
        uint256 issuedCertCount;
    }

    mapping(address => Organization) private organizations; // key = org wallet
    address[] private orgList;

    event OrganizationAdded(address indexed orgWallet, address certContract, string name);
    event OrganizationRegistered(address indexed orgWallet, address certContract, string name); // for existing contracts
    event OrganizationUpdated(address indexed orgWallet, string name, bool isActive, bool isFlagged);
    event OrganizationFlagged(address indexed orgWallet, bool flagged);
    event NotifiedCertificateIssued(address indexed orgWallet);
    event NotifiedCertificatesIssuedBatch(address indexed orgWallet, uint256 count);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        organizationCount = 0;
    }

    /// Anyone can add an organization; factory deploys per-org contract (existing behavior).
    function addOrganization(address orgWallet, string calldata name, string calldata meta) external {
        require(orgWallet != address(0), "org zero");
        require(organizations[orgWallet].orgWallet == address(0), "org exists");

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

    /// Register an existing per-org CertificateContract that was deployed off-chain (e.g., via ThirdWeb).
    /// Can be called by the factory owner or by the certContract itself (so the contract can self-register).
    /// Note: certContract should implement the constructor signature (orgOwner, name, factory)
    function registerExistingOrganization(address orgWallet, address certContract, string calldata name, string calldata meta) external {
        require(orgWallet != address(0), "org zero");
        require(certContract != address(0), "cert zero");
        require(organizations[orgWallet].orgWallet == address(0), "org exists");

        // allow either the owner to register or allow the certContract to call (self-registration)
        require(msg.sender == owner || msg.sender == certContract, "not authorized to register");

        organizations[orgWallet] = Organization({
            orgWallet: orgWallet,
            certContract: certContract,
            name: name,
            meta: meta,
            isActive: true,
            isFlagged: false,
            issuedCertCount: 0
        });

        orgList.push(orgWallet);
        organizationCount += 1;

        emit OrganizationRegistered(orgWallet, certContract, name);
    }

    /// Owner can update organization metadata & status
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

    /// Single certificate notify (existing)
    function notifyCertificateIssued(address orgWallet) external {
        Organization storage o = organizations[orgWallet];
        require(o.orgWallet != address(0), "org not registered");
        require(msg.sender == o.certContract, "not authorized");
        o.issuedCertCount += 1;
        emit NotifiedCertificateIssued(orgWallet);
    }

    /// Batch notify: increments issuedCertCount by `count` in one call. Called by the org's cert contract.
    function notifyCertificatesIssuedBatch(address orgWallet, uint256 count) external {
        Organization storage o = organizations[orgWallet];
        require(o.orgWallet != address(0), "org not registered");
        require(msg.sender == o.certContract, "not authorized");
        require(count > 0, "count 0");
        o.issuedCertCount += count;
        emit NotifiedCertificatesIssuedBatch(orgWallet, count);
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

/* ----------------------- CertificateContract (per-organization) ----------------------- */
contract CertificateContract {
    address public orgOwner;
    address public factory;
    string public organizationName;

    enum CertStatus { Unknown, Valid, Flagged, Revoked }

    struct Certificate {
        string certID;
        bytes32 filePhash;
        bytes32 dataHash;
        bytes   encryptedData;
        uint256 issuedAt;
        CertStatus status;
        bytes32 adminDecryptedHash;
    }

    mapping(string => Certificate) private certs;
    string[] private certIds;

    uint256 public totalIssued;
    uint256 public totalFlagged;
    uint256 public totalRevoked;

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

    /// Single certificate issue (keeps original behavior)
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

        // notify factory of single issuance
        CertificateFactory(factory).notifyCertificateIssued(orgOwner);

        emit CertificateIssued(certID, filePhash, dataHash, block.timestamp);
    }

    /// Batch issue multiple certificates in a single transaction
    /// WARNING: watch gas limits; split into chunks if many certificates.
    function issueCertificatesBatch(
        string[] calldata certIDList,
        bytes32[] calldata filePhashList,
        bytes32[] calldata dataHashList,
        bytes[] calldata encryptedDataList
    ) external onlyOrg {
        uint256 n = certIDList.length;
        require(n > 0, "empty list");
        require(filePhashList.length == n && dataHashList.length == n && encryptedDataList.length == n, "array len mismatch");

        for (uint256 i = 0; i < n; i++) {
            string calldata certID = certIDList[i];
            require(bytes(certID).length > 0, "empty certID");
            require(certs[certID].issuedAt == 0, "already exists");

            certs[certID] = Certificate({
                certID: certID,
                filePhash: filePhashList[i],
                dataHash: dataHashList[i],
                encryptedData: encryptedDataList[i],
                issuedAt: block.timestamp,
                status: CertStatus.Valid,
                adminDecryptedHash: bytes32(0)
            });

            certIds.push(certID);
            totalIssued += 1;

            emit CertificateIssued(certID, filePhashList[i], dataHashList[i], block.timestamp);
        }

        // notify factory in a single call with the batch count (cheaper than n single calls)
        CertificateFactory(factory).notifyCertificatesIssuedBatch(orgOwner, n);
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
        }
        emit CertificateRevoked(certID, reason);
    }

    /// Admin records decrypted hash
    function adminRecordDecryptedHash(string calldata certID, bytes32 decryptedHash) external onlyFactory {
        Certificate storage c = certs[certID];
        require(c.issuedAt != 0, "not found");
        c.adminDecryptedHash = decryptedHash;
        bool matches = (decryptedHash == c.dataHash);
        emit AdminRecordedDecryptedHash(certID, decryptedHash, matches);
    }

    /// View a certificate
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

    function getStats() external view returns (uint256 _totalIssued, uint256 _totalFlagged, uint256 _totalRevoked) {
        return (totalIssued, totalFlagged, totalRevoked);
    }

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

        if (c.filePhash != bytes32(0) && recomputedFilePhash == c.filePhash && recomputedDataHash == c.dataHash) {
            return (1, "Exact file (pHash) & data (SHA-256) match", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        if (c.filePhash != bytes32(0) && recomputedFilePhash == c.filePhash && recomputedDataHash != c.dataHash) {
            return (2, "File pHash matches but data hash differs - possible metadata tamper", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        if (recomputedDataHash == c.dataHash) {
            return (3, "Data hash matches (file differs) - likely scanned/re-exported copy", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
        }
        return (4, "No match - certificate likely invalid or forged", (c.adminDecryptedHash == c.dataHash), c.filePhash, c.dataHash);
    }
}

/* ------------------------ VerifierContract (unchanged) ------------------------ */
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

    function verify(
        address certContract,
        string calldata certID,
        bytes32 recomputedFilePhash,
        bytes32 recomputedDataHash
    ) external view returns (VerificationResult memory result) {
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
