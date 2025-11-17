import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Item } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ItemCatalogSidebarProps {
  items: Item[];
  onAddItem: (item: Item) => void;
}

export function ItemCatalogSidebar({ items, onAddItem }: ItemCatalogSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  const categories = ['all', ...new Set(items.map(item => item.category))];
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
      (item.category && item.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
    const matchesSearch = itemSearchTerm === '' ||
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(itemSearchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <Card className="sticky top-6">
      <CardHeader className="space-y-3">
        <CardTitle>Item Catalog</CardTitle>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search items..."
            value={itemSearchTerm}
            onChange={(e) => setItemSearchTerm(e.target.value)}
            className="pr-8"
          />
          {itemSearchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setItemSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent data-demo="item-catalog">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {itemSearchTerm ? 'No items match your search' : 'No items in this category'}
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onAddItem(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.units && <p className="text-xs text-muted-foreground mt-1">
                      {item.units}
                    </p>}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {formatCurrency(item.finalPrice)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
