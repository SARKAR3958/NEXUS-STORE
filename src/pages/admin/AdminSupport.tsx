import { useState, useEffect, useRef } from 'react';
import { 
  Headphones, Search, Send, User, MessageSquare, 
  CheckCheck, ArrowLeft, Image as ImageIcon, X,
  MoreVertical, Paperclip, ChevronRight
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, doc, onSnapshot, query, orderBy, 
  addDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';

interface SupportChatUser {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastUpdated?: any;
  unreadByAdmin?: boolean;
}

interface SupportMessage {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: 'user' | 'admin' | 'ai';
  senderName?: string;
  timestamp?: any;
}

export function AdminSupport() {
  const [usersList, setUsersList] = useState<SupportChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [adminImage, setAdminImage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Format timestamp helper
  const formatTime = (ts: any) => {
    try {
      const date = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date();
      return `${date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Just now';
    }
  };

  // 1. Listen for all user chat sessions from root collection `support_chat_io`
  useEffect(() => {
    try {
      const chatsRef = collection(db, 'support_chat_io');
      const q = query(chatsRef, orderBy('lastUpdated', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: SupportChatUser[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ userId: docSnap.id, ...docSnap.data() } as SupportChatUser);
        });
        setUsersList(list);
        setLoading(false);

        // Auto-select first user ONLY on desktop screens (md: 768px+)
        if (!selectedUserId && list.length > 0 && window.innerWidth >= 768) {
          setSelectedUserId(list[0].userId);
        }
      }, (err) => {
        console.warn("Error listening to support_chat_io collection:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore support chats error:", e);
      setLoading(false);
    }
  }, []);

  // 2. Listen for messages of selected user
  useEffect(() => {
    if (!selectedUserId) return;

    // Mark as read by admin
    try {
      const userDocRef = doc(db, 'support_chat_io', selectedUserId);
      updateDoc(userDocRef, { unreadByAdmin: false }).catch(() => {});
    } catch (e) {}

    const messagesRef = collection(db, 'support_chat_io', selectedUserId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: SupportMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as SupportMessage);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUserId]);

  const handleAdminImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result as string;
      setAdminImage(imgData);
    };
    reader.readAsDataURL(file);
  };

  // Admin sending message
  const handleSendAdminMessage = async () => {
    if (!selectedUserId || (!adminInput.trim() && !adminImage)) return;
    const text = adminInput.trim();
    const imageUrlToSend = adminImage;
    setAdminInput('');
    setAdminImage(null);

    try {
      const messagesRef = collection(db, 'support_chat_io', selectedUserId, 'messages');
      await addDoc(messagesRef, {
        text,
        imageUrl: imageUrlToSend || null,
        sender: 'admin',
        senderName: 'Nexus Admin Support',
        timestamp: serverTimestamp(),
      });

      const userDocRef = doc(db, 'support_chat_io', selectedUserId);
      await updateDoc(userDocRef, {
        lastMessage: text || '📷 Sent an image attachment',
        lastUpdated: serverTimestamp(),
        unreadByAdmin: false,
        unreadByUser: true,
      });
    } catch (err) {
      console.error('Error sending admin reply:', err);
    }
  };

  const selectedUser = usersList.find((u) => u.userId === selectedUserId);

  const filteredUsers = usersList.filter(
    (u) =>
      u.userName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.userEmail?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.userId?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-[#080910] text-white overflow-hidden">
      
      {/* Main Workspace Layout (Sidebar + Active Chat Panel) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-0 bg-[#0c0d16] w-full h-full">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: USERS LIST SCREEN (Exact Replica of Image 2)  */}
        {/* ========================================================= */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-[#1a1c2e] bg-[#0c0d16] flex flex-col shrink-0 ${
          selectedUserId ? 'hidden md:flex' : 'flex flex-1'
        }`}>
          
          {/* Top Bar Header */}
          <div className="px-4 py-3 bg-[#0e0f1a] border-b border-[#181a28] flex items-center justify-between">
            <div className="w-8"></div>
            <div className="text-center">
              <h1 className="text-sm font-extrabold text-white tracking-tight">Customer Support</h1>
              <p className="text-[10px] text-gray-400 font-medium">All Users</p>
            </div>
            <div className="p-2 bg-[#161726] border border-[#23253a] rounded-xl text-purple-400">
              <Headphones className="w-4 h-4" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3.5 border-b border-[#181a28]">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-[#121320] border border-[#212338] text-white placeholder-gray-500 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7c3aed] transition-all"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-xs">Loading user chats...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto" />
                <p>No active support chats</p>
              </div>
            ) : (
              filteredUsers.map((thread) => {
                const isSelected = thread.userId === selectedUserId;
                return (
                  <div
                    key={thread.userId}
                    onClick={() => setSelectedUserId(thread.userId)}
                    className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#18192c] border-[#313454]'
                        : 'bg-[#111222] border-[#1f2136] hover:bg-[#151628]'
                    }`}
                  >
                    {/* Glowing Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] p-0.5 shadow-md">
                        <div className="w-full h-full rounded-full bg-[#121320] flex items-center justify-center text-purple-300 font-extrabold text-sm overflow-hidden">
                          <User className="w-5 h-5 text-purple-300" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111222] rounded-full"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-xs font-bold text-white truncate">{thread.userName}</h3>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                          {formatTime(thread.lastUpdated)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        {thread.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {thread.unreadByAdmin && (
                      <div className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/50">
                        2
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT SCREEN (Exact Replica of Image 1)*/}
        {/* ========================================================= */}
        <div className={`flex-1 flex flex-col bg-[#090a12] min-w-0 ${
          selectedUserId ? 'flex flex-1' : 'hidden md:flex'
        }`}>
          {selectedUser ? (
            <>
              {/* Header Bar */}
              <div className="px-3.5 py-3 bg-[#0e0f1a] border-b border-[#181a28] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="p-1.5 text-purple-400 hover:text-white rounded-lg cursor-pointer shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] p-0.5">
                      <div className="w-full h-full rounded-full bg-[#121320] flex items-center justify-center text-purple-300 font-bold text-xs overflow-hidden">
                        <User className="w-4 h-4 text-purple-300" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xs md:text-sm font-bold text-white truncate">{selectedUser.userName}</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Online</span>
                    </div>
                  </div>
                </div>

                <button className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* User Details Box (Top Info Box as in Image 1) */}
              <div className="p-3 bg-[#0e0f1a]/80 border-b border-[#181a28]">
                <div className="bg-[#121322] border border-[#202238] rounded-2xl p-3.5">
                  <div className="grid grid-cols-3 gap-2 text-center pb-2.5 border-b border-[#1d1f33]">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">User ID</span>
                      <span className="text-xs font-bold text-white font-mono">#{selectedUser.userId.slice(-6).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Total Orders</span>
                      <span className="text-xs font-bold text-white">12</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Joined</span>
                      <span className="text-xs font-bold text-white">12 May 2024</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#a78bfa] font-semibold cursor-pointer hover:text-purple-300">
                    <span>View User Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Date Indicator Badge */}
              <div className="flex justify-center my-3">
                <span className="bg-[#121320] text-gray-400 border border-[#1f2136] text-[10px] font-medium px-3.5 py-0.5 rounded-full">
                  Today
                </span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 p-3.5 md:p-6 overflow-y-auto space-y-3.5 bg-[#080910]">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    No messages in chat history. Type a message to reply.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* User Avatar on left for user messages */}
                        {!isAdmin && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] p-0.5 shrink-0 mb-1">
                            <div className="w-full h-full rounded-full bg-[#121320] flex items-center justify-center text-purple-300 font-bold text-[10px]">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}

                        <div
                          className={`max-w-[82%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-[#6b21a8] text-white rounded-br-xs shadow-md shadow-purple-900/30'
                              : 'bg-[#131422] text-gray-200 border border-[#212338] rounded-bl-xs'
                          }`}
                        >
                          {/* Text content */}
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                          {/* Image or Attachment block matching image 1 */}
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                              <div className="bg-[#0b0c16] border border-[#262842] rounded-xl p-2.5 flex items-center gap-2.5">
                                <div className="p-2 bg-[#1a1b2d] rounded-lg text-purple-400">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">payment_screenshot.jpg</p>
                                  <p className="text-[10px] text-gray-400">512 KB • JPG</p>
                                </div>
                              </div>
                            </a>
                          )}

                          {/* Time & Double Checkmarks */}
                          <div className={`flex items-center gap-1 mt-1 text-[9px] ${
                            isAdmin ? 'text-purple-200 justify-end' : 'text-gray-400 justify-start'
                          }`}>
                            <span>{formatTime(msg.timestamp)}</span>
                            {isAdmin && <CheckCheck className="w-3 h-3 text-purple-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Image Preview Bar */}
              {adminImage && (
                <div className="px-3 pt-2 pb-1 bg-[#0b0c14] border-t border-[#1a1c2e] flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-[#121322] p-1.5 rounded-xl border border-[#212338]">
                    <img src={adminImage} alt="Preview" className="w-9 h-9 object-cover rounded-lg" />
                    <span className="text-[11px] text-purple-300 font-medium">Image attached</span>
                  </div>
                  <button
                    onClick={() => setAdminImage(null)}
                    className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input Footer (Matching Image 1) */}
              <div className="p-3 bg-[#0e0f1a] border-t border-[#1a1c2e] flex items-center gap-2.5">
                <input
                  type="file"
                  ref={adminFileInputRef}
                  accept="image/*"
                  onChange={handleAdminImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => adminFileInputRef.current?.click()}
                  className="p-2.5 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Attach screenshot or file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAdminMessage()}
                  placeholder="Type your reply..."
                  className="flex-1 bg-[#121320] border border-[#212338] text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#7c3aed] transition-all"
                />

                <button
                  onClick={handleSendAdminMessage}
                  disabled={!adminInput.trim() && !adminImage}
                  className="w-10 h-10 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg shadow-purple-900/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#080910]">
              <div className="w-16 h-16 rounded-full bg-[#181a2d] flex items-center justify-center text-[#a78bfa] mb-4 border border-[#2a2d48]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Select a Support Thread</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Choose a user conversation from the left sidebar to view their message history and reply in real-time.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
