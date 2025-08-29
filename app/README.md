# Cat Image Search Engine - Deployment Guide

## 🎯 Overview

This guide will walk you through deploying the Cat Image Search Engine that connects to your Oracle database with vector embeddings.

## 📋 Prerequisites

* Node.js 18+ installed
* Oracle database access (adgvec@mypdb_ro connection)
* Oracle Instant Client or equivalent for Node.js
* Git (optional, for version control)

## 🚀 Step 1: Backend Setup (Node.js + Express)

### Install Dependencies

```bash
cd cat-search-backend
npm install express oracledb cors dotenv multer
npm install --save-dev nodemon
```

###  Create Environment Configuration

Cope `env.sample` to `.env` and adapt to with your environment.

## 🎨 Step 2: Frontend Setup (React)

```bash
cd cat-search-frontend
npm install lucide-react axios
```

## 🔧 Step 3: Configuration & Testing

### Start Backend Server
```bash
cd cat-search-backend
npm run dev
```

### Test Backend Health
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"healthy","database":"connected"}
```

### Test Search Endpoint
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"searchText":"cute kitten","limit":3}'
```

### Start Frontend
```bash
cd cat-search-frontend
npm start
```

Visit: http://localhost:3000

### Test Cases:
1. **"a cute red kitten"** - Should return orange/red cats
2. **"fluffy white cat sleeping"** - Should return white, fluffy cats
3. **"black cat with green eyes"** - Should return dark cats
4. **"tabby cat playing"** - Should return striped, active cats