'use client'

import { Message } from '@/types'
import ReactMarkdown from 'react-markdown'
import SourceCard from './SourceCard'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-4xl ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-8 py-6 rounded-3xl shadow-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] ${
            isUser
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ml-auto border-purple-300/30'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
          }`}
        >
          {isUser ? (
            <p className="text-lg font-medium">{message.content}</p>
          ) : (
            <div className="prose prose-lg max-w-none prose-invert">
              <ReactMarkdown 
                components={{
                  p: ({children}) => <p className="text-white mb-4 leading-relaxed">{children}</p>,
                  h1: ({children}) => <h1 className="text-white text-2xl font-bold mb-4">{children}</h1>,
                  h2: ({children}) => <h2 className="text-white text-xl font-semibold mb-3">{children}</h2>,
                  h3: ({children}) => <h3 className="text-white text-lg font-medium mb-2">{children}</h3>,
                  ul: ({children}) => <ul className="text-white list-disc list-inside mb-4 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="text-white list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                  li: ({children}) => <li className="text-blue-100">{children}</li>,
                  code: ({children}) => <code className="bg-black/30 text-blue-200 px-2 py-1 rounded font-mono text-sm">{children}</code>,
                  pre: ({children}) => <pre className="bg-black/30 text-blue-200 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-blue-200 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Sources:
            </h4>
            <div className="grid gap-3">
              {message.sources.map((source, index) => (
                <SourceCard key={index} source={source} />
              ))}
            </div>
          </div>
        )}
        
        <div className={`text-xs text-blue-300/70 mt-3 flex items-center ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}