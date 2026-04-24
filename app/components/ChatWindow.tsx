import { useFetcher } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Send,
  X,
  Loader2,
  Settings2,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatWindowProps = {
  unitId: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: ChatMessage[];
};

export const ChatWindow = ({
  unitId,
  courseId,
  isOpen,
  onClose,
  initialMessages = [],
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<CurriculumAiProvider>(DEFAULT_CURRICULUM_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CURRICULUM_MODELS[DEFAULT_CURRICULUM_PROVIDER],
  );
  const chatFetcher = useFetcher();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = chatFetcher.state !== 'idle';

  const handleProviderChange = (provider: CurriculumAiProvider) => {
    setSelectedProvider(provider);
    setSelectedModel(DEFAULT_CURRICULUM_MODELS[provider]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatFetcher.state === 'idle' && chatFetcher.data) {
      const result = chatFetcher.data as {
        message?: ChatMessage;
        error?: string;
      };

      console.log("result", result)

      if (result.message) {
        setMessages((prev) => [...prev, result.message as ChatMessage]);
      } else if (result.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'We are experience high traffic at the moment please try again',
          },
        ]);
      }
      chatFetcher.reset();
    }
  }, [chatFetcher.state, chatFetcher.data]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    chatFetcher.submit(
      {
        message: userMessage.content,
        provider: selectedProvider,
        model: selectedModel,
      },
      {
        method: 'post',
        action: `/api/courses/${courseId}/units/${unitId}/chat`,
      },
    );
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className='fixed right-6 bottom-6 z-50 flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-2xl'
        >
          <div className='flex items-center justify-between border-b border-black/5 bg-[#faf9f4] px-5 py-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-[#5A5A40] text-white'>
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className='font-medium text-[#1a1a1a]'>Course Assistant</h3>
                <p className='text-xs text-black/45'>AI-powered help</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className='flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60'
                  title='Clear chat'
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${showSettings
                  ? 'bg-[#5A5A40] text-white'
                  : 'text-black/40 hover:bg-black/5 hover:text-black/60'
                  }`}
                title='Settings'
              >
                <Settings2 size={16} />
              </button>
              <button
                onClick={onClose}
                className='flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60'
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className='border-b border-black/5 bg-[#faf9f4] px-5 py-4'
              >
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1.5 block text-xs font-bold tracking-widest text-black/40 uppercase'>
                      AI Provider
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(event) =>
                        handleProviderChange(
                          event.target.value as CurriculumAiProvider,
                        )
                      }
                      className='w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-[#1a1a1a] outline-none focus:border-[#5A5A40]'
                    >
                      <option value='google'>Google</option>
                      <option value='groq'>Groq</option>
                    </select>
                  </div>
                  <div>
                    <label className='mb-1.5 block text-xs font-bold tracking-widest text-black/40 uppercase'>
                      Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      className='w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-[#1a1a1a] outline-none focus:border-[#5A5A40]'
                    >
                      {CURRICULUM_MODEL_OPTIONS[selectedProvider].map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='flex-1 overflow-y-auto p-4'>
            {messages.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center text-center'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
                  <MessageCircle size={24} />
                </div>
                <h4 className='mb-2 font-medium text-[#1a1a1a]'>
                  Ask about this unit
                </h4>
                <p className='max-w-xs text-sm text-black/45'>
                  I can help explain concepts from the course material. Ask me
                  anything related to this unit.
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                        ? 'bg-[#5A5A40] text-white'
                        : 'bg-[#f5f5f0] text-[#1a1a1a]'
                        }`}
                    >
                      {message.role === 'assistant' ? (
                        <Markdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >{message.content}</Markdown>
                      ) : (
                        <p className='text-sm'>{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className='flex justify-start'>
                    <div className='flex items-center gap-2 rounded-2xl bg-[#f5f5f0] px-4 py-3 text-black/40'>
                      <Loader2 size={16} className='animate-spin' />
                      <span className='text-sm'>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className='border-t border-black/5 p-4'>
            <div className='flex items-center gap-3'>
              <input
                type='text'
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder='Ask a question...'
                disabled={isLoading}
                className='flex-1 rounded-2xl border border-black/10 bg-[#faf9f4] px-4 py-3 text-sm text-[#1a1a1a] outline-none placeholder:text-black/30 focus:border-[#5A5A40] focus:bg-white disabled:opacity-50'
              />
              <button
                type='submit'
                disabled={isLoading || !input.trim()}
                className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5A5A40] text-white transition-colors hover:bg-[#4a4a35] disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? (
                  <Loader2 size={18} className='animate-spin' />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
