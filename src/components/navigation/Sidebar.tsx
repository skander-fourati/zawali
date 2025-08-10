import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  CreditCard, 
  Upload, 
  BarChart3, 
  Briefcase,
  Settings,
  Database,
  User,
  LogOut
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

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      action: () => navigate('/')
    },
    {
      id: 'transactions',
      label: 'View All Transactions',
      icon: CreditCard,
      path: '/transactions',
      action: () => navigate('/transactions')
    },
    {
      id: 'upload',
      label: 'Upload Transactions',
      icon: Upload,
      path: null, // No path since it's a modal
      action: handleUploadTransactions
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: BarChart3,
      path: '/insights',
      action: () => navigate('/insights')
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
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
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={cn(
            "font-bold text-lg text-gray-900 transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            {isExpanded && "Finance App"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-100"
          >
            {isExpanded ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

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
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive && "bg-blue-50 text-blue-700 border border-blue-200",
                  !isActive && "text-gray-700",
                  item.disabled && "opacity-50 cursor-not-allowed",
                  !isExpanded && "justify-center"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive && "text-blue-600"
                )} />
                
                <div className={cn(
                  "flex items-center justify-between flex-1 transition-opacity duration-200",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}>
                  {isExpanded && (
                    <>
                      <span>{item.label}</span>
                      {item.comingSoon && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer/Settings */}
        <div className="absolute bottom-4 left-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "text-gray-700",
                  !isExpanded && "justify-center"
                )}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "transition-opacity duration-200",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}>
                  {isExpanded && "Settings"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleManageData} className="cursor-pointer">
                <Database className="mr-2 h-4 w-4" />
                Manage Data
              </DropdownMenuItem>
              
              {/* Future features - grayed out */}
              <DropdownMenuItem disabled className="opacity-50">
                <User className="mr-2 h-4 w-4" />
                Account Settings
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem disabled className="opacity-50">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isExpanded ? "ml-64" : "ml-16"
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