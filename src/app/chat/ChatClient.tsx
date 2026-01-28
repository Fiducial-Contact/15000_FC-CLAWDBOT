'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
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
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useGateway } from '@/lib/gateway/useGateway';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ChatSidebar } from '@/components/ChatSidebar';
import { CapabilityCard } from '@/components/CapabilityCard';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { ToolCard } from '@/components/ToolCard';
import type { ChatAttachmentInput } from '@/lib/gateway/types';

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
    description: 'Task management',
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
    isDraftSession,
    activeTools,
    retryFileAttachment,
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
    const threshold = 100;
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

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage({ text });
  };

  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * allSuggestions.length);
    handleSuggestionClick(allSuggestions[randomIndex]);
  };

  const isEmpty = (messages.length === 0 && !streamingContent) || isDraftSession;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[var(--fc-off-white)] to-white">
      <Header
        userName={userEmail}
        onLogout={handleLogout}
        onChangePassword={() => setIsPasswordModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          currentSessionKey={currentSessionKey}
          mainSessionKey={mainSessionKey}
          isOpen={isSidebarOpen}
          onNewSession={() => {
            createNewSession();
          }}
          onSelectSession={switchSession}
          onDeleteSession={deleteSession}
          onToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-hidden flex flex-col relative">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800"
              >
                <AlertCircle size={16} className="flex-shrink-0 text-amber-600" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-smooth"
            onScroll={handleScroll}
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              {isEmpty ? (
                <motion.div
                  className="min-h-[calc(100vh-280px)] flex flex-col justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Hero Section */}
                  <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] mx-auto mb-6 flex items-center justify-center shadow-xl"
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <Bot size={40} className="text-white" />
                    </motion.div>

                    {/* 主标题 */}
                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--fc-black)] mb-3 tracking-tight">
                      Hey! I'm Haiweis unpaid intern.
                    </h1>

                    {/* 副标题 */}
                    <p className="text-[var(--fc-body-gray)] max-w-md mx-auto mb-3 text-base leading-relaxed">
                      24/7 availability is expected. No salary, but endless enthusiasm.
                    </p>

                    {/* 品牌标识 */}
                    <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--fc-light-gray)]">
                      <Zap size={12} />
                      <span>Powered by Fiducial AI</span>
                    </div>
                  </motion.div>

                  {/* Capability Bento Grid */}
                  <div className="mb-8">
                    <p className="text-[15px] font-semibold tracking-tight text-[var(--fc-body-gray)] mb-4 text-center font-[family-name:var(--font-manrope)]">
                      Here's what I can help you with:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {CAPABILITY_CATEGORIES.map((category, index) => (
                        <CapabilityCard
                          key={category.id}
                          icon={category.icon}
                          title={category.title}
                          description={category.description}
                          color={category.color}
                          delay={index * 0.05}
                          onClick={() =>
                            handleSuggestionClick(category.suggestions[0])
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Suggestions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <p className="text-[15px] font-semibold tracking-tight text-[var(--fc-body-gray)] mb-4 text-center font-[family-name:var(--font-manrope)]">
                      Quick start:
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto mb-6">
                      {QUICK_SUGGESTIONS.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--fc-border-gray)] rounded-full text-sm hover:border-[var(--fc-action-red)] hover:shadow-md transition-all group"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.05 }}
                          whileHover={{ scale: 1.03 }}
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
                      className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-shadow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles size={16} />
                      Surprise Me
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="space-y-2 pb-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      messageId={message.id}
                      content={message.content}
                      blocks={message.blocks}
                      attachments={message.attachments}
                      role={message.role}
                      timestamp={message.timestamp}
                      onRetryAttachment={retryFileAttachment}
                    />
                  ))}

                  {streamingContent && (
                    <ChatMessage
                      messageId="stream"
                      content={streamingContent}
                      role="assistant"
                    />
                  )}

                  {activeTools.size > 0 && (
                    <motion.div
                      className="space-y-2 pl-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {Array.from(activeTools.values()).map((tool) => (
                        <ToolCard
                          key={tool.toolCallId}
                          toolName={tool.toolName}
                          parameters={tool.parameters}
                          result={tool.output}
                          status={tool.phase === 'end' ? (tool.error ? 'failed' : 'completed') : 'running'}
                          error={tool.error}
                          isStreaming={tool.phase !== 'end'}
                        />
                      ))}
                    </motion.div>
                  )}

                  {isLoading && !streamingContent && (
                    <motion.div
                      className="flex items-center gap-3 text-[var(--fc-body-gray)] pl-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </motion.div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <ChatInput
            onSend={(message: string, attachments: ChatAttachmentInput[]) =>
              sendMessage({ text: message, attachments })
            }
            onAbort={abortChat}
            disabled={isLoading || !isConnected}
            isLoading={isLoading}
          />
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
