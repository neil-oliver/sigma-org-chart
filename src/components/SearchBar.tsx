import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, User, Building2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { UserData } from '../types';

interface SearchBarProps {
  users: UserData[];
  onSelectUser: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  user: UserData;
  matchType: 'name' | 'email' | 'title' | 'org';
  matchText: string;
}

/**
 * Type-ahead search bar for finding employees
 */
const SearchBar: React.FC<SearchBarProps> = ({
  users,
  onSelectUser,
  placeholder = 'Search by name, email, or title...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    for (const user of users) {
      // Check name
      if (user.fullName.toLowerCase().includes(q)) {
        matches.push({ user, matchType: 'name', matchText: user.fullName });
        continue;
      }
      // Check email
      if (user.email?.toLowerCase().includes(q)) {
        matches.push({ user, matchType: 'email', matchText: user.email });
        continue;
      }
      // Check job title
      if (user.jobTitle?.toLowerCase().includes(q)) {
        matches.push({ user, matchType: 'title', matchText: user.jobTitle });
        continue;
      }
      // Check org unit
      if (user.organizationUnit?.toLowerCase().includes(q)) {
        matches.push({ user, matchType: 'org', matchText: user.organizationUnit });
        continue;
      }
    }

    return matches.slice(0, 10); // Limit to 10 results
  }, [query, users]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].user.fullName);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-auto"
        >
          {results.map((result, index) => (
            <button
              key={result.user.fullName}
              onClick={() => handleSelect(result.user.fullName)}
              className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-muted transition-colors ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{result.user.fullName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  {result.matchType === 'org' && <Building2 className="h-3 w-3" />}
                  <span>{result.matchText}</span>
                  {result.matchType !== 'name' && (
                    <span className="opacity-50">• {result.user.jobTitle}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground text-sm">
          No employees found matching "{query}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;

