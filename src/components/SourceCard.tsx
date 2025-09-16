'use client'

import { Source } from '@/types'

interface SourceCardProps {
  source: Source
}

export default function SourceCard({ source }: SourceCardProps) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm group hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=32`}
            alt="Favicon"
            className="w-5 h-5 flex-shrink-0 rounded-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white group-hover:text-blue-200 truncate transition-colors duration-200">
            {source.title}
          </p>
          <div className="flex items-center mt-1">
            <svg className="w-3 h-3 mr-1 text-blue-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-xs text-blue-300/70 group-hover:text-blue-200/80 truncate transition-colors duration-200">
              {new URL(source.url).hostname}
            </p>
          </div>
        </div>
        <svg className="w-4 h-4 text-blue-300/50 group-hover:text-blue-200 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}