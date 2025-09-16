'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import MessageList from '@/components/MessageList'
import VerixaLogo from '@/components/VerixaLogo'
import { Message } from '@/types'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: query,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Add frontend timeout to prevent stuck loading (45 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort('Frontend timeout: 45 seconds exceeded')
        console.log('🚨 Frontend timeout: Request took too long')
      }, 45000) // 45 seconds timeout

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 499) {
          throw new Error('Request was cancelled')
        }
        throw new Error('Search failed')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        sources: data.sources
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      // Only log unexpected errors, not timeout-related ones
      if (error.name !== 'AbortError') {
        console.error('Search error:', error)
      }
      
      let errorContent = 'Sorry, I encountered an error while searching. Please try again.'
      
      if (error.name === 'AbortError') {
        errorContent = '⏰ The request is taking longer than expected. This might be due to high server load. Please try again with a simpler query or wait a moment.'
      } else if (error.message?.includes('timeout')) {
        errorContent = '⏰ The search timed out. Please try again with a more specific query.'
      } else if (error.message?.includes('cancelled')) {
        errorContent = '🚫 The request was cancelled due to timeout. Please try again with a simpler query.'
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <VerixaLogo />
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 tracking-tight">
            Verixa AI
          </h1>
          <p className="text-xl text-blue-100 mb-2 font-light">
            Your Next-Generation AI Search Assistant
          </p>
          <p className="text-sm text-blue-300 opacity-80">
            Powered by Advanced Machine Learning & Real-time Web Intelligence
          </p>
        </div>
        
        {messages.length === 0 && (
          <div className="mb-8">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        )}
        
        {messages.length > 0 && (
          <>
            <div className="mt-12 mb-8">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
            <div className="sticky bottom-4 z-20">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </>
        )}
        
        {messages.length === 0 && (
          <div className="text-center mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-white font-semibold mb-2">Smart Search</h3>
                <p className="text-blue-200 text-sm">Advanced AI-powered search with real-time web crawling</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
                <p className="text-blue-200 text-sm">Get instant, accurate responses with source citations</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="text-white font-semibold mb-2">AI Intelligence</h3>
                <p className="text-blue-200 text-sm">Contextual understanding with multi-source analysis</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Developer Credit */}
        <div className="text-center mt-16 pb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 max-w-md mx-auto">
            <p className="text-blue-200 text-sm mb-1">Developed with ❤️ by</p>
            <p className="text-white font-semibold text-lg">Kamal Sharma</p>
            <p className="text-blue-300 text-xs opacity-80 mt-1">AI Engineer & Full Stack Developer</p>
          </div>
        </div>
      </div>
    </main>
  )
}