# Verixa AI - Intelligent Search Assistant

🚀 **Verixa AI** is a modern, intelligent search assistant built with Next.js that provides comprehensive answers by combining web search results with AI-powered analysis.

## ✨ Features

- **🔍 Smart Search**: Advanced web search capabilities with real-time results
- **🤖 AI-Powered Responses**: Intelligent analysis and summarization using Google's Gemini AI
- **📱 Modern UI**: Clean, responsive interface built with Tailwind CSS
- **⚡ Fast Performance**: Optimized Next.js application with server-side rendering
- **🔗 Source Citations**: Transparent source linking for all search results
- **💬 Interactive Chat**: Conversational interface for natural interactions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API
- **Search**: SerpAPI for web search results
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Google Gemini API key
- SerpAPI key (optional, for enhanced search)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kamalsharma29/Verixa-Ai.git
   cd Verixa-Ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SERPAPI_KEY=your_serpapi_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### API Keys Setup

1. **Google Gemini API**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env.local` file

2. **SerpAPI** (Optional):
   - Sign up at [SerpAPI](https://serpapi.com/)
   - Get your API key from the dashboard
   - Add it to your `.env.local` file

## 📁 Project Structure

```
Verixa-Ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── search/          # API endpoints
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── LoadingMessage.tsx  # Loading component
│   │   ├── MessageBubble.tsx   # Chat message component
│   │   ├── MessageList.tsx     # Message list container
│   │   ├── SearchBar.tsx       # Search input component
│   │   ├── SourceCard.tsx      # Source citation component
│   │   └── VerixaLogo.tsx      # Logo component
│   ├── lib/
│   │   ├── llm.ts             # Gemini AI integration
│   │   └── serpapi.ts         # Search API integration
│   └── types/
│       └── index.ts           # TypeScript definitions
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── .env.example               # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🎯 Usage

1. **Start a Search**: Type your question in the search bar
2. **Get AI Response**: Verixa AI will search the web and provide an intelligent summary
3. **View Sources**: Click on source cards to visit original websites
4. **Continue Conversation**: Ask follow-up questions for deeper insights

## 🚀 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Deploy on Other Platforms

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kamal Sharma**
- GitHub: [@Kamalsharma29](https://github.com/Kamalsharma29)

## 🙏 Acknowledgments

- Google Gemini AI for powerful language processing
- SerpAPI for reliable search results
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling

---

⭐ **Star this repository if you found it helpful!**