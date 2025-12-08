const { createCanvas } = require('canvas');
const crypto = require('crypto');
const imghash = require('imghash');

// Mock Env
const ENCRYPTION_KEY = 'test_secret_key_32_bytes_long_123';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Copies of Helper Functions
function generateDataHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function encryptData(text) {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptData(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function embedSteganography(ctx, width, height, message) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const binaryMessage = message.split('').map(char =>
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');

    const lengthBinary = message.length.toString(2).padStart(32, '0');
    const fullBinary = lengthBinary + binaryMessage;

    console.log(`Embedding message length: ${message.length}, Binary length: ${fullBinary.length}`);

    let dataIdx = 0;
    for (let i = 0; i < fullBinary.length; i++) {
        if ((dataIdx + 1) % 4 === 0) dataIdx++; // Skip Alpha
        const bit = parseInt(fullBinary[i], 10);
        data[dataIdx] = (data[dataIdx] & ~1) | bit;
        dataIdx++;
    }
    ctx.putImageData(imgData, 0, 0);
}

function extractSteganography(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    let fullBinary = "";

    // Read first 32 bits for length
    let dataIdx = 0;
    for (let i = 0; i < 32; i++) {
        if ((dataIdx + 1) % 4 === 0) dataIdx++;
        fullBinary += (data[dataIdx] & 1).toString();
        dataIdx++;
    }
    const length = parseInt(fullBinary, 2);
    console.log(`Extracted length: ${length}`);

    // Read message
    fullBinary = "";
    const bitsToRead = length * 8;
    for (let i = 0; i < bitsToRead; i++) {
        if ((dataIdx + 1) % 4 === 0) dataIdx++;
        fullBinary += (data[dataIdx] & 1).toString();
        dataIdx++;
    }

    const chars = [];
    for (let i = 0; i < fullBinary.length; i += 8) {
        const byte = fullBinary.slice(i, i + 8);
        chars.push(String.fromCharCode(parseInt(byte, 2)));
    }
    return chars.join('');
}

async function runTest() {
    try {
        console.log("Starting Verification...");

        // 1. Data Hash
        const data = { id: "123", name: "Test User" };
        const hash = generateDataHash(data);
        console.log("Data Hash:", hash);

        // 2. Encrypt
        const encrypted = encryptData(hash);
        console.log("Encrypted Hash:", encrypted);

        // 3. Decrypt Check
        const decrypted = decryptData(encrypted);
        console.log("Decrypted Hash match:", decrypted === hash);
        if (decrypted !== hash) throw new Error("Encryption/Decryption failed");

        // 4. Steganography
        const width = 100;
        const height = 100;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Add some noise/color to verifying LSB modification doesn't destroy image
        ctx.fillStyle = "red";
        ctx.fillRect(10, 10, 50, 50);

        embedSteganography(ctx, width, height, encrypted);

        const extracted = extractSteganography(ctx, width, height);
        console.log("Extracted Message match:", extracted === encrypted);
        if (extracted !== encrypted) throw new Error("Steganography failed");

        // 5. pHash
        const buffer = canvas.toBuffer('image/png');
        const ph = await imghash.hash(buffer);
        console.log("pHash generated:", ph);

        console.log("ALL TESTS PASSED");
    } catch (e) {
        console.error("TEST FAILED:", e);
    }
}

runTest();
