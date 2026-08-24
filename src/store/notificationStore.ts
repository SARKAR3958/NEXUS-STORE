import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  type: 'order' | 'system' | 'promo' | 'success' | 'alert';
  read: boolean;
  link?: string;
  orderId?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  syncOrderNotifications: (orders: any[]) => void;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'welcome-nexus',
    title: 'Welcome to Nexus Store! 🚀',
    message: 'Explore production-ready mobile apps, modern web platforms, and premium source code packages.',
    time: 'Just now',
    timestamp: Date.now(),
    type: 'system',
    read: false,
    link: '/products',
  },
  {
    id: 'promo-flash-sale',
    title: '⚡ Exclusive Developer Perks',
    message: 'All purchases include lifetime updates, full unminified source code, and dedicated technical documentation.',
    time: '2 hours ago',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    type: 'promo',
    read: false,
    link: '/products',
  },
  {
    id: 'instant-delivery-guarantee',
    title: 'Instant Fulfillment 📦',
    message: 'Once your transaction is verified, instant ZIP package downloads and invoice receipts unlock in your Profile.',
    time: '1 day ago',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    type: 'success',
    read: true,
    link: '/profile?tab=history',
  }
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
      addNotification: (notif) =>
        set((state) => {
          const newNotif: AppNotification = {
            ...notif,
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            read: false,
          };
          return { notifications: [newNotif, ...state.notifications] };
        }),
      syncOrderNotifications: (orders) => {
        if (!orders || orders.length === 0) return;

        set((state) => {
          const currentNotifications = [...state.notifications];
          let updated = false;

          orders.forEach((order) => {
            const orderNotifId = `order_${order.id || order._id}_${order.status}`;
            const exists = currentNotifications.some((n) => n.id === orderNotifId);

            if (!exists) {
              const isApproved =
                order.status?.toLowerCase() === 'approved' ||
                order.status?.toLowerCase() === 'completed';
              const isRejected =
                order.status?.toLowerCase() === 'rejected' ||
                order.status?.toLowerCase() === 'failed';

              const prodName =
                order.products?.[0]?.title ||
                order.productName ||
                `Order #${(order.id || '').slice(-6).toUpperCase()}`;

              let title = `📦 Order Update: ${prodName}`;
              let message = `Your order #${(order.id || '').slice(-6).toUpperCase()} is currently ${order.status || 'Processing'}. Total: $${(order.totalAmount || 0).toFixed(2)}.`;
              let type: AppNotification['type'] = 'order';

              if (isApproved) {
                title = `🎉 Order Approved: ${prodName}`;
                message = `Great news! Your payment is approved and ZIP downloads are available now in Order History.`;
                type = 'success';
              } else if (isRejected) {
                title = `⚠️ Order Status Alert: ${prodName}`;
                message = `Your transaction verification was not successful. Please contact support or retry in Order History.`;
                type = 'alert';
              }

              currentNotifications.unshift({
                id: orderNotifId,
                title,
                message,
                time: 'Recently',
                timestamp: Date.now(),
                type,
                read: false,
                link: '/profile?tab=history',
                orderId: order.id,
              });
              updated = true;
            }
          });

          if (updated) {
            return { notifications: currentNotifications };
          }
          return {};
        });
      },
    }),
    {
      name: 'nexus_notifications_storage',
    }
  )
);
