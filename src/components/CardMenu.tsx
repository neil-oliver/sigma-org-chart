import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, User, Focus, Copy, Mail } from 'lucide-react';

interface CardMenuProps {
  onViewDetails?: () => void;
  onFocusTeam?: () => void;
  onCopyEmail?: () => void;
  email?: string;
  hasChildren?: boolean;
  /** Size variant for the trigger button */
  size?: 'sm' | 'md';
  /** Visual variant - 'default' for normal cards, 'header' for gradient backgrounds */
  variant?: 'default' | 'header';
  /** Additional classes for the wrapper */
  className?: string;
}

/**
 * A dropdown menu for card actions (View details, Focus on team, Copy email)
 * Provides discoverable access to actions that were previously hidden behind right-click
 */
const CardMenu: React.FC<CardMenuProps> = ({
  onViewDetails,
  onFocusTeam,
  onCopyEmail,
  email,
  hasChildren = false,
  size = 'sm',
  variant = 'default',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Button styles based on variant
  const buttonStyles = variant === 'header'
    ? 'h-8 w-8 p-2 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50'
    : `${size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'} p-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50`;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center ${buttonStyles}`}
        title="More actions"
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className={iconSize} />
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-1 z-50
            min-w-[160px] py-1
            bg-popover text-popover-foreground border border-border rounded-md shadow-lg
            animate-in fade-in-0 zoom-in-95 duration-100
          "
          role="menu"
        >
          {onViewDetails && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onViewDetails);
              }}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-muted transition-colors text-popover-foreground"
              role="menuitem"
            >
              <User className="h-4 w-4 opacity-70" />
              View details
            </button>
          )}

          {hasChildren && onFocusTeam && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onFocusTeam);
              }}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-muted transition-colors text-popover-foreground"
              role="menuitem"
            >
              <Focus className="h-4 w-4 opacity-70" />
              Focus on team
            </button>
          )}

          {email && (
            <>
              <a
                href={`mailto:${email}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-muted transition-colors text-popover-foreground"
                role="menuitem"
              >
                <Mail className="h-4 w-4 opacity-70" />
                Send email
              </a>
              {onCopyEmail && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onCopyEmail);
                  }}
                  className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-muted transition-colors text-popover-foreground"
                  role="menuitem"
                >
                  <Copy className="h-4 w-4 opacity-70" />
                  Copy email
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CardMenu;

