'use client';

import { useState, useEffect } from 'react';
import MyHeder from '../components/header';
import MyFooter from '../components/footer';

interface Song {
  id: number;
  title: string;
  author: string;
  category: string;
}

interface SongLine {
  row_num: number;
  song_text: string;
}

interface SongDetail extends Song {
  lines: SongLine[];
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSong, setLoadingSong] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Songs laden
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch(`/api/songs?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSongs(data);
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSongs, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Einzelnen Song laden
  const loadSong = async (id: number) => {
    setLoadingSong(true);
    try {
      const res = await fetch(`/api/songs/${id}`);
      const data = await res.json();
      setSelectedSong(data);
    } catch (error) {
      console.error('Fehler beim Laden des Songs:', error);
    } finally {
      setLoadingSong(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MyHeder />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes rotate-gradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .search-container {
          position: relative;
          padding: 3px;
          border-radius: 1rem;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6);
          background-size: 300% 300%;
          animation: shimmer 3s linear infinite;
        }

        .search-container.focused {
          animation: shimmer 1.5s linear infinite;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(236, 72, 153, 0.3);
        }

        .search-container::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 1.1rem;
          background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6);
          animation: rotate-gradient 4s linear infinite;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: -1;
        }

        .search-container.focused::before {
          opacity: 1;
        }

        .search-inner {
          background: #1e1e2e;
          border-radius: 0.85rem;
          position: relative;
          z-index: 1;
        }

        .music-note {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease-out;
        }

        .accordion-content.open {
          max-height: 60vh;
        }

        .chevron {
          transition: transform 0.3s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <svg
              className="w-16 h-16 mx-auto text-purple-500 music-note"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Pesmarica
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Slovenske ljudske pesmi
          </p>
        </div>

        {/* Animated Suchbox */}
        <div className="mb-8">
          <div className={`search-container max-w-xl mx-auto ${isFocused ? 'focused' : ''}`}>
            <div className="search-inner">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Išči pesem..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full px-5 py-4 pl-14 bg-transparent text-white focus:outline-none text-lg placeholder-gray-400"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className={`w-6 h-6 transition-colors duration-300 ${isFocused ? 'text-purple-500' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
            {songs.length} pesmi v zbirki
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Collapsible Song-Liste */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Accordion Header */}
            <button
              onClick={() => setIsListOpen(!isListOpen)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="text-lg font-semibold">
                  Seznam pesmi ({songs.length})
                </span>
              </div>
              <svg
                className={`w-6 h-6 chevron ${isListOpen ? 'open' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Accordion Content */}
            <div className={`accordion-content ${isListOpen ? 'open' : ''}`}>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : songs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Nobena pesem ni bila najdena
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {songs.map((song, index) => (
                      <li key={song.id}>
                        <button
                          onClick={() => loadSong(song.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                            selectedSong?.id === song.id
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-800 dark:text-purple-200'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-xs text-gray-400 w-8">{index + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{song.title}</div>
                            {song.author && song.author !== 'Unbekannt' && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {song.author}
                              </div>
                            )}
                          </div>
                          {selectedSong?.id === song.id && (
                            <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Song-Text */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-h-[70vh] overflow-y-auto">
            {loadingSong ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : selectedSong ? (
              <div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedSong.title}
                  </h2>
                  {selectedSong.author && selectedSong.author !== 'Unbekannt' && (
                    <p className="text-purple-500 dark:text-purple-400">
                      {selectedSong.author}
                    </p>
                  )}
                </div>
                <div className="space-y-1 leading-relaxed">
                  {selectedSong.lines.map((line, index) => (
                    <p
                      key={index}
                      className={`text-gray-700 dark:text-gray-300 ${
                        line.song_text.trim() === '' ? 'h-6' : ''
                      }`}
                    >
                      {line.song_text || '\u00A0'}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <div className="relative inline-block">
                  <svg
                    className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs animate-bounce">
                    ?
                  </div>
                </div>
                <p className="text-lg font-medium mb-2">Izberi pesem</p>
                <p className="text-sm">Odpri seznam in izberi pesem za prikaz besedila</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MyFooter />
    </div>
  );
}
