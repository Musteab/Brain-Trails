/**
 * KeyboardShortcuts - Global keyboard shortcut handler
 * 
 * Shortcuts:
 * - Cmd/Ctrl + K: Open command palette
 * - N: New note (when not in input)
 * - P: Start Pomodoro (when not in input)
 * - F: Go to flashcards (when not in input)
 * - Q: Go to quizzes (when not in input)
 * - D: Go to dashboard (when not in input)
 * - Escape: Close modals
 */
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Check if the active element is an input/textarea
const isInputFocused = () => {
  const el = document.activeElement;
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    el.isContentEditable ||
    el.getAttribute('role') === 'textbox'
  );
};

export default function KeyboardShortcuts({ onOpenCommandPalette, startTimer }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (e) => {
      // Cmd/Ctrl + K - Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // Don't process single-key shortcuts if in an input
      if (isInputFocused()) return;

      // Single key shortcuts (only when not in input)
      switch (e.key.toLowerCase()) {
        case 'n':
          // New note
          e.preventDefault();
          navigate('/notes?new=true');
          break;
          
        case 'p':
          // Start Pomodoro
          e.preventDefault();
          startTimer?.();
          break;
          
        case 'f':
          // Flashcards
          e.preventDefault();
          navigate('/flashcards');
          break;
          
        case 'q':
          // Quizzes
          e.preventDefault();
          navigate('/quizzes');
          break;
          
        case 'd':
          // Dashboard
          e.preventDefault();
          navigate('/dashboard');
          break;
          
        case 's':
          // Settings
          e.preventDefault();
          navigate('/settings');
          break;
          
        case '?':
          // Show shortcuts help (Shift + ?)
          if (e.shiftKey) {
            e.preventDefault();
            onOpenCommandPalette?.();
          }
          break;
          
        default:
          break;
      }
    },
    [navigate, onOpenCommandPalette, startTimer]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook version for components that need shortcut access
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, shift = false, alt = false, requireNoInput = true } = options;

  useEffect(() => {
    const handler = (e) => {
      if (requireNoInput && isInputFocused()) return;
      
      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? e.ctrlKey || e.metaKey : true;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
      const altMatch = alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callback(e);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, callback, ctrl, shift, alt, requireNoInput]);
}

/**
 * Shortcut display helper
 */
export function getShortcutDisplay(shortcut) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  
  const keys = {
    cmd: isMac ? '⌘' : 'Ctrl',
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
    enter: '↵',
    esc: 'Esc',
  };

  return shortcut
    .replace(/cmd/gi, keys.cmd)
    .replace(/ctrl/gi, keys.ctrl)
    .replace(/alt/gi, keys.alt)
    .replace(/shift/gi, keys.shift)
    .replace(/enter/gi, keys.enter)
    .replace(/esc/gi, keys.esc);
}

/**
 * All available shortcuts for help display
 */
export const SHORTCUTS = [
  { keys: 'Cmd+K', description: 'Open command palette' },
  { keys: 'N', description: 'New note' },
  { keys: 'P', description: 'Start Pomodoro timer' },
  { keys: 'F', description: 'Go to flashcards' },
  { keys: 'Q', description: 'Go to quizzes' },
  { keys: 'D', description: 'Go to dashboard' },
  { keys: 'S', description: 'Go to settings' },
  { keys: 'Esc', description: 'Close modals' },
];
