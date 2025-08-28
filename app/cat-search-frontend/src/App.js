import React, { useState } from 'react';
import { Search, Image, Loader2, Heart, Download } from 'lucide-react';
import './App.css';

const CatImageSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
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
        // Add this if you are running frontend and backend on different hosts/ports and need credentials
        // credentials: 'include',
      });

      // Add this block to help debug CORS/network issues
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }

      const data = await response.json();

      if (data.success) {
        // Convert the results to match our component expectations
        const formattedResults = data.results.map(result => ({
          id: result.id,
          imageData: result.imageData,
          imageSize: result.imageSize,
          similarityDistance: result.similarityDistance,
          similarity: result.similarityScore,
          description: `Cat #${result.id} (${(result.imageSize / 1024).toFixed(1)}KB)`
        }));
        setSearchResults(formattedResults);
      } else {
        console.error('Search error:', data.error);
        setError(data.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      // Show more details for fetch/network/CORS errors
      console.error('Search error:', error);
      setError(`Search failed: ${error.message}. If this is a CORS or network error, check browser console and backend CORS settings.`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    performSearch(searchQuery);
  };

  const getCatImage = (cat) => {
    // If imageData already starts with 'data:', return as is
    if (cat.imageData.startsWith('data:')) return cat.imageData;
    // Otherwise, assume JPEG and prepend the data URL prefix
    return `data:image/jpeg;base64,${cat.imageData}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 mt-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Image className="text-purple-600" />
            Offload AI Vector Search (and more) on Active Data Guard
          </h1>
          <p className="text-gray-600 text-lg">
            Cat image search using natural language descriptions
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-10">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Describe the cat you're looking for... (e.g., 'a cute red kitten')"
              className="w-full px-6 py-4 text-lg border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none shadow-lg"
              style={{ marginBottom: '0.5rem' }}
              size={60}
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
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Search Results ({searchResults.length} found)
            </h2>
            <div
              className="grid gap-8"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                alignItems: 'stretch'
              }}
            >
              {searchResults.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
                  style={{ margin: 'auto', maxWidth: 400, height: '100%' }}
                >
                  <div className="relative">
                    <img
                      src={getCatImage(cat)}
                      alt={`Cat ${cat.id}`}
                      className="w-full h-64 object-cover"
                      style={{ objectPosition: 'center' }}
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      {cat.description}
                    </h3>
                    <div className="text-sm text-gray-600 mb-3">
                      <div>Distance: {cat.similarityDistance?.toFixed(4)}</div>
                      <div>Similarity: {((cat.similarity || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-xs text-gray-500">
                        Size: {(cat.imageSize / 1024).toFixed(1)} KB
                      </div>
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
          <div className="bg-white rounded-xl shadow-lg p-8 my-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              How to use the Cat Image Search
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                This search engine relies on Oracle Database 23ai ONNX runtime to convert the search text to a vector embedding. It uses then AI Vector search with EXACT distance calculation to find cat images that match the input text.<br />
                Simply type what you're looking for in natural language!
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Example searches:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>"a cute red kitten"</li>
                    <li>"fluffy white cat sleeping"</li>
                    <li>"black and white cat looking angry"</li>
                    <li>"tabby cat playing with toy"</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Features:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Search text embedding generation using the clip-text model and Oracle Database 23ai ONNX runtime</li>
                    <li>Vector similarity search using Oracle Database 23ai AI Vector Search</li>
                    <li>Oracle Active Data Guard Real-Time Query offloading capabilities</li>
                    <li>Natural language queries</li>
                    <li>Similarity scoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Integration Note */}
        <div className="mt-10 bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🚀 Connected to Oracle Database
          </h3>
          <p className="text-green-700 text-sm">
            This application is now connected to your Oracle database
          </p>
          <ul className="text-green-700 text-sm mt-2 space-y-1">
            <li><code>mypdb_ro</code> is the read-only service running on the Active Data Guard standby database</li>
            <li>The <code>cats</code> table has a BLOB column containing cat images</li>
            <li>The <code>cats_vec_clipimg</code> table: contains the embeddings generated with the model <code>clip-img</code> for semantic search</li>
            <li>The query uses <code>VECTOR_EMBEDDING()</code> for the search text embedding generation</li>
            <li>It uses then <code>VECTOR_DISTANCE()</code> for similarity calculation</li>
            <li>The results are ordered by vector distance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CatImageSearch;

