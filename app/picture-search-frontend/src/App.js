import React, { useState } from 'react';
import { X, Search, Image, Loader2, } from 'lucide-react';
import './App.css';
import './output.css';

const PictureSearch = () => {
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
      const response = await fetch('/api/search', {
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
          description: `Picture #${result.id} (${(result.imageSize / 1024).toFixed(1)}KB)`
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

  const getPicture = (picture) => {
    // If imageData already starts with 'data:', return as is
    if (picture.imageData.startsWith('data:')) return picture.imageData;
    // Otherwise, assume JPEG and prepend the data URL prefix
    return `data:image/jpeg;base64,${picture.imageData}`;
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 mt-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            Offload AI Vector Search (and more) on Oracle Active Data Guard
          </h1>
          <p className="text-gray-600 text-lg">
            Picture search using natural language descriptions
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
              placeholder="Describe the picture you're looking for... (e.g., 'a cute blue bird')"
              className="w-full px-6 py-4 text-lg border-2 border-oracle rounded-xl focus:border-oracle focus:outline-none shadow-lg"
              style={{ marginBottom: '0.5rem' }}
              size={60}
            />
	    {/* Clear "X" button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-12 top-2 p-2 text-gray-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-2 p-2 bg-oracle text-white rounded-lg hover:bg-oracle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div className="bg-red-50 border border-oracle text-oracle px-4 py-3 rounded-lg">
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
              {searchResults.map((picture) => (
                <div
                  key={picture.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
                  style={{ margin: 'auto', maxWidth: 400, height: '100%' }}
                >
                  <div className="relative">
                    <img
                      src={getPicture(picture)}
                      alt={`#${picture.id}`}
                      className="w-full h-64 object-contain"
                      style={{ objectPosition: 'center' ,
                        maxWidth: "300px",
                        maxHeight: "300px",
                        margin: "0 auto",
                      }}
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                      {picture.description}
                    </h3>
                    <div className="text-sm text-gray-600 mb-3">
                      <div>Distance: {picture.similarityDistance?.toFixed(4)}</div>
                      <div>Similarity: {((picture.similarity || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-xs text-gray-500">
                        Size: {(picture.imageSize / 1024).toFixed(1)} KB
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
              How to use the Picture Search
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                This search engine relies on Oracle Database 23ai ONNX runtime to convert the search text to a vector embedding. It uses then AI Vector search with EXACT distance calculation to find pictures that match the input text.<br />
                Simply type what you're looking for in natural language!
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Example searches:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>"beautiful wildlife"</li>
                    <li>"lake and forest"</li>
                    <li>"mountains and snow"</li>
                    <li>"colorful flowers"</li>
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
        <div className="mt-10 bg-aiw25-lightblue border border-aiw25-blue rounded-xl p-6">
          <h3 className="text-lg font-semibold text-aiw25-blue mb-2">
            🚀 Connected to Oracle Database
          </h3>
          <p className="text-aiw25-blue text-sm">
            This application is now connected to an <b>Oracle Active Data Guard database</b>
          </p>
          <ul class="list-inside list-disc text-aiw25-blue">
            <li><code>mypdb_ro</code> is the read-only service running on the Active Data Guard standby database</li>
            <li>The <code>pictures</code> table has a BLOB column containing pictures</li>
            <li>The <code>picture_embeddings</code> table: contains the embeddings generated with the model <code>clip-img</code> for semantic search</li>
            <li>The query uses <code>VECTOR_EMBEDDING()</code> for the search text embedding generation</li>
            <li>It uses then <code>VECTOR_DISTANCE()</code> for similarity calculation</li>
            <li>The results are ordered by vector distance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PictureSearch;

