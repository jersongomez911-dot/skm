import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),

      setToken: (accessToken) => set({ accessToken }),

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      hasRole: (...roles) => roles.includes(get().user?.role),

      hasMinRole: (minRole) => {
        const hierarchy = { ADMIN: 5, SUPERVISOR: 4, MECHANIC: 3, RECEPTIONIST: 2, VIEWER: 1 }
        const userLevel = hierarchy[get().user?.role] || 0
        return userLevel >= (hierarchy[minRole] || 0)
      },
    }),
    {
      name: 'skm-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
)
