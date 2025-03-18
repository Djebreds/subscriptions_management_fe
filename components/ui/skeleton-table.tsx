import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonTable() {
  return (
    <div className='w-full mt-8'>
      <div className='flex justify-between border-b pb-2 mb-2'>
        <Skeleton className='h-6 w-1/4' />
        <Skeleton className='h-6 w-1/6' />
        <Skeleton className='h-6 w-1/6' />
        <Skeleton className='h-6 w-1/6' />
      </div>

      <div className='space-y-3'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className='flex justify-between items-center py-2'>
            <Skeleton className='h-6 w-1/4' />
            <Skeleton className='h-6 w-1/6' />
            <Skeleton className='h-6 w-1/6' />
            <Skeleton className='h-6 w-1/6' />
          </div>
        ))}
      </div>
    </div>
  );
}
