'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Video,
  Palette,
  Film,
  Megaphone,
  Bell,
  FileText,
  Mic,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useGateway } from '@/lib/gateway/useGateway';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ChatSidebar } from '@/components/ChatSidebar';
import { CapabilityCard } from '@/components/CapabilityCard';

interface ChatClientProps {
  userEmail: string;
  userId: string;
}

const CAPABILITY_CATEGORIES = [
  {
    id: 'image',
    icon: Palette,
    title: 'Image Creation',
    description: 'Generate & edit images',
    color: '#be1e2c',
    suggestions: [
      'Draw a cat wearing sunglasses',
      'Change this image background to a beach',
      'Generate a minimalist logo for a coffee shop',
    ],
  },
  {
    id: 'video-post',
    icon: Video,
    title: 'Video Post',
    description: 'AE & Premiere Pro',
    color: '#e20613',
    suggestions: [
      'How to write AE loop expression',
      'Export 4K ProRes from Premiere',
      'Best HDR color grading workflow',
      'Fix render stuck at certain percentage',
    ],
  },
  {
    id: 'video-tools',
    icon: Film,
    title: 'Video Tools',
    description: 'Download & subtitles',
    color: '#cd2e26',
    suggestions: [
      'Download this YouTube video',
      'Generate Chinese subtitles for video',
      'What does this video talk about',
      'Extract frame at 30 seconds',
    ],
  },
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'Marketing',
    description: 'Copywriting & SEO',
    color: '#be1e2c',
    suggestions: [
      'Write product copy for this item',
      'SEO optimization suggestions',
      'Write a high-converting CTA',
    ],
  },
  {
    id: 'reminders',
    icon: Bell,
    title: 'Reminders',
    description: 'Personal task management',
    color: '#e20613',
    suggestions: [
      'Remind me in 10 minutes to join the meeting',
      'Tomorrow 3pm remind me to export project',
      'List my reminders',
    ],
  },
  {
    id: 'summarize',
    icon: FileText,
    title: 'Summarize',
    description: 'URLs, PDFs & videos',
    color: '#cd2e26',
    suggestions: [
      'Summarize this link',
      'What does this PDF say',
      'Just send any URL to summarize',
    ],
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Voice',
    description: 'Speech to text',
    color: '#be1e2c',
    suggestions: ['Send voice message for auto transcription'],
  },
  {
    id: 'more',
    icon: MoreHorizontal,
    title: 'More Tools',
    description: 'Weather, social & more',
    color: '#64748b',
    suggestions: [
      'Weather in London',
      'Post a tweet',
      'What issues are in this GitHub repo',
    ],
  },
];

const QUICK_SUGGESTIONS = [
  { icon: Palette, text: 'Draw a cat wearing sunglasses', color: '#be1e2c' },
  { icon: Video, text: 'How to write AE loop expression', color: '#e20613' },
  { icon: Film, text: 'Download this YouTube video', color: '#cd2e26' },
  { icon: Bell, text: 'Remind me in 10 min to join meeting', color: '#be1e2c' },
  { icon: FileText, text: 'Summarize this link', color: '#e20613' },
  { icon: Megaphone, text: 'Write product copy for this', color: '#cd2e26' },
];

export function ChatClient({ userEmail, userId }: ChatClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const lastStreamLengthRef = useRef(0);

  const {
    messages,
    sessions,
    currentSessionKey,
    mainSessionKey,
    isConnected,
    isLoading,
    error,
    streamingContent,
    isSidebarOpen,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession,
    toggleSidebar,
    abortChat,
  } = useGateway({ userId });

  const allSuggestions = useMemo(() => {
    return CAPABILITY_CATEGORIES.flatMap((cat) => cat.suggestions);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    isAutoScrollRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 80;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isAutoScrollRef.current = distanceFromBottom < threshold;
  }, []);

  useEffect(() => {
    const hasNewMessage = messages.length > lastMessageCountRef.current;
    const streamLength = streamingContent.length;
    const streamingGrowing = streamLength > lastStreamLengthRef.current;

    if (hasNewMessage) {
      scrollToBottom('smooth');
    } else if (streamingGrowing && isAutoScrollRef.current) {
      scrollToBottom('auto');
    }

    lastMessageCountRef.current = messages.length;
    lastStreamLengthRef.current = streamLength;
  }, [messages.length, streamingContent, scrollToBottom]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * allSuggestions.length);
    sendMessage(allSuggestions[randomIndex]);
  };

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex flex-col h-screen bg-[var(--fc-off-white)]">
      <Header userName={userEmail} onLogout={handleLogout} />

      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          currentSessionKey={currentSessionKey}
          mainSessionKey={mainSessionKey}
          isOpen={isSidebarOpen}
          onNewSession={createNewSession}
          onSelectSession={switchSession}
          onDeleteSession={deleteSession}
          onToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="max-w-3xl mx-auto px-4 py-4 transition-all duration-300">
              {isEmpty ? (
                <motion.div
                  className="text-center py-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] mx-auto mb-5 flex items-center justify-center shadow-lg"
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                  >
                    <Bot size={36} className="text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-[var(--fc-black)] mb-3">
                    Hey! I&apos;m your unpaid intern.
                  </h2>
                  <p className="text-[var(--fc-body-gray)] max-w-md mx-auto mb-2">
                    24/7 availability is expected. No salary, but endless enthusiasm.
                  </p>
                  <p className="text-xs text-[var(--fc-light-gray)] mb-8">
                    Powered by Clawdbot
                  </p>

                  <div className="mb-8">
                    <p className="text-sm font-medium text-[var(--fc-body-gray)] mb-4">
                      Here&apos;s what I can help you with:
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
                      {CAPABILITY_CATEGORIES.map((category, index) => (
                        <CapabilityCard
                          key={category.id}
                          icon={category.icon}
                          title={category.title}
                          description={category.description}
                          color={category.color}
                          index={index}
                          onClick={() =>
                            handleSuggestionClick(category.suggestions[0])
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[var(--fc-body-gray)] mb-4">
                      Quick start:
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto mb-4">
                      {QUICK_SUGGESTIONS.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-[var(--fc-border-gray)] rounded-full text-sm hover:border-[var(--fc-action-red)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all group"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.35 + i * 0.06 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <suggestion.icon
                            size={14}
                            style={{ color: suggestion.color }}
                          />
                          <span className="text-[var(--fc-body-gray)] group-hover:text-[var(--fc-black)] transition-colors">
                            {suggestion.text}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      onClick={handleSurpriseMe}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] text-white rounded-full text-sm font-medium shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-shadow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles size={16} />
                      Surprise Me
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      content={message.content}
                      role={message.role}
                      timestamp={message.timestamp}
                    />
                  ))}

                  {streamingContent && (
                    <ChatMessage content={streamingContent} role="assistant" />
                  )}

                  {isLoading && !streamingContent && (
                    <motion.div
                      className="flex items-center gap-3 text-[var(--fc-body-gray)] text-sm mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 bg-[var(--fc-action-red)] rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                      <span>Thinking...</span>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <ChatInput
            onSend={sendMessage}
            onAbort={abortChat}
            disabled={isLoading || !isConnected}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}
