'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetConversationsQuery, useGetMessagesQuery, useSendMessageMutation } from '@/store/api/messagesApi';
import { useAppSelector } from '@/store';
import { formatRelativeTime } from '@/lib/utils';
import { Send, Search, MessageSquare, Loader2, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, isLoading: loadingConversations } = useGetConversationsQuery({});
  const { data: messagesData, isLoading: loadingMessages } = useGetMessagesQuery(
    { conversationId: selectedConversation! },
    { skip: !selectedConversation }
  );

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  const conversations = conversationsData?.data ?? [];
  const messages = messagesData?.data?.items ?? [];

  const filteredConversations = conversations.filter((c) =>
    conversationSearch
      ? `${c.otherUser?.firstName} ${c.otherUser?.lastName}`.toLowerCase().includes(conversationSearch.toLowerCase())
      : true
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;
    const text = messageText;
    setMessageText('');
    try {
      await sendMessage({ conversationId: selectedConversation, content: text }).unwrap();
    } catch {
      setMessageText(text);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingConversations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-nexus-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const isSelected = conv.id === selectedConversation;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left',
                    isSelected ? 'bg-nexus-50 dark:bg-nexus-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
                      {other?.avatar ? (
                        <img src={other.avatar} alt="" className="w-10 h-10 object-cover" />
                      ) : (
                        <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-sm">
                          {other?.firstName?.[0]}{other?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    {other?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn('text-sm font-medium truncate', isSelected ? 'text-nexus-700 dark:text-nexus-300' : 'text-gray-900 dark:text-white')}>
                        {other?.firstName} {other?.lastName}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {conv.lastMessage ? formatRelativeTime(conv.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-nexus-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {!selectedConversation ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
          <MessageSquare className="w-16 h-16 opacity-30" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the left to start messaging</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          {selectedConv && (
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-9 h-9 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
                {selectedConv.otherUser?.avatar ? (
                  <img src={selectedConv.otherUser.avatar} alt="" className="w-9 h-9 object-cover" />
                ) : (
                  <span className="text-nexus-600 dark:text-nexus-400 font-semibold text-sm">
                    {selectedConv.otherUser?.firstName?.[0]}{selectedConv.otherUser?.lastName?.[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedConv.otherUser?.firstName} {selectedConv.otherUser?.lastName}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedConv.otherUser?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-nexus-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender?.id === user?.id;
                return (
                  <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
                        <span className="text-xs text-nexus-600 dark:text-nexus-400 font-semibold">
                          {msg.sender?.firstName?.[0]}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      'max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                      isMine
                        ? 'bg-nexus-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                    )}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={cn('text-xs mt-1', isMine ? 'text-nexus-200' : 'text-gray-400')}>
                        {formatRelativeTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-end gap-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="flex-1 px-4 py-3 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl focus:outline-none focus:border-nexus-500 focus:bg-white dark:focus:bg-gray-700 resize-none transition-all max-h-32"
                style={{ height: 'auto' }}
              />
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                className="p-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

