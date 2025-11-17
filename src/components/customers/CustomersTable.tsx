
import { Mail, Phone, Edit, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Customer } from '@/types';

interface CustomersTableProps {
  customers: Customer[];
  selectedCustomers: string[];
  onSelectCustomer: (customerId: string, checked: boolean) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

export function CustomersTable({
  customers,
  selectedCustomers,
  onSelectCustomer,
  onEdit,
  onDelete
}: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No customers found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {customers.map((customer) => {
        const isSelected = selectedCustomers.includes(customer.id);
        return (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow relative">
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectCustomer(customer.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <CardHeader className="pb-3 pl-10">
              <CardTitle className="text-lg break-words">{customer.name}</CardTitle>
              {(customer.contactFirstName || customer.contactLastName) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Contact: {customer.contactFirstName} {customer.contactLastName}
                </p>
              )}
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                    {customer.email}
                  </a>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <a href={`tel:${customer.phone}`} className="hover:underline truncate">
                      {customer.phone}
                    </a>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {(customer.address || customer.city) && (
                <div className="flex items-center gap-2 min-w-0 mb-3">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [customer.address, customer.city, customer.state, customer.zip]
                        .filter(Boolean)
                        .join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary hover:underline break-words"
                  >
                    {[customer.address, customer.city, customer.state, customer.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(customer)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const fullAddress = [customer.address, customer.city, customer.state, customer.zip]
                      .filter(Boolean)
                      .join(', ');
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
                      '_blank'
                    );
                  }}
                  className="flex-1"
                  disabled={!customer.address && !customer.city}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Directions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(customer.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
