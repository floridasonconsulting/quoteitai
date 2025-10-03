import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getQuotes, deleteQuote, saveQuotes } from '@/lib/storage';
import { getQuoteAge } from '@/lib/quote-utils';
import { Quote, QuoteAge } from '@/types';
import { toast } from 'sonner';

export default function Quotes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  useEffect(() => {
    loadQuotes();
    
    // Read URL parameters
    const status = searchParams.get('status');
    const age = searchParams.get('age');
    
    if (status) setStatusFilter(status);
    if (age) setAgeFilter(age);
  }, [searchParams]);

  const loadQuotes = () => {
    setQuotes(getQuotes());
    setSelectedQuotes([]);
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const age = getQuoteAge(quote);
    const matchesAge = ageFilter === 'all' || age === ageFilter;
    return matchesSearch && matchesStatus && matchesAge;
  });

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

  const handleBulkDelete = () => {
    if (selectedQuotes.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedQuotes.length} quote${selectedQuotes.length > 1 ? 's' : ''}?`)) {
      const remainingQuotes = quotes.filter(q => !selectedQuotes.includes(q.id));
      saveQuotes(remainingQuotes);
      loadQuotes();
      toast.success(`Deleted ${selectedQuotes.length} quote${selectedQuotes.length > 1 ? 's' : ''}`);
    }
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
          <p className="text-muted-foreground">
            Manage and track all your quotes
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/quotes/new')}>
          <Plus className="mr-2 h-5 w-5" />
          Create Quote
        </Button>
      </div>

      {selectedQuotes.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedQuotes.length} quote{selectedQuotes.length > 1 ? 's' : ''} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
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
          {filteredQuotes.length === 0 ? (
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
                return (
                  <div
                    key={quote.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectQuote(quote.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="flex-1 flex items-center justify-between cursor-pointer"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{quote.title}</p>
                          <Badge variant="outline" className={getStatusColor(quote.status)}>
                            {quote.status}
                          </Badge>
                          {quote.status === 'sent' && (
                            <Badge variant="outline" className={getAgeColor(age)}>
                              {age}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>{quote.customerName}</span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {quote.quoteNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-primary">${quote.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                        </p>
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
