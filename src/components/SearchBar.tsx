'use client'

import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query.trim())
      setQuery('')
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="relative group">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-2 shadow-2xl z-10 hover:bg-white/15 transition-all duration-300">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Ask me anything... 🤖✨"
              disabled={isLoading}
              autoComplete="off"
              autoFocus
              className="flex-1 px-6 py-4 pr-32 text-lg bg-transparent text-white placeholder-blue-200/80 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-light tracking-wide resize-none overflow-hidden focus:placeholder-blue-100 transition-colors duration-300"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
            <button
              type="submit"
              onClick={handleButtonClick}
              disabled={!query.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2.5 rounded-full transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 font-medium text-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Search</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Subtle animated border */}
        <div className="absolute inset-0 rounded-full border border-white/30 animate-pulse opacity-50 pointer-events-none"></div>
      </div>
      
      {/* Quick suggestions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setQuery('What is artificial intelligence?')}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white rounded-full text-sm transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 shadow-md hover:shadow-lg backdrop-blur-sm"
        >
          💡 What is AI?
        </button>
        <button
          type="button"
          onClick={() => setQuery('Latest technology trends 2024')}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white rounded-full text-sm transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 shadow-md hover:shadow-lg backdrop-blur-sm"
        >
          📈 Tech Trends
        </button>
        <button
          type="button"
          onClick={() => setQuery('How does machine learning work?')}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white rounded-full text-sm transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 shadow-md hover:shadow-lg backdrop-blur-sm"
        >
          🧠 Machine Learning
        </button>
      </div>
    </form>
  )
}