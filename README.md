# Score3 CBAM - Supply Chain Emission Tracking & CBAM Compliance

A modern SaaS platform for Turkish exporters to automate supply chain emission tracking and generate CBAM (Carbon Border Adjustment Mechanism) compliant reports.

## 🎯 Overview

Score3 CBAM helps Turkish exporters across 20+ sectors (Automotive, Textiles, Steel, Plastics, Electronics, etc.) to:

- **Upload & Process** supply chain data (Excel/CSV)
- **Calculate Score3** metrics: Emission Score, Responsibility Score, Supply Chain Score
- **Manage Suppliers** by tier (Tier 1-3) and sector
- **Generate Reports** in PDF/XML/JSON format for CBAM compliance
- **Validate Data** using AI (LLM-powered error detection and emission prediction)

## 🏗️ Tech Stack

### Backend
- **Framework**: Express.js 4 with tRPC 11
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Manus OAuth + JWT sessions
- **AI**: OpenAI/Climatiq API integration for LLM validation
- **Storage**: S3-compatible storage for file uploads and reports

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4 with custom neumorphic components
- **UI Components**: shadcn/ui
- **State Management**: tRPC React Query hooks
- **Charts**: Recharts for score visualization

### Deployment
- **Server**: Node.js with Express
- **Database**: PostgreSQL
- **Storage**: S3 (Manus built-in)
- **Ready for**: Vercel, Netlify, Docker

## 📋 Supported Sectors (20+)

1. **Otomotiv ve Yedek Parça** (Automotive & Parts) - HS 8708
2. **Makine ve Mekanik Cihazlar** (Machinery)
3. **Tekstil ve Hazır Giyim** (Textiles & Apparel) - HS 61-62
4. **Mineral Yakıt** (Mineral Fuels)
5. **Elektrikli Eşya ve Elektronik** (Electrical & Electronics)
6. **Demir-Çelik ve Metal Ürünleri** (Steel & Metals) - HS 72
7. **Plastik ve Plastik Mamuller** (Plastics) - HS 39
8. **Kimyasal Maddeler** (Chemicals)
9. **Mücevherat ve Kıymetli Metaller** (Jewelry & Precious Metals)
10. **Gıda Ürünleri** (Food Products) - HS 08 (Fındık)
11. **Mobilya ve Ev Tekstili** (Furniture)
12. **İlaç ve Eczacılık Ürünleri** (Pharmaceuticals)
13. **Lastik ve Kauçuk Ürünleri** (Rubber)
14. **Cam ve Seramik** (Glass & Ceramics)
15. **Alüminyum ve Demir Dışı Metaller** (Aluminum & Non-ferrous Metals)
16. **Ayakkabı ve Deri Ürünleri** (Footwear & Leather)
17. **Tarım Makineleri ve Traktör** (Agricultural Machinery)
18. **Savunma ve Havacılık Parçaları** (Defense & Aerospace)
19. **Oyuncak ve Spor Malzemeleri** (Toys & Sports)
20. **Temizlik ve Kozmetik Ürünleri** (Cleaning & Cosmetics)

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL 14+
- npm or pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm drizzle-kit migrate

# Seed database with sectors and emission factors
pnpm tsx drizzle/seed.ts

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/score3cbam

# Auth
JWT_SECRET=your-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth

