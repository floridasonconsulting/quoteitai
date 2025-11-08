import { formatCSVLine } from './csv-utils';

export const generateCustomerTemplate = (): string => {
  const headers = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'contactFirstName', 'contactLastName'];
  const sample1 = ['Acme Corporation', 'john.doe@acme.com', '555-0100', '123 Main Street', 'Springfield', 'IL', '62701', 'John', 'Doe'];
  const sample2 = ['Beta Industries', 'jane.smith@beta.com', '555-0200', '456 Oak Avenue', 'Chicago', 'IL', '60601', 'Jane', 'Smith'];
  
  return [
    formatCSVLine(headers),
    formatCSVLine(sample1),
    formatCSVLine(sample2)
  ].join('\n');
};

export const generateItemTemplate = (): string => {
  const headers = ['name', 'description', 'category', 'basePrice', 'markup', 'markupType', 'units'];
  const sample1 = ['Premium Widget', 'High-quality widget for professional use', 'Widgets', '100.00', '15', 'percentage', 'Each'];
  const sample2 = ['Standard Service', 'Basic installation service', 'Services', '50.00', '10.00', 'fixed', 'Hour'];
  
  return [
    formatCSVLine(headers),
    formatCSVLine(sample1),
    formatCSVLine(sample2)
  ].join('\n');
};

export const downloadTemplate = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
