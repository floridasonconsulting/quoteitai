
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { Brain, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeForAI } from '@/lib/input-sanitization';

interface TrainingData {
  id: string;
  category: 'product_knowledge' | 'company_voice' | 'pricing_rules' | 'objection_handling';
  title: string;
  content: string;
  createdAt: Date;
}

export function CustomAITrainingSection() {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [trainingDataList, setTrainingDataList] = useState<TrainingData[]>(() => {
    const saved = localStorage.getItem('ai_training_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TrainingData['category']>('product_knowledge');

  const handleSaveTrainingData = () => {
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

    const newData: TrainingData = {
      id: crypto.randomUUID(),
      category: selectedCategory,
      title: sanitizedTitle,
      content: sanitizedContent,
      createdAt: new Date()
    };

    const updated = [...trainingDataList, newData];
    setTrainingDataList(updated);
    localStorage.setItem('ai_training_data', JSON.stringify(updated));

    setNewTitle('');
    setNewContent('');
    toast.success('Training data saved successfully');
  };

  const handleDeleteTrainingData = (id: string) => {
    const updated = trainingDataList.filter(item => item.id !== id);
    setTrainingDataList(updated);
    localStorage.setItem('ai_training_data', JSON.stringify(updated));
    toast.success('Training data deleted');
  };

  const getCategoryLabel = (category: TrainingData['category']) => {
    const labels = {
      product_knowledge: 'Product Knowledge',
      company_voice: 'Company Voice & Tone',
      pricing_rules: 'Pricing Rules',
      objection_handling: 'Objection Handling'
    };
    return labels[category];
  };

  const getCategoryColor = (category: TrainingData['category']) => {
    const colors = {
      product_knowledge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      company_voice: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      pricing_rules: 'bg-green-500/10 text-green-500 border-green-500/20',
      objection_handling: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    };
    return colors[category];
  };

  const groupedData = trainingDataList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<TrainingData['category'], TrainingData[]>);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Custom AI Training
            {(userRole === 'free' || userRole === 'pro' || userRole === 'business') && (
              <Badge variant="secondary" className="ml-auto">Max AI</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Train the AI on your business-specific knowledge, pricing strategies, and communication style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">How Custom AI Training Works:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Add specific knowledge about your products, services, and processes</li>
                  <li>Define your company's communication voice and tone</li>
                  <li>Set pricing rules and guidelines for AI to follow</li>
                  <li>Teach AI how to handle common customer objections</li>
                  <li>AI will use this data to generate more accurate, on-brand content</li>
                </ul>
              </div>
            </div>
          </div>

          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add Training Data</TabsTrigger>
              <TabsTrigger value="view">View & Manage ({trainingDataList.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TrainingData['category'])}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="product_knowledge">Products</TabsTrigger>
                    <TabsTrigger value="company_voice">Voice</TabsTrigger>
                    <TabsTrigger value="pricing_rules">Pricing</TabsTrigger>
                    <TabsTrigger value="objection_handling">Objections</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Standard HVAC Installation Process"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Training Content</Label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={
                    selectedCategory === 'product_knowledge'
                      ? 'Describe your products, services, typical use cases, technical specifications...'
                      : selectedCategory === 'company_voice'
                      ? 'Describe your brand voice, tone, key phrases, communication style...'
                      : selectedCategory === 'pricing_rules'
                      ? 'Define pricing strategies, discount rules, minimum margins, competitive positioning...'
                      : 'List common objections and your proven responses, success stories, value propositions...'
                  }
                  rows={8}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {newContent.length}/5000 characters
                </p>
              </div>

              <Button
                onClick={handleSaveTrainingData}
                className="w-full gap-2"
                disabled={!newTitle.trim() || !newContent.trim()}
              >
                <Save className="h-4 w-4" />
                Save Training Data
              </Button>
            </TabsContent>

            <TabsContent value="view" className="mt-4">
              {trainingDataList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No training data yet</p>
                  <p className="text-sm">Add training data to customize AI behavior</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {Object.entries(groupedData).map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Badge variant="outline" className={getCategoryColor(category as TrainingData['category'])}>
                            {getCategoryLabel(category as TrainingData['category'])}
                          </Badge>
                          <span className="text-muted-foreground">({items.length})</span>
                        </h3>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <Card key={item.id} className="hover:border-primary/50 transition-colors">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <CardTitle className="text-sm">{item.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                      Added {new Date(item.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteTrainingData(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {item.content}
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
          </Tabs>
        </CardContent>
      </Card>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="custom_ai_training"
        requiredTier="max"
      />
    </>
  );
}
