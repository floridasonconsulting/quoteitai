
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ItemsTableProps {
  items: Item[];
  selectedItems: string[];
  onSelectItem: (itemId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function ItemsTable({
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onEdit,
  onDelete
}: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No items found matching your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Checkbox
          checked={selectedItems.length === items.length}
          onCheckedChange={onSelectAll}
          aria-label="Select all items"
        />
        <span className="text-sm text-muted-foreground">
          {selectedItems.length > 0
            ? `${selectedItems.length} of ${items.length} selected`
            : `${items.length} item${items.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => onSelectItem(item.id, checked as boolean)}
                    aria-label={`Select ${item.name}`}
                    className="mt-1"
                  />
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </div>
                <Badge variant="secondary">{item.category}</Badge>
              </div>
              {item.description && (
                <CardDescription className="line-clamp-2">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Units:</span>
                  <span>{item.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span>{formatCurrency(item.basePrice || 0)}</span>
                </div>
                {(item.markup || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Markup:</span>
                    <span>
                      {item.markupType === 'percentage'
                        ? `${item.markup || 0}%`
                        : formatCurrency(item.markup || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Final Price:</span>
                  <span className="text-primary">{formatCurrency(item.finalPrice || 0)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
