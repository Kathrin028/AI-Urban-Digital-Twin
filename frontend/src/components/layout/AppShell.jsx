import { ThemeProvider } from '../../context/ThemeProvider';
import { AuthProvider } from '../../context/AuthProvider';

/**
 * AppShell – top-level layout component used in the root render.
 * Provides ThemeProvider and AuthProvider for the entire app.
 * Future global utilities (toasts, modals, scroll restoration) can be
 * added here as additional providers or sibling components.
 */
const AppShell = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

export default AppShell;
