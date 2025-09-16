'use client'

export default function VerixaLogo() {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative group">
        {/* Outer glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
        
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500"
        >
          {/* Outer circle with enhanced gradient */}
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="url(#enhancedGradient)"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
            className="animate-pulse"
          />
          
          {/* Inner geometric design */}
          <g className="animate-pulse" style={{animationDelay: '0.5s'}}>
            <path
              d="M35 45 L60 75 L85 45 M35 75 L60 45 L85 75"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </g>
          
          {/* Center orb with glow */}
          <circle cx="60" cy="60" r="5" fill="white" className="animate-pulse" style={{animationDelay: '1s'}} />
          <circle cx="60" cy="60" r="8" fill="white" opacity="0.3" className="animate-ping" />
          
          {/* Enhanced gradient definitions */}
          <defs>
            <linearGradient id="enhancedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="25%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="75%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="50%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Multiple animated rings */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-20"></div>
        <div className="absolute inset-2 rounded-full border border-blue-300 animate-ping opacity-15" style={{animationDelay: '1s'}}></div>
        <div className="absolute inset-4 rounded-full border border-indigo-300 animate-ping opacity-10" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  )
}