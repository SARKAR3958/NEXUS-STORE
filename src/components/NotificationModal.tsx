import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Trash2, X, Sparkles, 
  Package, AlertTriangle, ArrowRight, Clock, Info
} from 'lucide-react';
import { useNotificationStore, AppNotification } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const NotificationModal: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    notifications, 
    isOpen, 
    setIsOpen, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll,
    syncOrderNotifications 
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Real-time listen to orders if user is authenticated to push notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', user.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        syncOrderNotifications(ordersData);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Error listening to user order notifications:', e);
    }
  }, [isAuthenticated, user?.id, syncOrderNotifications]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-[#a78bfa]" />;
      case 'success':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'promo':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.link) {
      setIsOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <div 
      id="notification-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      {/* Centered Modal Card */}
      <div 
        id="notification-modal-container"
        className="relative w-full max-w-[440px] max-h-[85vh] sm:max-h-[80vh] bg-[#0c0d16] border border-[#222438] rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1c1d2e] bg-[#11121d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center text-[#a78bfa]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base tracking-wide">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-[#8b5cf6] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-0.5">Order updates & store announcements</p>
            </div>
          </div>

          <button
            id="close-notifications-btn"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filter Tabs */}
        <div className="px-4 py-2.5 bg-[#0e0f1a] border-b border-[#1c1d2e] flex items-center justify-between gap-2 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#151624] p-1 rounded-xl border border-[#23253a]">
            <button
              id="notif-tab-all"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              id="notif-tab-unread"
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                id="notif-mark-all-read-btn"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-[#a78bfa] hover:text-[#c084fc] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                id="notif-clear-all-btn"
                onClick={clearAll}
                className="text-[11px] font-semibold text-gray-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Notifications List Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 divide-y-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[#151624] border border-[#23253a] flex items-center justify-center text-gray-500 mb-3">
                <Bell className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h4 className="text-white font-bold text-sm">No notifications found</h4>
              <p className="text-gray-400 text-xs max-w-[240px] mt-1">
                {activeFilter === 'unread' 
                  ? "You have marked all notifications as read." 
                  : "You're all caught up! New order and system alerts will appear here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-colors cursor-pointer relative group ${
                  notif.read
                    ? 'bg-[#0f101b] border-[#1a1b2b] hover:bg-[#141524] hover:border-[#27293d]'
                    : 'bg-[#151626] border-[#8b5cf6]/40 hover:border-[#8b5cf6]/80'
                }`}
              >
                {/* Unread indicator dot */}
                {!notif.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#a78bfa] shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1a1c2d] border border-[#2b2e46] flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className={`text-xs sm:text-[13px] font-bold tracking-wide truncate ${
                        notif.read ? 'text-gray-200' : 'text-white'
                      }`}>
                        {notif.title}
                      </h4>
                    </div>

                    <p className="text-gray-300 text-xs mt-1 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e2033]/60">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium font-mono">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>{notif.time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {notif.link && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a78bfa] group-hover:text-[#c084fc]">
                            <span>View</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-gray-500 hover:text-red-400 p-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Dismiss notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="p-3 bg-[#0d0e17] border-t border-[#1c1d2e] flex items-center justify-between text-xs shrink-0">
            <span className="text-gray-500 text-[11px] truncate max-w-[200px]">Logged in as <b className="text-gray-300 font-semibold">{user?.email}</b></span>
            <button
              id="notif-order-history-link"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile?tab=history');
              }}
              className="text-[#a78bfa] hover:text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Order History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
