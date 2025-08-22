const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

oracledb.initOracleClient({libDir: '/home/opc/instantclient'});

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
