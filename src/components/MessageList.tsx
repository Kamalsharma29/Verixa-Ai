'use client'

import { Message } from '@/types'
import MessageBubble from './MessageBubble'
import LoadingMessage from './LoadingMessage'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <LoadingMessage />}
    </div>
  )
}