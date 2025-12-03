
import { ProposalData } from '@/types/proposal';

interface LineItemSectionProps {
  section: Extract<ProposalData['sections'][0], { type: 'lineItems' }>;
}

export function LineItemSection({ section }: LineItemSectionProps) {
  return (
    <div 
      className="w-full py-12 px-4"
      style={{
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <h2 
          className="text-3xl font-bold mb-8 text-center"
          style={{
            color: 'var(--theme-text-primary)',
            fontSize: 'var(--theme-font-size-h2, 2rem)',
            fontWeight: 'var(--theme-font-weight-heading, 700)',
          }}
        >
          {section.title}
        </h2>
        
        <div 
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-surface)',
            boxShadow: 'var(--theme-shadow-md)',
            border: '1px solid var(--theme-border)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead 
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  borderBottom: '2px solid var(--theme-border)',
                }}
              >
                <tr>
                  <th 
                    className="p-4 text-xs uppercase tracking-wider font-semibold"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Item
                  </th>
                  <th 
                    className="p-4 text-xs uppercase tracking-wider font-semibold"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Description
                  </th>
                  <th 
                    className="p-4 text-xs uppercase tracking-wider font-semibold text-center"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Qty
                  </th>
                  <th 
                    className="p-4 text-xs uppercase tracking-wider font-semibold text-right"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Price
                  </th>
                  <th 
                    className="p-4 text-xs uppercase tracking-wider font-semibold text-right"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, idx) => (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--theme-border)',
                    }}
                  >
                    <td 
                      className="p-4 font-semibold"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {item.name}
                    </td>
                    <td 
                      className="p-4 text-sm"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      {item.description}
                    </td>
                    <td 
                      className="p-4 text-center"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      {item.quantity}
                    </td>
                    <td 
                      className="p-4 text-right font-mono"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      ${item.price.toLocaleString()}
                    </td>
                    <td 
                      className="p-4 text-right font-mono font-semibold"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      ${item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
