import OpenAI from 'openai'
import { EmbeddingResult } from '@/types'

// Initialize OpenAI only if API key is available
let openai: OpenAI | null = null

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  try {
    if (!openai) {
      // Return mock embeddings when OpenAI is not available
      return texts.map(text => ({
        text,
        embedding: Array.from({ length: 1536 }, () => Math.random() - 0.5) // Mock 1536-dimensional embedding
      }))
    }

    const results: EmbeddingResult[] = []
    
    // Process texts in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: batch,
      })

      for (let j = 0; j < batch.length; j++) {
        results.push({
          text: batch[j],
          embedding: response.data[j].embedding
        })
      }
    }

    return results
  } catch (error) {
    console.error('Embedding generation error:', error)
    // Return mock embeddings on error
    return texts.map(text => ({
      text,
      embedding: Array.from({ length: 1536 }, () => Math.random() - 0.5)
    }))
  }
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    if (!openai) {
      // Return mock query embedding when OpenAI is not available
      return Array.from({ length: 1536 }, () => Math.random() - 0.5)
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Query embedding generation error:', error)
    // Return mock query embedding on error
    return Array.from({ length: 1536 }, () => Math.random() - 0.5)
  }
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}