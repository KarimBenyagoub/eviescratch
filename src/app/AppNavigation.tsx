import { createContext } from 'react';

// Dialogs need their own entry point while the app header is inert.
export const AppNavigation = createContext<(() => void) | null>(null);
