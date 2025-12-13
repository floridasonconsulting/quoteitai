
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { AIButton } from './AIButton';
import { 
  Library, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Search,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeForAI } from '@/lib/input-sanitization';

interface ContentSnippet {
  id: string;
  category: 'intro' | 'value_prop' | 'terms' | 'closing' | 'objection_response' | 'technical';
  title: string;
  content: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  lastUsed?: Date;
}

export function SmartContentLibrary() {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [contentLibrary, setContentLibrary] = useState<ContentSnippet[]>(() => {
    const saved = localStorage.getItem('smart_content_library');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContentSnippet['category']>('intro');
  const [editingSnippet, setEditingSnippet] = useState<ContentSnippet | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  
  // New snippet form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const contentAI = useAI('content_generation', {
    onSuccess: (content) => {
      setNewContent(content);
      toast.success('Content generated successfully!');
    },
    onUpgradeRequired: () => {
      setShowUpgradeDialog(true);
    }
  });

  const handleSaveSnippet = () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setShowUpgradeDialog(true);
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    const sanitizedTitle = sanitizeForAI(newTitle, 100);
    const sanitizedContent = sanitizeForAI(newContent, 5000);

    if (!sanitizedTitle || !sanitizedContent) {
      toast.error('Invalid input detected');
      return;
    }

    const snippet: ContentSnippet = {
      id: crypto.randomUUID(),
      category: selectedCategory,
      title: sanitizedTitle,
      content: sanitizedContent,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      usageCount: 0,
      createdAt: new Date()
    };

    const updated = [...contentLibrary, snippet];
    setContentLibrary(updated);
    localStorage.setItem('smart_content_library', JSON.stringify(updated));

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    toast.success('Content snippet saved!');
  };

  const handleUpdateSnippet = () => {
    if (!editingSnippet) return;

    const updated = contentLibrary.map(snippet =>
      snippet.id === editingSnippet.id ? editingSnippet : snippet
    );
    setContentLibrary(updated);
    localStorage.setItem('smart_content_library', JSON.stringify(updated));
    setShowEditDialog(false);
    setEditingSnippet(null);
    toast.success('Snippet updated!');
  };

  const handleDeleteSnippet = (id: string) => {
    const updated = contentLibrary.filter(snippet => snippet.id !== id);
    setContentLibrary(updated);
    localStorage.setItem('smart_content_library', JSON.stringify(updated));
    toast.success('Snippet deleted');
  };

  const handleCopySnippet = (snippet: ContentSnippet) => {
    navigator.clipboard.writeText(snippet.content);
    
    // Update usage stats
    const updated = contentLibrary.map(s =>
      s.id === snippet.id
        ? { ...s, usageCount: s.usageCount + 1, lastUsed: new Date() }
        : s
    );
    setContentLibrary(updated);
    localStorage.setItem('smart_content_library', JSON.stringify(updated));
    
    toast.success('Copied to clipboard!');
  };

  const handleGenerateContent = async () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setShowUpgradeDialog(true);
      return;
    }

    if (!generatePrompt.trim()) {
      toast.error('Please describe what content you need');
      return;
    }

    const sanitizedPrompt = sanitizeForAI(generatePrompt, 500);
    if (!sanitizedPrompt) {
      toast.error('Invalid prompt');
      return;
    }

    const prompt = `Generate professional business content for the following request:

${sanitizedPrompt}

Category: ${getCategoryLabel(selectedCategory)}

Provide clear, professional content that can be reused across multiple quotes and communications. Keep it concise yet impactful.`;

    await contentAI.generate(prompt, { category: selectedCategory, userRequest: sanitizedPrompt });
    setShowGenerateDialog(false);
    setGeneratePrompt('');
  };

  const getCategoryLabel = (category: ContentSnippet['category']) => {
    const labels = {
      intro: 'Introduction',
      value_prop: 'Value Proposition',
      terms: 'Terms & Conditions',
      closing: 'Closing Statement',
      objection_response: 'Objection Response',
      technical: 'Technical Details'
    };
    return labels[category];
  };

  const getCategoryColor = (category: ContentSnippet['category']) => {
    const colors = {
      intro: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      value_prop: 'bg-green-500/10 text-green-500 border-green-500/20',
      terms: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      closing: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      objection_response: 'bg-red-500/10 text-red-500 border-red-500/20',
      technical: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };
    return colors[category];
  };

  const filteredSnippets = contentLibrary.filter(snippet => {
    const matchesSearch = searchQuery.trim() === '' ||
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const groupedSnippets = filteredSnippets.reduce((acc, snippet) => {
    if (!acc[snippet.category]) acc[snippet.category] = [];
    acc[snippet.category].push(snippet);
    return acc;
  }, {} as Record<ContentSnippet['category'], ContentSnippet[]>);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5 text-purple-500" />
            Smart Content Library
            {(userRole === 'free' || userRole === 'pro' || userRole === 'business') && (
              <Badge variant="secondary" className="ml-auto">Max AI</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Store and reuse your best content snippets across quotes and emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">What is Smart Content Library?</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Save your most effective introductions, value propositions, and closing statements</li>
                  <li>Generate new content variations using AI</li>
                  <li>Track usage and performance of each snippet</li>
                  <li>Quickly copy and paste into quotes and emails</li>
                  <li>Maintain consistency across all your communications</li>
                </ul>
              </div>
            </div>
          </div>

          <Tabs defaultValue="library" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">
                Content Library ({contentLibrary.length})
              </TabsTrigger>
              <TabsTrigger value="add">Add New Content</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search snippets..."
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setShowGenerateDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>

              {contentLibrary.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Library className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No content snippets yet</p>
                  <p className="text-sm">Add your first snippet or generate one with AI</p>
                </div>
              ) : filteredSnippets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No snippets match your search</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {Object.entries(groupedSnippets).map(([category, snippets]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Badge variant="outline" className={getCategoryColor(category as ContentSnippet['category'])}>
                            {getCategoryLabel(category as ContentSnippet['category'])}
                          </Badge>
                          <span className="text-muted-foreground">({snippets.length})</span>
                        </h3>
                        <div className="space-y-2">
                          {snippets.map((snippet) => (
                            <Card key={snippet.id} className="hover:border-primary/50 transition-colors">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      {snippet.title}
                                      {snippet.usageCount > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          Used {snippet.usageCount}x
                                        </Badge>
                                      )}
                                    </CardTitle>
                                    {snippet.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {snippet.tags.map((tag, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleCopySnippet(snippet)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setEditingSnippet(snippet);
                                        setShowEditDialog(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteSnippet(snippet.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {snippet.content}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ContentSnippet['category'])}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="intro">Intro</TabsTrigger>
                    <TabsTrigger value="value_prop">Value</TabsTrigger>
                    <TabsTrigger value="terms">Terms</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-3 mt-2">
                    <TabsTrigger value="closing">Closing</TabsTrigger>
                    <TabsTrigger value="objection_response">Objections</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Standard Welcome Introduction"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter your content snippet..."
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {newContent.length}/5000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g., professional, friendly, technical"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSnippet}
                  className="flex-1 gap-2"
                  disabled={!newTitle.trim() || !newContent.trim()}
                >
                  <Plus className="h-4 w-4" />
                  Save Snippet
                </Button>
                <Button
                  onClick={() => setShowGenerateDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content Snippet</DialogTitle>
          </DialogHeader>
          {editingSnippet && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingSnippet.title}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editingSnippet.content}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, content: e.target.value })}
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={editingSnippet.tags.join(', ')}
                  onChange={(e) => setEditingSnippet({
                    ...editingSnippet,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateSnippet} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Generate Content with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ContentSnippet['category'])}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="intro">Intro</TabsTrigger>
                  <TabsTrigger value="value_prop">Value</TabsTrigger>
                  <TabsTrigger value="terms">Terms</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-3 mt-2">
                  <TabsTrigger value="closing">Closing</TabsTrigger>
                  <TabsTrigger value="objection_response">Objections</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label>What content do you need?</Label>
              <Textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="Describe the content you want AI to generate..."
                rows={4}
              />
            </div>
            <AIButton
              onClick={handleGenerateContent}
              isLoading={contentAI.isLoading}
              disabled={!generatePrompt.trim()}
              className="w-full"
            >
              Generate Content
            </AIButton>
          </div>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="smart_content_library"
        requiredTier="max"
      />
    </>
  );
}
