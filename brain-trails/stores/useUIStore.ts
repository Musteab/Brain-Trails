import { create } from "zustand";

type ModalId = "newDeck" | "newCard" | "settings" | null;

interface UIStoreState {
  /** Currently open modal (null = none) */
  activeModal: ModalId;
  /** Whether the mobile nav drawer is open */
  isMobileNavOpen: boolean;
  /** Global loading overlay */
  isGlobalLoading: boolean;
  /** Toast notifications queue */
  toasts: Toast[];

  openModal: (id: ModalId) => void;
  closeModal: () => void;
  toggleMobileNav: () => void;
  setGlobalLoading: (loading: boolean) => void;
  addToast: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: string) => void;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  createdAt: number;
}

let toastCounter = 0;

export const useUIStore = create<UIStoreState>((set) => ({
  activeModal: null,
  isMobileNavOpen: false,
  isGlobalLoading: false,
  toasts: [],

  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  toggleMobileNav: () =>
    set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  addToast: (message, type = "info") => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, message, type, createdAt: Date.now() },
      ],
    }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
