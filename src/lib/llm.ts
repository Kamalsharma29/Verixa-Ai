import OpenAI from 'openai'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { HfInference } from '@huggingface/inference'

// Initialize AI clients only if API keys are available
let openai: OpenAI | null = null
let gemini: GoogleGenerativeAI | null = null
let hf: HfInference | null = null

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

if (process.env.HUGGINGFACE_API_TOKEN) {
  hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN)
}

export async function generateResponse(
  query: string,
  context: string,
  sources: Array<{ title: string; url: string }>
): Promise<string> {
  console.log('🔍 Starting response generation for query:', query.substring(0, 50) + '...')
  console.log('🔧 Available AI services:', {
    openai: !!openai,
    gemini: !!gemini,
    huggingface: !!hf
  })
  
  // Global timeout wrapper to prevent infinite thinking
  return Promise.race([
    generateResponseInternal(query, context, sources),
    new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error('Response generation timeout after 30 seconds')), 30000)
    )
  ]).catch(error => {
    console.error('❌ Response generation failed:', error)
    return `I apologize, but I'm experiencing some technical difficulties right now. Here's what I found from the search results:\n\n${context.substring(0, 300)}...\n\nPlease try asking your question again, or check the sources below for more information.`
  })
}

async function generateResponseInternal(
  query: string,
  context: string,
  sources: Array<{ title: string; url: string }>
): Promise<string> {
  
  try {
    // Emergency quick response for very simple queries (bypass AI entirely)
    const quickPatterns = {
      'what is ai': 'AI (Artificial Intelligence) is technology that enables machines to perform tasks that typically require human intelligence, such as learning, reasoning, and problem-solving.',
      'what is artificial intelligence': 'Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence.',
      'hello': 'Hello! I\'m Verixa AI, your intelligent search assistant. How can I help you today?',
      'hi': 'Hi there! I\'m here to help you find information and answer your questions. What would you like to know?',
      'help': 'I can help you search for information, answer questions, and provide detailed explanations on various topics. Just ask me anything!'
    }
    
    const lowerQuery = query.toLowerCase().trim()
     if (quickPatterns[lowerQuery as keyof typeof quickPatterns]) {
       console.log('⚡ Using emergency quick response')
       return quickPatterns[lowerQuery as keyof typeof quickPatterns]
     }
     
     // Quick response for simple queries to prevent thinking loops
    
    // Immediate response for very simple queries
    if (lowerQuery.length < 3) {
      return "Could you please provide a more detailed question? I'm here to help!"
    }
    
    // Smart greeting detection system
    
    // Common greeting patterns
    const greetingPatterns = {
      // English greetings
      'hi': "Hi! How's it going?",
      'hello': "Hello! How are you doing today?",
      'hey': "Hey there! What's up?",
      'good morning': "Good morning! Hope you're having a great day!",
      'good afternoon': "Good afternoon! How's your day going?",
      'good evening': "Good evening! How was your day?",
      'how are you': "I'm doing great! How about you?",
      'whats up': "Not much, just here to help! What's on your mind?",
      'sup': "Hey! What's going on?",
      
      // Hindi greetings
      'namaste': "Namaste! Kaise hain aap?",
      'kaise ho': "Main theek hoon! Tum kaise ho?",
      'kaise ho dost': "Main bilkul theek hoon dost! Tum batao, kya haal hai?",
      'kya haal hai': "Sab badhiya hai! Tumhara kya haal?",
      'adab': "Adab! Kaise hain aap?",
      'sat sri akal': "Sat Sri Akal! Kaise ho ji?",
      'ram ram': "Ram Ram! Kaise hain?",
      'jai hind': "Jai Hind! Kaise ho bhai?",
      
      // Casual variations
      'yo': "Yo! What's happening?",
      'wassup': "What's up! How's it going?",
      'howdy': "Howdy! Nice to see you!",
      'hola': "Hola! ¿Cómo estás?"
     }
     
     // Common question patterns that should get direct answers
     const questionPatterns = {
       'ai ke bare mai btao': "AI (Artificial Intelligence) ek advanced technology hai jo machines ko human-like intelligence deti hai. Ye machine learning, deep learning, aur neural networks ka use karke complex problems solve karti hai. AI aaj kal har field mein use ho raha hai - healthcare, education, business, entertainment, aur daily life mein.",
       'ai kya hai': "AI matlab Artificial Intelligence hai - ye ek technology hai jo computers ko insaan ki tarah sochne aur decisions lene ki capability deti hai.",
       'artificial intelligence kya hai': "Artificial Intelligence ek computer science field hai jo machines ko intelligent behavior sikhane par focus karti hai. Isme machine learning, robotics, aur cognitive computing shamil hai.",
       'machine learning kya hai': "Machine Learning AI ka ek part hai jisme computers data se automatically learn karte hain bina explicitly programmed hue. Ye patterns identify karke predictions banata hai."
     }
     
     // Check for exact matches first
    if (greetingPatterns[lowerQuery as keyof typeof greetingPatterns]) {
      return greetingPatterns[lowerQuery as keyof typeof greetingPatterns]
    }
     
     // Check for question patterns
    if (questionPatterns[lowerQuery as keyof typeof questionPatterns]) {
      return questionPatterns[lowerQuery as keyof typeof questionPatterns]
    }
     
     // Check for partial matches (contains greeting words)
     for (const [pattern, response] of Object.entries(greetingPatterns)) {
       if (lowerQuery.includes(pattern) && lowerQuery.length <= pattern.length + 10) {
         return response
       }
     }
     
     // Check for partial question matches
     for (const [pattern, response] of Object.entries(questionPatterns)) {
       if (lowerQuery.includes(pattern.split(' ')[0]) && lowerQuery.includes('ai')) {
         return response
       }
     }
    // Add circuit breaker to prevent repeated failures
    const maxRetries = 2
    let lastError: Error | null = null
    
    // Try OpenAI first if available (fastest and most reliable)
    if (openai) {
      console.log('🤖 Trying OpenAI API...')
      // Check if this is a weather query for OpenAI as well
      const isWeatherQuery = /weather|temperature|forecast|climate|rain|sunny|cloudy|humid|wind|°|degrees/i.test(query)
      
      const systemContent = isWeatherQuery ?
        `You are Verixa AI, a weather information specialist. Provide clear, structured weather information:

🌤️ **WEATHER RESPONSE STANDARDS:**
• **Location First**: Always start with the location name
• **Current Conditions**: Provide current temperature and weather conditions
• **Structured Format**: Use consistent formatting for weather data
• **Complete Information**: Include temperature, conditions, humidity, wind when available
• **Brief & Clear**: Keep responses concise but informative

**Format Example:**
**Weather in [Location]**
• **Temperature**: [Current temp] (Feels like [feels like temp])
• **Conditions**: [Weather description]
• **Details**: Humidity [%], Wind [speed], Visibility [distance]
• **Forecast**: [Brief upcoming weather if available]` :
        `You are Verixa AI, an expert AI assistant that provides concise, accurate responses. Follow these guidelines:

🎯 **RESPONSE STANDARDS:**
• **Direct Answer First**: Start with a clear, direct answer
• **Factually Accurate**: Base information strictly on provided context
• **Well-Structured**: Use bullet points and clear formatting
• **Concise**: Keep responses focused and relevant
• **Professional**: Maintain an informative yet accessible tone`
      
      try {
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: process.env.CHAT_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemContent },
              { role: 'user', content: `Context: ${context}\n\nQuestion: ${query}\n\nSources: ${sources.map(s => `${s.title} (${s.url})`).join(', ')}` }
            ],
            max_tokens: parseInt(process.env.MAX_TOKENS || '1500'),
            temperature: parseFloat(process.env.TEMPERATURE || '0.3'),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenAI API timeout')), 15000)
          )
        ]) as any
        
        const response = completion.choices[0]?.message?.content
        if (response && response.trim().length > 0) {
          console.log('✅ OpenAI response generated successfully')
          return response
        } else {
          console.log('⚠️ OpenAI returned empty response')
        }
      } catch (openaiError: any) {
        console.error('❌ OpenAI API error:', openaiError.message || openaiError)
        console.log('⚠️ OpenAI failed, trying Gemini next...')
      }
    }
    
    // Try Gemini as secondary option if available
    if (gemini) {
      console.log('🧠 Trying Gemini API...')
      try {
        const model = gemini.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        })
        
        // Check if this is a weather query
        const isWeatherQuery = /weather|temperature|forecast|climate|rain|sunny|cloudy|humid|wind|°|degrees/i.test(query)
        
        const prompt = isWeatherQuery ? 
        `You are Verixa AI, a weather information specialist. Provide clear, structured weather information:

🌤️ **WEATHER RESPONSE FORMAT:**
1. **Location & Current Conditions**: Start with location and current weather
2. **Temperature Details**: Include actual temperature and feels-like if available
3. **Weather Conditions**: Describe current conditions (sunny, cloudy, rainy, etc.)
4. **Additional Details**: Include humidity, wind, visibility, UV index if available
5. **Forecast**: Add brief forecast information if available

📊 **STRUCTURE YOUR RESPONSE:**
- **Location**: Weather in [City Name]
- **Temperature**: Current temperature and feels-like temperature
- **Conditions**: Current weather conditions
- **Details**: Humidity, wind speed, visibility, UV index
- **Forecast**: Brief upcoming weather if available

❓ **Weather Query:** ${query}
📚 **Weather Data:** ${context}

**Instructions:** Extract and present weather information in a clear, structured format. If specific data is missing, mention what information is not available. Focus on providing actionable weather information.` :
        `You are Verixa AI, an expert AI assistant that provides concise, accurate, and well-structured responses. Your goal is to deliver high-quality answers that are:

🎯 **RESPONSE REQUIREMENTS:**
1. **Direct & Concise**: Start with a clear, direct answer (1-2 sentences)
2. **Factually Accurate**: Base all information strictly on the provided context
3. **Well-Structured**: Use bullet points and clear formatting for readability
4. **Relevant Only**: Include only information directly related to the question
5. **Professional**: Maintain an informative yet accessible tone
6. **Avoid Redundancy**: Don't repeat information or add unnecessary details

📝 **FORMATTING RULES:**
- **Start with the main answer first**
- Use **bold** for key terms and important points
- Use bullet points (•) for lists and key facts
- Keep paragraphs short (2-3 sentences max)
- Avoid lengthy explanations unless specifically asked
- Don't include promotional or marketing language

❓ **User Question:** ${query}
📚 **Context:** ${context}

**Instructions:** Provide a direct, concise answer based strictly on the context. Focus on answering the specific question asked without adding unnecessary background information or lengthy explanations.`
        
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout after 12 seconds')), 12000)
          )
        ]) as any
        const response = result.response
        const text = response.text()
         if (text && text.trim().length > 0) {
            console.log('✅ Gemini response generated successfully')
            return text
          } else {
            console.log('⚠️ Gemini returned empty response')
          }
      } catch (geminiError: any) {
        console.error('❌ Gemini API error:', geminiError.message || geminiError)
        console.log('⚠️ Gemini failed, trying Hugging Face as last resort...')
      }
    }
    
    // Fallback to Hugging Face if available (last resort)
    if (hf) {
      console.log('🤗 Trying Hugging Face as final fallback...')
      try {
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('HuggingFace API timeout')), 10000)
        )
        
        const hfPrompt = `Context: ${context}\n\nQuestion: ${query}\n\nAnswer:`
        
        const apiPromise = hf.textGeneration({
          model: 'microsoft/DialoGPT-small',
          inputs: hfPrompt,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.5,
            do_sample: true,
            return_full_text: false,
          },
        })
        
        const response = await Promise.race([apiPromise, timeoutPromise]) as any
        
        return response.generated_text || 'I apologize, but I could not generate a response.'
      } catch (hfError: any) {
        console.error('❌ Hugging Face API error:', hfError.message || hfError)
        console.log('💥 All AI services failed, using fallback response')
      }
    }
    
    // Enhanced fallback response when no AI service is available
    console.log('🔄 Using enhanced fallback response')
    
    if (context && context.length > 100) {
      return `I found relevant information about "${query}" from ${sources.length} sources:\n\n${context.substring(0, 400)}...\n\n**Sources:**\n${sources.slice(0, 3).map(s => `• ${s.title}`).join('\n')}\n\nWould you like me to search for more specific information?`
    } else {
      return `I searched for "${query}" but couldn't generate a detailed response right now. However, I found ${sources.length} relevant sources that might help answer your question. Please try rephrasing your query or ask something more specific.`
    }
    
  } catch (error) {
    console.error('LLM generation error:', error)
    
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('exceeded')) {
      return `I'm currently experiencing high demand. Please try again in a few moments. Here's what I found from the search results:\n\n${context.substring(0, 400)}...\n\nPlease check the sources below for more detailed information.`
    }
    
    if (errorMessage.includes('rate limit')) {
      return 'I\'m currently experiencing high demand. Please try again in a few moments, or consider upgrading your API plan for better availability.'
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('key')) {
      return `I'm having some technical difficulties. Here's what I found from the search results:\n\n${context.substring(0, 400)}...\n\nPlease check the sources below for more information.`
    }
    
    return 'I apologize, but I encountered an error while processing your request. Please try again later.'
  }
}

export async function summarizeContent(content: string, maxLength: number = 500): Promise<string> {
  try {
    // Check if OpenAI is available
    if (!openai) {
      return content.substring(0, maxLength)
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Summarize the following content in ${maxLength} characters or less. Focus on the key information and main points.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: Math.floor(maxLength / 3),
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || content.substring(0, maxLength)
  } catch (error) {
    console.error('Content summarization error:', error)
    return content.substring(0, maxLength)
  }
}