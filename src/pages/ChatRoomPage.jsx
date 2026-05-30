import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createClient } from '@supabase/supabase-js';
import SeoHead from '../components/SeoHead.jsx';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Realtimeのためにsupabase clientを作成
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return '今日';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '昨日';
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ルーム情報取得
  useEffect(() => {
    if (!roomId || !user) return;
    fetch(`${supabaseUrl}/rest/v1/chat_rooms?id=eq.${roomId}&select=*`, { headers })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data[0]) setRoom(data[0]);
      });
  }, [roomId, user]);

  // 既存メッセージ取得
  useEffect(() => {
    if (!roomId) return;
    setIsLoading(true);
    fetch(
      `${supabaseUrl}/rest/v1/chat_messages?room_id=eq.${roomId}&select=*&order=created_at.asc`,
      { headers }
    )
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .finally(() => setIsLoading(false));
  }, [roomId]);

  // スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime購読
  useEffect(() => {
    if (!roomId) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages(prev => {
            // 重複チェック
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = async () => {
    if (!input.trim() || !user || isSending) return;
    const content = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          room_id: roomId,
          sender_id: user.id,
          sender_name: user.email?.split('@')[0] || '名無し',
          content,
        }),
      });
    } catch (e) {
      alert('送信に失敗しました');
      setInput(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">ログインが必要です</p>
          <Link to="/login" className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold">ログイン</Link>
        </div>
      </div>
    );
  }

  // メッセージを日付でグループ化
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = formatDate(msg.created_at);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const otherId = room ? (room.user1_id === user.id ? room.user2_id : room.user1_id) : null;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      <SeoHead title="チャット" noindex />
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition p-1 -ml-1"
        >
          ←
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-sm">👤</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">
            {otherId ? `${otherId.slice(0, 8)}...` : 'チャット'}
          </p>
          <p className="text-slate-500 text-[10px]">オンライン</p>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">読み込み中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-white font-black mb-1">会話を始めよう</p>
            <p className="text-slate-400 text-sm">最初のメッセージを送ってください</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* 日付区切り */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-slate-600 text-[10px] font-bold px-2">{date}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {msgs.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                const prevMsg = i > 0 ? msgs[i - 1] : null;
                const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* アバター */}
                    {!isMe && (
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${showAvatar ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'invisible'}`}>
                        {showAvatar && '👤'}
                      </div>
                    )}

                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* 送信者名（他者のみ、最初のメッセージ時） */}
                      {!isMe && showAvatar && (
                        <span className="text-[10px] text-slate-500 mb-1 ml-1">
                          {msg.sender_name}
                        </span>
                      )}

                      <div className="flex items-end gap-1.5">
                        {isMe && (
                          <span className="text-[10px] text-slate-600 flex-shrink-0 mb-0.5">
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {!isMe && (
                          <span className="text-[10px] text-slate-600 flex-shrink-0 mb-0.5">
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur border-t border-white/5 px-4 py-3">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Enterで送信)"
            rows={1}
            className="flex-1 bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 resize-none"
            style={{ maxHeight: '120px' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center transition hover:opacity-90 disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-slate-700 text-[9px] mt-1.5">Shift+Enterで改行</p>
      </div>
    </div>
  );
}
