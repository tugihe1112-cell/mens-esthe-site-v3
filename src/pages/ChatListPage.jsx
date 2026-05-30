import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import SeoHead from '../components/SeoHead.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function ChatListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  useEffect(() => {
    if (!user) return;
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      // 自分が参加しているルームを取得
      const res = await fetch(
        `${url}/rest/v1/chat_rooms?or=(user1_id.eq.${user.id},user2_id.eq.${user.id})&select=*&order=created_at.desc`,
        { headers }
      );
      const data = await res.json();
      if (!Array.isArray(data)) { setIsLoading(false); return; }

      // 各ルームの最新メッセージを取得
      const roomsWithMessages = await Promise.all(data.map(async (room) => {
        const msgRes = await fetch(
          `${url}/rest/v1/chat_messages?room_id=eq.${room.id}&select=*&order=created_at.desc&limit=1`,
          { headers }
        );
        const msgs = await msgRes.json();
        const lastMsg = Array.isArray(msgs) && msgs.length > 0 ? msgs[0] : null;
        const otherId = room.user1_id === user.id ? room.user2_id : room.user1_id;
        return { ...room, lastMsg, otherId };
      }));

      setRooms(roomsWithMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newChatEmail.trim()) return;
    setIsCreating(true);
    try {
      // メールアドレスでユーザーを検索（auth.usersはアクセス不可なのでuser_nameで代用）
      // ここではシンプルにメールプレフィックスをuser_nameとして扱う
      const targetName = newChatEmail.trim().split('@')[0];

      // 既存ルームチェック
      const checkRes = await fetch(
        `${url}/rest/v1/chat_rooms?or=(and(user1_id.eq.${user.id}),and(user2_id.eq.${user.id}))&select=*`,
        { headers }
      );

      // シンプルにルームを作成（相手のIDが必要だが、ここでは仮実装）
      alert(`チャット機能: "${targetName}" 宛のDMはまだ実装中です。\n\n現在は口コミ投稿者のプロフィールページからDMを開始できます。`);
    } finally {
      setIsCreating(false);
      setShowNewChat(false);
      setNewChatEmail('');
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-white font-black mb-2">ログインが必要です</p>
            <p className="text-slate-400 text-sm mb-6">チャットを使うにはログインしてください</p>
            <Link to="/login" className="bg-pink-500 text-white px-6 py-2.5 rounded-full font-bold hover:bg-pink-600 transition">
              ログイン
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead title="メッセージ"
        noindex />
      <Header />
      <div className="min-h-screen bg-slate-950 text-white pb-32 pt-20">
        {/* バナー */}
        <div className="bg-gradient-to-br from-indigo-900/60 via-slate-900 to-purple-900/40 border-b border-white/5 pb-6 px-4 pt-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">💬</span>
                <h1 className="text-2xl font-black">メッセージ</h1>
              </div>
              <p className="text-slate-400 text-sm">ユーザー間のダイレクトメッセージ</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-white font-black mb-2">まだメッセージはありません</p>
              <p className="text-slate-400 text-sm mb-6">口コミのプロフィールからDMを送ることができます</p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {rooms.map(room => (
                <Link
                  key={room.id}
                  to={`/chat/${room.id}`}
                  className="flex items-center gap-4 bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white font-bold text-sm truncate">
                        {room.otherId?.slice(0, 8)}...
                      </span>
                      <span className="text-slate-600 text-[10px] flex-shrink-0 ml-2">
                        {room.lastMsg ? timeAgo(room.lastMsg.created_at) : timeAgo(room.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs truncate">
                      {room.lastMsg ? room.lastMsg.content : 'メッセージはまだありません'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
