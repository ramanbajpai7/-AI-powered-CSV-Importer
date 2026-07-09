# AI-Powered CSV Importer for GrowEasy CRM

An intelligent CSV import tool that uses AI (Google Gemini) to extract and map CRM lead data from any CSV format into GrowEasy CRM format.

## Features

- Drag and Drop Upload - Upload CSV files via drag-and-drop or file picker
- Smart Preview - Parse and display CSV data in a responsive, scrollable table with sticky headers
- AI-Powered Extraction - Gemini AI intelligently maps any CSV column structure to GrowEasy CRM fields
- Batch Processing - Records are processed in batches of 10 with retry logic
- Real-Time Progress - Server-Sent Events (SSE) stream processing updates live
- Results Dashboard - View imported records, skipped records, and success statistics
- CSV Download - Export extracted CRM records as a clean CSV file
- Dark Mode UI - Premium dark theme with glassmorphism and smooth animations
- Responsive Design - Works on desktop, tablet, and mobile
- Docker Support - Run everything with a single `docker-compose up`

## Tech Stack

| Layer    | Technology               |
|----------|--------------------------|
| Frontend | Next.js 15, TypeScript   |
| Backend  | Express.js, TypeScript   |
| AI       | Google Gemini 2.0 Flash  |
| Parsing  | csv-parse                |
| Styling  | Vanilla CSS (Dark Theme) |

## Prerequisites

- Node.js 18+
- npm
- Google Gemini API key ([Get one free](https://aistudio.google.com/apikey))

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-csv-importer.git
cd ai-csv-importer
```

### 2. Set up the Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Using Docker (Alternative)

```bash
# Set your API key
export GEMINI_API_KEY=your_key_here

docker-compose up --build
```

## How It Works

1. Upload - User uploads any valid CSV file (Facebook leads, Google Ads exports, Excel sheets, etc.)
2. Preview - The CSV is parsed and displayed in a responsive table for review
3. Confirm - User clicks "Confirm and Process with AI" to begin extraction
4. AI Processing - Records are sent to Gemini AI in batches of 10. The AI:
   - Identifies column meanings regardless of naming
   - Maps data to CRM fields (name, email, phone, status, etc.)
   - Handles multiple emails/phones (first goes to field, rest to notes)
   - Skips records without email AND phone number
   - Validates CRM status and data source values
5. Results - Extracted records are displayed with statistics and can be downloaded as CSV

## CRM Fields Extracted

| Field | Description |
|-------|-------------|
| created_at | Lead creation date |
| name | Full name |
| email | Primary email |
| country_code | Phone country code |
| mobile_without_country_code | Mobile number |
| company | Company name |
| city, state, country | Location |
| lead_owner | Assigned owner |
| crm_status | GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE |
| crm_note | Notes and extra info |
| data_source | Lead source |
| possession_time | Property timeline |
| description | Additional details |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload CSV file, returns parsed preview |
| POST | `/api/process` | Process records with AI (supports SSE streaming) |
| GET | `/api/health` | Health check |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   ├── routes/api.ts         # API routes
│   │   ├── services/
│   │   │   ├── aiService.ts      # Gemini AI extraction
│   │   │   └── csvService.ts     # CSV parsing
│   │   └── types/index.ts        # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Main application page
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── globals.css       # Design system
│   │   ├── components/
│   │   │   ├── FileUpload.tsx    # Drag and drop uploader
│   │   │   ├── DataTable.tsx     # Generic data table
│   │   │   ├── CRMTable.tsx      # CRM-specific table
│   │   │   ├── Stepper.tsx       # Progress stepper
│   │   │   └── Progress.tsx      # Processing progress
│   │   ├── lib/api.ts            # API client with SSE
│   │   └── types/index.ts        # Shared types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
