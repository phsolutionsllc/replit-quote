import { ReactNode, useState } from "react";
import { Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto py-4 px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-display font-bold">Agent Launch</h1>
            <span className="ml-2 text-sm bg-secondary text-primary rounded-full px-2 py-0.5">Quoting Tool</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary-light transition-colors"
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="relative">
              <Button variant="ghost" className="flex items-center space-x-2">
                <span className="hidden md:inline text-sm font-medium">Account</span>
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto py-4 px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Agent Launch. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="link" className="text-primary hover:text-primary-dark text-sm">
                Help & Support
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
