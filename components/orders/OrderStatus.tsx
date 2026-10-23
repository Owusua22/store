// src/components/orders/OrderStatus.tsx
import { cn } from '@/lib/utils';
import type { OrderStatus as OrderStatusType } from '@/types';

const STATUS_CONFIG: Record<OrderStatusType, { label: string; className: string; step: number }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', step: 1 },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800', step: 2 },
  processing: { label: 'Processing', className: 'bg-indigo-100 text-indigo-800', step: 3 },
  shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-800', step: 4 },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800', step: 5 },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800', step: 0 },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800', step: 0 },
};

interface OrderStatusProps {
  status: OrderStatusType;
  showBadge?: boolean;
  showTimeline?: boolean;
}

export function OrderStatus({ status, showBadge = true, showTimeline = false }: OrderStatusProps) {
  const config = STATUS_CONFIG[status];
  const timelineStatuses: OrderStatusType[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  return (
    <div>
      {showBadge && (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
          {config.label}
        </span>
      )}

      {showTimeline && !['cancelled', 'refunded'].includes(status) && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            {timelineStatuses.map((s, i) => {
              const sConfig = STATUS_CONFIG[s];
              const isCompleted = config.step > sConfig.step;
              const isCurrent = status === s;

              return (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div className="relative flex items-center justify-center w-full">
                    {i > 0 && (
                      <div
                        className={cn(
                          'absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2',
                          isCompleted || isCurrent ? 'bg-indigo-600' : 'bg-gray-200'
                        )}
                      />
                    )}
                    {i < timelineStatuses.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2',
                          isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        isCompleted ? 'bg-indigo-600 text-white' :
                        isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                        'bg-gray-200 text-gray-500'
                      )}
                    >
                      {isCompleted ? '✓' : i + 1}
                    </div>
                  </div>
                  <p className={cn(
                    'mt-2 text-xs text-center',
                    isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-500'
                  )}>
                    {sConfig.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}