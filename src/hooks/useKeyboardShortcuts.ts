import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true;
        const metaMatch = shortcut.meta ? e.metaKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : true;
        const altMatch = shortcut.alt ? e.altKey : true;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        // For ctrl/meta shortcuts, require the modifier
        const modifierRequired = shortcut.ctrl || shortcut.meta;
        const modifierPressed = e.ctrlKey || e.metaKey;

        if (modifierRequired) {
          if (keyMatch && modifierPressed && ctrlMatch && metaMatch && shiftMatch && altMatch) {
            e.preventDefault();
            shortcut.action();
            break;
          }
        } else {
          if (keyMatch && !modifierPressed && shiftMatch && altMatch) {
            e.preventDefault();
            shortcut.action();
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}

export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      description: 'Create new quote',
      action: () => navigate('/quotes/new')
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Search (Command palette)',
      action: () => {
        // Trigger command palette - to be implemented
        console.log('Command palette');
      }
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        // Show shortcuts dialog - to be implemented
        console.log('Keyboard shortcuts help');
      }
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Go to dashboard',
      action: () => navigate('/')
    },
    {
      key: 'q',
      ctrl: true,
      description: 'Go to quotes',
      action: () => navigate('/quotes')
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Go to customers',
      action: () => navigate('/customers')
    },
    {
      key: ',',
      ctrl: true,
      description: 'Go to settings',
      action: () => navigate('/settings')
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