# Storage
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id
```

## 📊 Score3 Calculation

Score3 is a composite metric combining three sub-scores:

### 1. Emission Score (Emisyon Skoru)
- Calculates Scope 1-3 emissions using CBAM/PCAF factors
- Based on HS code and product quantity
- Range: 0-100 (higher = lower emissions)

### 2. Responsibility Score (Sorumluluk Skoru)
- Measures supply chain accountability
- Considers supplier tier and data completeness
- Range: 0-100 (higher = better responsibility)

### 3. Supply Chain Score (Tedarik Skoru)
- Evaluates supply chain efficiency and transparency
- Tier 1-3 supplier management
- Range: 0-100 (higher = more efficient)

### Composite Score
- Average of three sub-scores
- **70-100**: Green (Excellent)
- **40-69**: Yellow (Good)
- **0-39**: Red (Needs Improvement)

## 🔑 Key Features

### Dashboard
- Overview of uploads, suppliers, and reports
- Quick access to all modules
- Real-time statistics

### Upload Module
- Excel/CSV file upload (max 10MB)
- Automatic data parsing and validation
- Progress tracking
- Error reporting

### Supplier Management
- Organize suppliers by 20+ sectors
- Tier 1-3 classification
- HS code mapping
- Quantity and CO2e tracking
- Email invitations for self-service portal

### Score Calculation
- Automatic Score3 calculation on upload
- Per-sector scoring
- Per-supplier scoring
- Historical score tracking

### Report Generation
- **PDF Reports**: Formatted documents with charts
- **XML Reports**: CBAM-compliant structured data
- **JSON Reports**: Machine-readable format
- Download and sharing capabilities

### AI Features
- **Data Validation**: LLM-powered error detection
- **Emission Prediction**: Estimate missing CO2e data
- **Supplier Insights**: AI-generated recommendations

## 🎨 Design System

### Color Palette
- **Primary**: #10b981 (Yeşil - Green)
- **Secondary**: #6b7280 (Gri - Gray)
- **Background**: #f8f9fa (Açık Gri - Light Gray)
- **Cards**: #ffffff (White)

### Components
- Neumorphic buttons with soft shadows
- Responsive grid layouts
- Color-coded score badges
- Progress bars for visual feedback
- Accordion-based sector navigation

## 📁 Project Structure

```
score3-cbam/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # tRPC client setup
│   │   ├── styles/           # CSS (neumorphic, responsive)
│   │   └── index.css         # Global styles
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── routers/              # tRPC routers (uploads, suppliers, reports)
│   ├── db.ts                 # Database helpers
│   ├── score3-engine.ts      # Score3 calculation logic
│   ├── cbam-report-engine.ts # Report generation
│   └── storage.ts            # S3 storage helpers
├── drizzle/                   # Database schema & migrations
│   ├── schema.ts             # Table definitions
│   ├── seed.ts               # Seed script (20 sectors, 100 inputs, 10 factors)
│   └── migrations/           # SQL migration files
├── shared/                    # Shared types and constants
└── package.json              # Dependencies
```

## 🔐 Security

- **Authentication**: Manus OAuth with JWT sessions
- **Authorization**: Role-based access control (user/admin)
- **Data Validation**: Server-side input validation with Zod
- **Rate Limiting**: Built-in rate limiting on API endpoints
- **CORS**: Configured for secure cross-origin requests
- **SSL/TLS**: All connections encrypted in production

## 📈 Performance

- **Lazy Loading**: Components loaded on demand
- **Caching**: tRPC query caching with React Query
- **Database Indexing**: Optimized queries on sectors, suppliers, scores
- **File Compression**: Gzip compression for API responses
- **CDN Ready**: Static assets served via S3/CDN

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📦 Deployment

### Docker
```bash
# Build Docker image
docker build -t score3-cbam .

# Run container
docker run -p 3000:3000 score3-cbam
```

### Vercel
```bash
# Deploy to Vercel
vercel deploy
```

### Netlify
```bash
# Deploy to Netlify
netlify deploy --prod
```

## 📚 API Documentation

### tRPC Endpoints

#### Uploads
- `uploads.create` - Upload a file
- `uploads.list` - Get user's uploads
- `uploads.getById` - Get upload details
- `uploads.process` - Process upload and calculate scores

#### Suppliers
- `suppliers.getSectors` - Get all sectors with inputs
- `suppliers.create` - Add a supplier
- `suppliers.list` - Get user's suppliers
- `suppliers.getById` - Get supplier details
- `suppliers.update` - Update supplier
- `suppliers.delete` - Delete supplier
- `suppliers.calculateScore` - Calculate supplier score

#### Reports
- `reports.generate` - Generate report (PDF/XML/JSON)
- `reports.list` - Get user's reports
- `reports.validateData` - Validate data with LLM
- `reports.predictEmissions` - Predict missing emissions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@score3cbam.com or visit our [help center](https://help.score3cbam.com).

## 🙏 Acknowledgments

- Built with React, Express, and Tailwind CSS
- Powered by Manus OAuth and built-in APIs
- CBAM compliance standards from EU regulations
- Emission factors from PCAF and Climatiq

---

**Score3 CBAM** - Making CBAM compliance simple for Turkish exporters. 🚀
