# 🎓 CertiFy - Blockchain Certificate Verification Platform

<div align="center">
  <img src="public/certify-logo.png" alt="CertiFy Logo" width="200"/>
  
  **Professional Certificate Creation, Verification & Blockchain Deployment**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-627EEA?style=for-the-badge&logo=ethereum)](https://ethereum.org/)
  [![AI Powered](https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 🌟 Overview

CertiFy is a comprehensive blockchain-based certificate verification platform that combines modern web technologies with AI-powered OCR and smart contracts. It enables educational institutions and organizations to create, issue, verify, and manage digital certificates with cryptographic security and immutable blockchain storage.

### ✨ Key Features

- **🎨 Visual Certificate Designer** - Drag-and-drop interface with professional templates
- **🔗 Blockchain Integration** - Immutable certificate storage on Ethereum
- **🤖 AI-Powered OCR** - Google Gemini API for intelligent text extraction
- **🔐 Cryptographic Security** - SHA-256 hashing for file and data integrity
- **📊 Analytics Dashboard** - Real-time statistics and certificate management
- **🎯 Multi-Organization Support** - Wallet-based organization validation
- **📱 Responsive Design** - Works seamlessly across all devices
- **🔍 Advanced Verification** - Comprehensive certificate validation system

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.8+ for OCR backend)
- **MetaMask** or compatible Web3 wallet
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/A-k-s-h-a-t-G-u-p-t-a/CertiFy.git
cd CertiFy

# Install dependencies
npm install

# Install Tailwind CSS (if styling issues occur)
npm install -D tailwindcss postcss autoprefixer

# Install Python dependencies
cd PythonAPI
pip install -r requirements.txt
cd ..
```

### 2. Environment Setup

Create `.env` file in root directory:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_0GtLEgiHK7TI@ep-hidden-leaf-adu8lbfm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"

# Google AI (Get from: https://makersuite.google.com/app/apikey)
GEMINI_API_KEY="abcdefghijklmnopqrstuvwxyz"

# Thirdweb
YOUR_CLIENT_ID="---------"
YOUR_SECRET_KEY="--------"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### 4. Start Development Servers

```bash
# Terminal 1: Frontend (Next.js)
npm run dev

# Terminal 2: OCR Backend (Python)
cd PythonAPI
python robust_ocr.py
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **OCR API**: http://localhost:5001

---

## 🛠️ Troubleshooting Common Issues

### ❌ `npm run dev` Fails (Exit Code 1)

**Possible Causes & Solutions:**

1. **Node.js Version Issue:**
   ```bash
   node --version  # Should be v18+
   nvm use 18      # If using nvm
   ```

2. **Dependencies Issue:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Port Already in Use:**
   ```bash
   npm run dev -- --port 3001
   ```

4. **Turbopack Issue (from your package.json):**
   ```bash
   # Try without turbopack
   npx next dev
   ```

### ❌ Python OCR Fails (Exit Code 1)

**Possible Causes & Solutions:**

1. **Missing Dependencies:**
   ```bash
   cd PythonAPI
   pip install flask google-generativeai python-dotenv
   ```

2. **Google AI API Key Issue:**
   ```bash
   # Check if GEMINI_API_KEY is set
   echo $GEMINI_API_KEY  # Linux/Mac
   echo %GEMINI_API_KEY% # Windows
   ```

3. **File Path Issues:**
   ```bash
   # Make sure you're in the right directory
   cd PythonAPI
   python -c "import os; print(os.getcwd())"
   ```

4. **Try Different Python Command:**
   ```bash
   python3 ocr_functions.py
   # or
   py ocr_functions.py
   ```

### ❌ Styling/Tailwind Issues

```bash
# Reinstall Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📁 Project Structure

```
certify/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📄 page.js            # Landing page
│   │   ├── 📁 certificate-generator/
│   │   │   └── 📄 page.js        # Visual certificate designer
│   │   ├── 📁 organizations/
│   │   │   └── 📄 page.tsx       # Organization dashboard
│   │   ├── 📁 admin/             # Admin panel
│   │   ├── 📁 verifier/          # Certificate verification
│   │   ├── 📁 upload/            # File upload interface
│   │   └── 📁 api/               # API routes
│   ├── 📁 components/            # Reusable UI components
│   ├── 📁 lib/                   # Utility libraries
│   └── 📁 generated/             # Auto-generated files
├── 📁 PythonAPI/                 # OCR Backend
│   ├── 📄 robust_ocr.py          # Main Flask application
│   ├── 📄 ocr_functions.py       # OCR processing logic
│   └── 📄 requirements.txt       # Python dependencies
├── 📁 prisma/                    # Database schema
├── 📁 public/                    # Static assets
└── 📄 package.json               # Dependencies & scripts
```

---

## 🔧 Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15.5.3 + React | Web application framework |
| **Styling** | Tailwind CSS + Shadcn/ui | Modern UI components |
| **Animation** | Framer Motion | Smooth animations |
| **Canvas** | Konva.js | Certificate designer |
| **Database** | PostgreSQL + Prisma | Data persistence |
| **Auth** | NextAuth.js | User authentication |
| **Blockchain** | Thirdweb + Ethereum | Certificate storage |
| **AI/OCR** | Google Gemini | Text extraction |
| **Backend API** | Python Flask | OCR processing |

---

## 🎯 Usage Guide

### For Certificate Creators
1. **Connect Wallet** - Use MetaMask with valid organization address
2. **Design Certificate** - Use visual designer with drag-and-drop
3. **Add Elements** - Text, images, templates
4. **Deploy to Blockchain** - One-click deployment with OCR

### For Verifiers
1. **Upload Certificate** - Drag & drop certificate file
2. **AI Analysis** - Automatic text extraction
3. **Blockchain Check** - Verify authenticity on-chain
4. **View Results** - Detailed verification report

### For Organizations
1. **Dashboard Access** - View analytics and metrics
2. **Certificate Management** - Issue, revoke, flag certificates
3. **Analytics** - Track trends and performance
4. **Bulk Operations** - Handle multiple certificates

---

## 🔗 Smart Contract Integration

### Wallet-Contract Mapping
```javascript
const WALLET_CONTRACT_MAPPING = {
  "0x7e14929d682236d3Cb02B6E2aCC779ca9b255E78": "0x1627fb0cc3e87E22648C05Db23c4638B0B881e3E",
  "0x5b2E5aB341743706cFae342A05df91E018838F59": "0xE13FB895ce3Bc12b61Ff725a32b44585DD0ACc2e",
  "0x8e6a18B80bDbdF6422dA06BA04daCe8D832Fea98": "0xD2722d58332c42f27d1242D5Bb8D19e9DBFDB4eD"
};
```

### Deployment Process
1. **Certificate Generation** → Visual design
2. **File Hashing** → SHA-256 hash
3. **OCR Extraction** → Google Gemini AI
4. **Data Hashing** → Extracted data hash
5. **Blockchain Storage** → Smart contract deployment

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Connect GitHub repo to Vercel
# Add environment variables
# Auto-deploy on push
```

### Manual Deployment
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL="your-production-db-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="production-secret"
GEMINI_API_KEY="production-api-key"
```

---

## 🐛 Common Error Solutions

### Error: "Module not found"
```bash
npm install
# or delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"
```bash
# Kill process on port 3000
npx kill-port 3000
# or use different port
npm run dev -- --port 3001
```

### Error: "Python module not found"
```bash
cd PythonAPI
pip install -r requirements.txt
# or try
pip3 install -r requirements.txt
```

### Error: "Blockchain connection failed"
- Check MetaMask connection
- Verify network (Sepolia testnet)
- Confirm wallet address in mapping
- Check Thirdweb credentials

---

## 📋 Development Checklist

- [ ] Node.js v18+ installed
- [ ] Python 3.8+ installed
- [ ] MetaMask wallet setup
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Google AI API key valid
- [ ] Thirdweb project setup
- [ ] Both servers running (3000 & 5001)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/A-k-s-h-a-t-G-u-p-t-a/CertiFy/issues)
- **Documentation**: [Wiki](https://github.com/A-k-s-h-a-t-G-u-p-t-a/CertiFy/wiki)

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  Made with ❤️ by [Akshat Gupta](https://github.com/A-k-s-h-a-t-G-u-p-t-a)
  
</div>
