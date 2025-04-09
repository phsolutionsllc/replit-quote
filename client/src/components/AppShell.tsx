import { ReactNode, useState, createContext, useContext, useEffect } from "react";
import { Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Create Theme context
export type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const [darkMode, setDarkMode] = useState(false); // Set light mode as default
  const [hovered, setHovered] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || 
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-black'} transition-colors duration-300`}>
        {/* Header */}
        <header className={`${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'} border-b shadow-sm sticky top-0 z-50 transition-colors duration-300`}>
          <div className="container mx-auto py-2 px-4 md:px-6 flex justify-between items-center">
            <div className="flex items-center">
              <Logo variant="full" size="sm" className={darkMode ? "text-white" : "text-black"} />
            </div>
            
            <div className="flex items-center gap-3">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full h-8 w-8 relative ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition-colors`}
                      onClick={toggleDarkMode}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                      aria-label="Toggle Dark Mode"
                    >
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${(darkMode && !hovered) || (!darkMode && hovered) ? 'opacity-100' : 'opacity-0'}`}>
                        <Sun className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${(!darkMode && !hovered) || (darkMode && hovered) ? 'opacity-100' : 'opacity-0'}`}>
                        <Moon className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={5} className={`${darkMode ? "bg-zinc-800 text-white border-zinc-700" : "bg-white text-gray-900 border-gray-200"} animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-100`}>
                    <p>{darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full h-8 w-8"
                      aria-label="Account"
                    >
                      <User className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={5} className={`${darkMode ? "bg-zinc-800 text-white border-zinc-700" : "bg-white text-gray-900 border-gray-200"} animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-100`}>
                    <p>Account Details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className={`flex-grow container mx-auto px-4 py-6 md:px-8 md:py-12 ${darkMode ? 'bg-zinc-900' : 'bg-white'} transition-colors duration-300`}>
          {children}
        </main>
        
        {/* Footer */}
        <footer className={`${darkMode ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'} border-t transition-colors duration-300`}>
          <div className="container mx-auto py-6 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center">
                <Logo variant="icon" size="sm" className={`mr-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                <div className={`${darkMode ? 'text-zinc-400' : 'text-gray-600'} text-base transition-colors duration-300`}>
                  &copy; {new Date().getFullYear()} Agent Launch. All rights reserved.
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex gap-6">
                <Button variant="link" className={`${darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-black'} text-base p-0 transition-colors duration-300`}>
                  Privacy Policy
                </Button>
                <Button variant="link" className={`${darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-black'} text-base p-0 transition-colors duration-300`}>
                  Terms of Service
                </Button>
                <Button variant="link" className={`${darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-black'} text-base p-0 transition-colors duration-300`}>
                  Help & Support
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
};

export default AppShell;
