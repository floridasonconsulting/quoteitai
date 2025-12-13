import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, Calendar, Trash2, Bell, X, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getQuotes, deleteQuote, clearAllQuotes } from '@/lib/db-service';
import { getQuoteAge } from '@/lib/quote-utils';
import { Quote, QuoteAge, Customer } from '@/types';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncManager } from '@/hooks/useSyncManager';
import { supabase } from '@/integrations/supabase/client';
import { getCustomers } from '@/lib/db-service';
import { debugQuoteStorage, nuclearClearAllQuotes } from '@/lib/debug-quotes';

export default function Quotes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dueFollowUpIds } = useNotifications();
  const { user } = useAuth();
  const { queueChange, clearQueue } = useSyncManager();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<string[]>([]);

  const loadQuotes = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    console.log('[Quotes] Loading quotes for user:', user.id);
    setLoading(true);
    
    try {
      const [quotesData, customersData] = await Promise.all([
        getQuotes(user.id),
        getCustomers(user.id)
      ]);
      
      console.log(`[Quotes] Loaded ${quotesData.length} quotes`);
      setQuotes(quotesData);
      setCustomers(customersData);
      setSelectedQuotes([]);
    } catch (error) {
      console.error('[Quotes] Error loading quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
    
    // Read URL parameters
    const status = searchParams.get('status');
    const age = searchParams.get('age');
    const filter = searchParams.get('filter');
    
    if (status) setStatusFilter(status);
    if (age) setAgeFilter(age);
    
    // Load notification filter
    if (filter === 'notifications' && user) {
      loadNotificationFilter();
    }
  }, [searchParams, user]);

  const loadNotificationFilter = async () => {
    if (!user) return;
    
    try {
      // Fetch recent notifications (last 24 hours or unread)
      const { data: notifications } = await supabase
        .from('notifications')
        .select('quote_id')
        .eq('user_id', user.id)
        .or('read.eq.false,created_at.gte.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .not('quote_id', 'is', null);
      
      if (notifications) {
        const quoteIds = notifications.map(n => n.quote_id).filter(Boolean) as string[];
        setNotificationFilter(quoteIds);
      }
    } catch (error) {
      console.error('Error loading notification filter:', error);
    }
  };

  // Real-time updates for quote status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Quote updated:', payload);
          loadQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Refresh data when navigating back to the page (with delay to prevent excessive reloads)
  useEffect(() => {
    let lastFocusTime = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const timeSinceFocus = Date.now() - lastFocusTime;
        if (timeSinceFocus > 5000) {
          loadQuotes();
        }
        lastFocusTime = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const age = getQuoteAge(quote);
    const matchesAge = ageFilter === 'all' || age === ageFilter;
    const matchesNotification = notificationFilter.length === 0 || notificationFilter.includes(quote.id);
    return matchesSearch && matchesStatus && matchesAge && matchesNotification;
  });

  const clearNotificationFilter = () => {
    setNotificationFilter([]);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filter');
    setSearchParams(newParams);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuotes(filteredQuotes.map(q => q.id));
    } else {
      setSelectedQuotes([]);
    }
  };

  const handleSelectQuote = (quoteId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuotes([...selectedQuotes, quoteId]);
    } else {
      setSelectedQuotes(selectedQuotes.filter(id => id !== quoteId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuotes.length === 0 || !user?.id) return;
    
    const confirmMessage = selectedQuotes.length === quotes.length
      ? '⚠️ CRITICAL: This will permanently delete ALL quotes from ALL storage locations (Supabase, IndexedDB, localStorage, cache). This action CANNOT be undone. Are you absolutely sure?'
      : `Are you sure you want to delete ${selectedQuotes.length} quote${selectedQuotes.length > 1 ? 's' : ''}?`;
    
    if (!confirm(confirmMessage)) return;
    
    console.log(`[Quotes] ========== BULK DELETE STARTED ==========`);
    console.log(`[Quotes] Deleting ${selectedQuotes.length} quotes`);
    
    try {
      // If deleting all quotes, use nuclear clear for complete removal
      if (selectedQuotes.length === quotes.length) {
        console.log('[Quotes] ☢️ NUCLEAR DELETE: Clearing ALL quotes from ALL sources');
        
        // 1. Optimistically clear UI
        setQuotes([]);
        setSelectedQuotes([]);
        
        // 2. Clear sync queue first to prevent restoration
        console.log('[Quotes] Step 1: Clearing sync queue...');
        clearQueue();
        
        // 3. Use clearAllQuotes which handles all storage layers
        console.log('[Quotes] Step 2: Clearing all storage layers...');
        await clearAllQuotes(user.id);
        
        // 4. Double-check with debug tool
        console.log('[Quotes] Step 3: Running debug check...');
        await debugQuoteStorage(user.id);
        
        toast.success('All quotes deleted successfully');
      } else {
        // Delete individual quotes
        console.log('[Quotes] Deleting selected quotes individually');
        
        // Optimistically remove from UI
        setQuotes(quotes.filter(q => !selectedQuotes.includes(q.id)));
        setSelectedQuotes([]);
        
        // Delete from all sources
        for (const quoteId of selectedQuotes) {
          await deleteQuote(user.id, quoteId, queueChange);
        }
        
        toast.success(`Deleted ${selectedQuotes.length} quote${selectedQuotes.length > 1 ? 's' : ''}`);
      }
      
      // Force reload after a delay to ensure all operations complete
      console.log('[Quotes] Step 4: Force reloading quotes...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadQuotes();
      
      console.log('[Quotes] ========== BULK DELETE COMPLETE ==========');
      
    } catch (error) {
      console.error('[Quotes] ❌ Error during bulk delete:', error);
      toast.error('Failed to delete quotes. Please try again.');
      // Reload on error to ensure consistency
      await loadQuotes();
    }
  };

  const handleDebugStorage = async () => {
    if (!user?.id) return;
    await debugQuoteStorage(user.id);
    toast.info('Debug report printed to console');
  };

  const handleNuclearClear = async () => {
    if (!user?.id) return;
    
    if (!confirm('⚠️ NUCLEAR OPTION: This will completely obliterate ALL quote data from EVERY storage location. This is irreversible. Continue?')) {
      return;
    }
    
    await nuclearClearAllQuotes(user.id);
    toast.success('Nuclear clear complete. Refreshing page...');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-success/10 text-success border-success/20';
      case 'sent': return 'bg-primary/10 text-primary border-primary/20';
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      case 'declined': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAgeColor = (age: string) => {
    switch (age) {
      case 'fresh': return 'bg-success/10 text-success border-success/20';
      case 'warm': return 'bg-warning/10 text-warning border-warning/20';
      case 'aging': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'stale': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
          <p className="text-muted-foreground">
            Manage and track all your quotes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDebugStorage}
            title="Print debug info to console"
          >
            <Bug className="h-4 w-4" />
          </Button>
          <Button size="lg" onClick={() => navigate('/quotes/new')}>
            <Plus className="mr-2 h-5 w-5" />
            Create Quote
          </Button>
        </div>
      </div>

      {notificationFilter.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Showing {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''} with notifications
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearNotificationFilter}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuotes.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedQuotes.length} quote{selectedQuotes.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {selectedQuotes.length === quotes.length && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleNuclearClear}
                    title="Nuclear option: Clear ALL quote data from ALL sources"
                  >
                    ☢️ Nuclear Clear
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="aging">Aging</SelectItem>
                <SelectItem value="stale">Stale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading quotes...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? (
                <p>No quotes found matching your filters</p>
              ) : (
                <>
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="mb-4">No quotes yet. Create your first quote to get started!</p>
                  <Button onClick={() => navigate('/quotes/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quote
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotes.length > 0 && (
                <div className="flex items-center gap-2 p-2 border-b">
                  <Checkbox
                    checked={selectedQuotes.length === filteredQuotes.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              )}
              {filteredQuotes.map((quote) => {
                const age = getQuoteAge(quote);
                const isSelected = selectedQuotes.includes(quote.id);
                const customer = customers.find(c => c.id === quote.customerId);
                return (
                  <div
                    key={quote.id}
                    className={`flex items-start gap-3 p-3 md:p-4 border rounded-lg transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/5 border-primary ring-2 ring-primary/20' 
                        : 'hover:bg-muted/50 hover:shadow-md hover:border-primary/30'
                    }`}
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectQuote(quote.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Title Section */}
                      <div className="space-y-2">
                        <h3 className="text-base md:text-lg font-semibold leading-tight line-clamp-2 text-center md:text-left">
                          {quote.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                          <Badge variant="outline" className={`text-xs whitespace-nowrap ${getStatusColor(quote.status)}`}>
                            {quote.status}
                          </Badge>
                          {quote.status === 'sent' && (
                            <Badge variant="outline" className={`text-xs whitespace-nowrap ${getAgeColor(age)}`}>
                              {age}
                            </Badge>
                          )}
                          {dueFollowUpIds.includes(quote.id) && (
                            <Badge variant="default" className="text-xs whitespace-nowrap bg-warning text-warning-foreground">
                              <Bell className="h-3 w-3 mr-1" />
                              Follow-up Due
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Separator */}
                      <div className="border-t" />
                      
                      {/* Content Section */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        {/* Metadata */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium">{quote.customerName}</span>
                            {customer && (customer.contactFirstName || customer.contactLastName) && (
                              <span className="text-xs">
                                {customer.contactFirstName} {customer.contactLastName}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {quote.quoteNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Price Section */}
                        <div className="text-left md:text-right">
                          <p className="text-xl md:text-2xl font-bold text-primary">{formatCurrency(quote.total)}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}