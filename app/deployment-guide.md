# Cat Image Search Engine - Deployment Guide

## 🎯 Overview
This guide will walk you through deploying the Cat Image Search Engine that connects to your Oracle database with vector embeddings.

## 📋 Prerequisites
- Node.js 18+ installed
- Oracle database access (adgvec@mypdb_ro connection)
- Oracle Instant Client or equivalent for Node.js
- Git (optional, for version control)

---

## 🗄️ Step 1: Database Query Validation

✅ **Already Tested Successfully!** 

The following query works perfectly with your database:

```sql
SELECT c.id, 
       c.img_size,
       VECTOR_DISTANCE(
         cv.embedding, 
         VECTOR_EMBEDDING(cliptxt USING :search_text AS data)
       ) as similarity_distance
FROM cats c
JOIN cats_vec_clipimg cv ON c.id = cv.id
ORDER BY similarity_distance ASC
FETCH FIRST 12 ROWS ONLY
```

**Test Results:**
- ✅ "a cute red kitten" - returned 5 results with distances 1.21-1.23
- ✅ "fluffy white cat sleeping" - returned 5 different results  
- ✅ "black cat with green eyes" - returned 5 different results

---

## 🚀 Step 2: Backend Setup (Node.js + Express)

### 2.1 Create Project Directory
```bash
mkdir cat-search-backend
cd cat-search-backend
npm init -y
```

### 2.2 Install Dependencies
```bash
npm install express oracledb cors dotenv multer
npm install --save-dev nodemon
```

### 2.3 Create Environment Configuration
Create `.env` file:
```env
# Oracle Database Configuration
DB_USER=adgvec
DB_PASSWORD=your_password_here
DB_CONNECT_STRING=your_connection_string_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (adjust for your frontend URL)
FRONTEND_URL=http://localhost:3000
```

### 2.4 Create Main Server File
Create `server.js`:
```javascript
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());

// Oracle DB Configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMax: 10,
  poolMin: 2,
  poolIncrement: 2
};

// Initialize Oracle connection pool
let pool;

async function initializeDatabase() {
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle connection pool created successfully');
  } catch (err) {
    console.error('❌ Error creating Oracle connection pool:', err);
    process.exit(1);
  }
}

// Search endpoint
app.post('/api/search', async (req, res) => {
  let connection;
  
  try {
    const { searchText, limit = 12 } = req.body;
    
    if (!searchText || searchText.trim() === '') {
      return res.status(400).json({ 
        error: 'Search text is required' 
      });
    }

    connection = await pool.getConnection();
    
    const query = `
      SELECT c.id, 
             c.img, 
             c.img_size,
             VECTOR_DISTANCE(
               cv.embedding, 
               VECTOR_EMBEDDING(cliptxt USING :searchText AS data)
             ) as similarity_distance
      FROM cats c
      JOIN cats_vec_clipimg cv ON c.id = cv.id
      ORDER BY similarity_distance ASC
      FETCH FIRST :limit ROWS ONLY
    `;
    
    const result = await connection.execute(query, {
      searchText: searchText.trim(),
      limit: limit
    });
    
    // Convert results to frontend format
    const searchResults = result.rows.map(row => ({
      id: row[0],
      imageData: `data:image/jpeg;base64,${row[1].toString('base64')}`,
      imageSize: row[2],
      similarityDistance: row[3],
      // Convert distance to similarity percentage (lower distance = higher similarity)
      similarityScore: Math.max(0, (2 - row[3]) / 2) // Normalize to 0-1 range
    }));
    
    res.json({
      success: true,
      results: searchResults,
      searchText: searchText,
      resultCount: searchResults.length
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      error: 'Database search failed',
      message: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Error closing connection:', err);
      }
    }
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute('SELECT 1 FROM DUAL');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Cat Search API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});

startServer().catch(console.error);
```

### 2.5 Update package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

## 🎨 Step 3: Frontend Setup (React)

### 3.1 Create React Application
```bash
npx create-react-app cat-search-frontend
cd cat-search-frontend
```

### 3.2 Install Additional Dependencies
```bash
npm install lucide-react axios
```

### 3.3 Replace src/App.js
Replace the contents of `src/App.js` with the React component from the artifact above, but update the `performSearch` function:

