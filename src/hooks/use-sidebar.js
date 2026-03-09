import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebar = create(
  persist(
    (set) => ({
      isOpen: true,
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      closeSidebar: () => set({ isOpen: false }),
      openSidebar: () => set({ isOpen: true }),
    }),
    {
      name: 'sidebar-storage', // persist sidebar state in localStorage
    }
  )
);