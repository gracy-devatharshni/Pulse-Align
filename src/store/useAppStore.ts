import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  department?: string | null;
  designation?: string | null;
  managerId?: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

interface AppState {
  user: User | null;
  sidebarOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  activeCycleId: string | null;
  commandPaletteOpen: boolean;

  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setActiveCycleId: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        sidebarOpen: true,
        notifications: [],
        unreadCount: 0,
        activeCycleId: null,
        commandPaletteOpen: false,

        setUser: (user) => set({ user }),

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        setNotifications: (notifications) =>
          set({
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }),

        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          })),

        markAllRead: () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              read: true,
            })),
            unreadCount: 0,
          })),

        setActiveCycleId: (id) => set({ activeCycleId: id }),

        setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      }),
      {
        name: "pulsealign-storage",
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeCycleId: state.activeCycleId,
        }),
      }
    )
  )
);