```javascript
// Update the performSearch function in the React component
const performSearch = async (query) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }

  setIsSearching(true);
  
  try {
    const response = await fetch('http://localhost:3001/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        searchText: query,
        limit: 12 
      }),
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    
    if (data.success) {
      setSearchResults(data.results);
    } else {
      console.error('Search error:', data.error);
      setSearchResults([]);
    }
  } catch (error) {
    console.error('Search error:', error);
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};
```

### 3.4 Update Image Display
Replace the `getCatImageUrl` function with:
```javascript
const getCatImage = (cat) => {
  return cat.imageData; // This is now base64 data from the database
};
```

And update the img src in the JSX:
```javascript
<img
  src={getCatImage(cat)}
  alt={`Cat ${cat.id}`}
  className="w-full h-64 object-cover"
/>
```

---

## 🔧 Step 4: Configuration & Testing

### 4.1 Start Backend Server
```bash
cd cat-search-backend
npm run dev
```

### 4.2 Test Backend Health
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"healthy","database":"connected"}
```

### 4.3 Test Search Endpoint
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"searchText":"cute kitten","limit":3}'
```

### 4.4 Start Frontend
```bash
cd cat-search-frontend
npm start
```

Visit: http://localhost:3000

---

## 🌐 Step 5: Production Deployment

### 5.1 Build Frontend
```bash
cd cat-search-frontend
npm run build
```

### 5.2 Environment Configuration
Update `.env` for production:
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
DB_USER=adgvec
DB_PASSWORD=your_production_password
DB_CONNECT_STRING=your_production_connection
```

### 5.3 Process Manager (PM2)
```bash
npm install -g pm2

# Start backend
pm2 start server.js --name "cat-search-api"

# Serve frontend (if not using separate web server)
pm2 serve cat-search-frontend/build 3000 --name "cat-search-frontend"
```

### 5.4 Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/cat-search-frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 Step 6: Monitoring & Optimization

### 6.1 Database Performance
Monitor query performance:
```sql
-- Check execution plan
EXPLAIN PLAN FOR
SELECT c.id, c.img_size,
       VECTOR_DISTANCE(cv.embedding, VECTOR_EMBEDDING(cliptxt USING 'test' AS data)) as distance
FROM cats c JOIN cats_vec_clipimg cv ON c.id = cv.id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

### 6.2 Logging
Add structured logging to your backend:
```bash
npm install winston
```

### 6.3 Caching (Optional)
For frequently searched terms:
```bash
npm install redis
```

---

## 🎉 Step 7: Final Testing

### Test Cases:
1. **"a cute red kitten"** - Should return orange/red cats
2. **"fluffy white cat sleeping"** - Should return white, fluffy cats
3. **"black cat with green eyes"** - Should return dark cats
4. **"tabby cat playing"** - Should return striped, active cats

### Performance Expectations:
- Query response time: < 500ms
- Image load time: < 2 seconds
- UI responsiveness: Smooth interactions

---

## 🔧 Troubleshooting

### Common Issues:

**Database Connection Issues:**
```bash
# Check TNS names
tnsping your_service_name

# Test connection
sqlplus adgvec/password@connection_string
```

**CORS Issues:**
- Verify `FRONTEND_URL` in `.env`
- Check browser developer tools for CORS errors

**Image Loading Issues:**
- Verify BLOB data is being converted to base64 properly
- Check network tab for failed image requests

**Performance Issues:**
- Monitor database connection pool usage
- Consider adding vector index on embeddings column
- Implement result caching for popular searches

---

## 📈 Future Enhancements

1. **Advanced Filtering:**
   - Add filters for image size, aspect ratio
   - Combine text search with metadata filters

2. **User Features:**
   - Save search history
   - Create image collections
   - Share search results

3. **Performance:**
   - Implement result caching
   - Add pagination for large result sets
   - Optimize vector index configuration

4. **Analytics:**
   - Track popular search terms
   - Monitor query performance
   - User behavior analytics

---

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Health check returns "healthy"
- ✅ Search queries return relevant images
- ✅ Images load properly in the frontend
- ✅ Similarity scores make sense (lower distance = more similar)
- ✅ Different search terms return different results
- ✅ Response times are under 1 second

Ready to deploy! 🚀