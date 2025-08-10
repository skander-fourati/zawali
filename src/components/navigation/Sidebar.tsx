import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronRight,
  Home, 
  CreditCard, 
  Upload, 
  BarChart3, 
  Briefcase,
  Settings,
  Database,
  User,
  LogOut,
  PiggyBank
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionUploadModal } from '@/components/dashboard/TransactionUploadModal';
import { useAuth } from "@/hooks/useAuth";
import { cn } from '@/lib/utils';

interface SidebarProps {
  // No props needed anymore - sidebar manages its own upload modal
}

// Zawali Logo Component
const ZawaliLogo = ({ size = 'normal', showText = true }: { size?: 'small' | 'normal', showText?: boolean }) => {
  const piggySize = size === 'small' ? 28 : 36;
  const textSize = size === 'small' ? 'text-xl' : 'text-2xl';

  return (
    <div className="flex items-center gap-3">
      {/* Crying Piggy Bank */}
      <div 
        className="relative zawali-float"
        style={{ 
          width: piggySize,
          height: piggySize * 0.7
        }}
      >
        <div 
          className="bg-gradient-to-r from-red-400 to-red-300 rounded-full relative border-2 border-red-500"
          style={{ 
            width: piggySize,
            height: piggySize * 0.7
          }}
        >
          {/* Eyes */}
          <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
          <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
          
          {/* Tear */}
          <div className="absolute top-2 left-3 w-0.5 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          
          {/* Snout */}
          <div 
            className="absolute -right-1 bg-red-300 rounded-full border border-red-500"
            style={{
              top: piggySize * 0.3,
              width: piggySize * 0.2,
              height: piggySize * 0.15
            }}
          ></div>
        </div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold text-zawali-gradient ${textSize}`}>
          zawali
        </span>
      )}
    </div>
  );
};

export function Sidebar({}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleManageData = () => {
    navigate('/manage-data');
  };

  const handleUploadTransactions = () => {
    setIsUploadModalOpen(true);
  };

  const handleTransactionsUploaded = () => {
    setIsUploadModalOpen(false);
    // Could add toast notification here if needed
  };

  // Broke-friendly navigation with self-deprecating humor
  const navigationItems = [
    {
      id: 'dashboard',
      label: isExpanded ? 'Dashboard' : 'Dashboard',
      icon: Home,
      path: '/',
      action: () => navigate('/')
    },
    {
      id: 'transactions',
      label: isExpanded ? 'All Transactions' : 'Transactions',
      icon: CreditCard,
      path: '/transactions',
      action: () => navigate('/transactions')
    },
    {
      id: 'upload',
      label: isExpanded ? 'Upload Transactions' : 'Upload',
      icon: Upload,
      path: null, // No path since it's a modal
      action: handleUploadTransactions
    },
    {
      id: 'insights',
      label: isExpanded ? 'Insights' : 'Insights',
      icon: BarChart3,
      path: '/insights',
      action: () => navigate('/insights')
    },
    {
      id: 'portfolio',
      label: isExpanded ? 'Portfolio' : 'Portfolio',
      icon: Briefcase,
      path: '/portfolio',
      action: () => {}, // Empty for now
      disabled: true,
      comingSoon: true
    }
  ];

  const isActiveRoute = (path: string | null) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsExpanded(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border shadow-lg z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}>
        {/* Header with Zawali Logo */}
        <div className="flex items-center justify-center p-4 border-b border-sidebar-border">
          {isExpanded ? (
            <ZawaliLogo size="normal" showText={true} />
          ) : (
            <ZawaliLogo size="small" showText={false} />
          )}
        </div>

        {/* Broke Status Indicator */}
        {isExpanded && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="broke-message text-base">
              <div>
                <div className="font-semibold text-red-400 text-base">Professional Status:</div>
                <div className="text-sm text-gray-300">Certified Brokie™</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <button
                key={item.id}
                onClick={item.action}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center rounded-lg text-base font-medium transition-colors",
                  "hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                  !isActive && "text-sidebar-foreground hover:text-sidebar-accent-foreground",
                  item.disabled && "opacity-50 cursor-not-allowed",
                  isExpanded ? "gap-4 px-3 py-3.5 justify-start" : "px-3 py-3.5 justify-center"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6 flex-shrink-0",
                  isActive && "text-sidebar-primary-foreground"
                )} />
                
                {isExpanded && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-base">{item.label}</span>
                    {item.comingSoon && (
                      <span className="text-sm bg-sidebar-accent text-sidebar-accent-foreground px-2.5 py-1 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Motivational Message */}
        {isExpanded && (
          <div className="px-4 py-3 mt-4">
            <div className="text-sm text-gray-400 italic text-center leading-relaxed">
              "Remember: You can't overdraw on your dreams... yet."
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div className="absolute bottom-4 left-2 right-2 space-y-2">
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center rounded-lg text-base font-medium transition-colors",
                  "hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2",
                  "text-sidebar-foreground hover:text-sidebar-accent-foreground",
                  isExpanded ? "gap-4 px-3 py-3.5 justify-start" : "px-3 py-3.5 justify-center"
                )}
              >
                <Settings className="h-6 w-6 flex-shrink-0" />
                {isExpanded && <span>Settings</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleManageData} className="cursor-pointer">
                <Database className="mr-2 h-4 w-4" />
                Manage Data
              </DropdownMenuItem>
              
              {/* Future features - grayed out with zawali humor */}
              <DropdownMenuItem disabled className="opacity-50">
                <User className="mr-2 h-4 w-4" />
                Account Settings
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem disabled className="opacity-50">
                <CreditCard className="mr-2 h-4 w-4" />
                Premium (LOL)
                <span className="ml-auto text-xs text-muted-foreground">Sure</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 focus:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Escape Reality
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Expand/Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full flex items-center rounded-lg p-3 hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
              isExpanded ? "gap-4 justify-start" : "justify-center"
            )}
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isExpanded ? "ml-64" : "ml-20"
      )} />

      {/* Upload Transactions Modal */}
      <TransactionUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTransactionsUploaded={handleTransactionsUploaded}
      />
    </>
  );
}