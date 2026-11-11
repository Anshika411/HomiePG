const crypto = require("crypto");

// 32-byte (64 characters hex) encryption key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b"; 
const IV_LENGTH = 12; // For AES-256-GCM

function encrypt(text) {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Package together: IV : EncryptedData : AuthTag
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return text; // fallback to plaintext if error
  }
}

function decrypt(encryptedText) {
  if (!encryptedText) return "";
  // Check if it's formatted as encrypted text
  if (!encryptedText.includes(":")) return encryptedText;

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText; // not encrypted in our GCM scheme

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedText; // return original string if decryption fails
  }
}

module.exports = {
  encrypt,
  decrypt
};
