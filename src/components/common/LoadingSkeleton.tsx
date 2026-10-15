import React from 'react';

export const CardSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div
      className={`p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs animate-pulse space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[#EAE8E3] rounded w-1/3" />
        <div className="h-3 bg-[#EAE8E3] rounded w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-[#F2EFEB] rounded"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const MetricSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg shadow-xs animate-pulse space-y-2">
      <div className="h-2.5 bg-[#EAE8E3] rounded w-1/2" />
      <div className="h-7 bg-[#F2EFEB] rounded w-2/3" />
    </div>
  );
};
