'use client'

import { useState, useEffect } from 'react'

export default function LoadingMessage() {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState('Searching...')

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsed(currentElapsed)
      
      // Update status based on elapsed time
      if (currentElapsed < 5) {
        setStatus('Searching the web...')
      } else if (currentElapsed < 15) {
        setStatus('Processing results...')
      } else if (currentElapsed < 25) {
        setStatus('Generating response...')
      } else if (currentElapsed < 35) {
        setStatus('Almost ready...')
      } else {
        setStatus('Taking longer than usual...')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-4xl">
        <div className="px-8 py-6 rounded-3xl bg-white/10 border border-white/20 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-md animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-base font-medium">Verixa is thinking...</span>
              <span className="text-blue-200/70 text-xs mt-1">{status}</span>
              <span className="text-blue-300/50 text-xs mt-1">{elapsed}s elapsed</span>
            </div>
            <div className="ml-auto">
              <div className="w-6 h-6 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full transition-all duration-1000" 
              style={{width: `${Math.min(elapsed * 2.5, 100)}%`}}
            ></div>
          </div>
          {elapsed > 30 && (
            <div className="mt-3 text-yellow-300/80 text-xs flex items-center">
              <span className="mr-2">⚠️</span>
              <span>This is taking longer than usual. The system will timeout at 45 seconds.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}