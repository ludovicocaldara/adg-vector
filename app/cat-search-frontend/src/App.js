import React, { useState } from 'react';
import { Search, Image, Loader2, Heart, Download } from 'lucide-react';
import './App.css';

// Calculate cosine similarity between two vectors (keeping for reference, not used with real API)
const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
};

const CatImageSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [error, setError] = useState(null);

  // Real API search function
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Convert the results to match our component expectations
        const formattedResults = data.results.map(result => ({
          id: result.id,
          imageData: result.imageData,
          imageSize: result.imageSize,
          similarityDistance: result.similarityDistance,
          similarity: result.similarityScore, // This is the normalized 0-1 score
          description: `Cat #${result.id} (${(result.imageSize / 1024).toFixed(1)}KB)`
        }));
        
        setSearchResults(formattedResults);
      } else {
        console.error('Search error:', data.error);
        setError(data.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(`Search failed: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    performSearch(searchQuery);
  };

  const toggleFavorite = (catId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(catId)) {
      newFavorites.delete(catId);
    } else {
      newFavorites.add(catId);
    }
    setFavorites(newFavorites);
  };

  const getCatImage = (cat) => {
    // If imageData already starts with 'data:', return as is
    if (cat.imageData.startsWith('data:')) return cat.imageData;
    // Otherwise, assume JPEG and prepend the data URL prefix
    return `data:image/jpeg;base64,${cat.imageData}`;
  };

  const downloadImage = (cat) => {
    try {
      const imageUrl = getCatImage(cat);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `cat-${cat.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Image className="text-purple-600" />
            Cat Image Search Engine
          </h1>
          <p className="text-gray-600 text-lg">
            Find the perfect cat image using natural language descriptions
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Describe the cat you're looking for... (e.g., 'a cute red kitten')"
              className="w-full px-6 py-4 text-lg border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none shadow-lg"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Search size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <strong>Error:</strong> {error}
              <br />
              <small>Make sure your backend server is running on http://localhost:3001</small>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Search Results ({searchResults.length} found)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative">
                    <img
                        src={getCatImage(cat)}
                        alt={`Cat ${cat.id}`}
                        className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={() => toggleFavorite(cat.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                        favorites.has(cat.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={20} fill={favorites.has(cat.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {cat.description}
                    </h3>
                    <div className="text-sm text-gray-600 mb-3">
                      <div>Distance: {cat.similarityDistance?.toFixed(4)}</div>
                      <div>Similarity: {((cat.similarity || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Size: {(cat.imageSize / 1024).toFixed(1)} KB
                      </div>
                      <button
                        onClick={() => downloadImage(cat)}
                        className="p-2 text-purple-600 hover:text-purple-800 transition-colors"
                        title="Download image"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchResults.length === 0 && searchQuery && !error && (
          <div className="text-center py-12">
            <Image className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              Try a different description or search term
            </p>
          </div>
        )}

        {/* Instructions */}
        {searchResults.length === 0 && !searchQuery && !error && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              How to use the Cat Image Search
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                This search engine uses AI embeddings to find cat images that match your text descriptions. 
                Simply type what you're looking for in natural language!
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Example searches:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• "a cute red kitten"</li>
                    <li>• "fluffy white cat sleeping"</li>
                    <li>• "black cat with green eyes"</li>
                    <li>• "tabby cat playing with toy"</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Features:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Real vector similarity search</li>
                    <li>• Natural language queries</li>
                    <li>• Similarity scoring</li>
                    <li>• Download actual images</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Integration Note */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🚀 Connected to Oracle Database
          </h3>
          <p className="text-green-700 text-sm">
            This application is now connected to your Oracle database:
          </p>
          <ul className="text-green-700 text-sm mt-2 space-y-1">
            <li>• <code>cats</code> table: Real cat images from BLOBs</li>
            <li>• <code>cats_vec_clipimg</code> table: CLIP embeddings for semantic search</li>
            <li>• <code>VECTOR_EMBEDDING(cliptxt)</code>: In-database text embedding generation</li>
            <li>• <code>VECTOR_DISTANCE()</code>: Similarity calculation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CatImageSearch;
