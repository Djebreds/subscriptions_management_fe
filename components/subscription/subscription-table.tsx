'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export default function SubscriptionTable({
  subscriptions,
  loading,
  page,
  nextPage,
  prevPage,
  setPage,
  openDetailModal,
  openUpdateModal,
  confirmDelete,
  filters,
  setFilters,
}: any) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const debouncedUpdate = useDebouncedCallback((updatedFilters) => {
    setFilters(updatedFilters);
  }, 500);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updated = { ...localFilters };

    if (value === '') {
      delete updated[name];
    } else {
      updated[name] = value;
    }

    setLocalFilters(updated);
    debouncedUpdate(updated);
  };

  const handleSelectChange = (name, value) => {
    const updated = { ...localFilters };

    if (value === 'all') {
      delete updated[name];
    } else {
      updated[name] = value;
    }

    setLocalFilters(updated);
    debouncedUpdate(updated);
  };

  return (
    <>
      <div className='grid grid-cols-2 gap-4 mt-4'>
        <Input
          name='service_name'
          placeholder='Service Name'
          value={localFilters.service_name ?? ''}
          onChange={handleInputChange}
        />
        <Select
          value={localFilters.billing_cycle ?? 'all'}
          onValueChange={(value) => handleSelectChange('billing_cycle', value)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Billing Cycle' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='monthly'>Monthly</SelectItem>
            <SelectItem value='annual'>Annual</SelectItem>
          </SelectContent>
        </Select>
        <Input
          name='min_price'
          type='number'
          placeholder='Min Price'
          value={localFilters.min_price ?? ''}
          onChange={handleInputChange}
        />
        <Input
          name='max_price'
          type='number'
          placeholder='Max Price'
          value={localFilters.max_price ?? ''}
          onChange={handleInputChange}
        />
        <Input
          name='min_renewal_date'
          type='date'
          value={localFilters.min_renewal_date ?? ''}
          onChange={handleInputChange}
        />
        <Input
          name='max_renewal_date'
          type='date'
          value={localFilters.max_renewal_date ?? ''}
          onChange={handleInputChange}
        />
      </div>

      {loading ? (
        <>
          <SkeletonTable />
        </>
      ) : (
        <>
          <Table className='mt-6 w-full'>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.service_name}</TableCell>
                  <TableCell>{sub.price}﷼</TableCell>
                  <TableCell>{sub.billing_cycle}</TableCell>
                  <TableCell>
                    {new Date(sub.renewal_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      className='ml-2'
                      onClick={() => openDetailModal(sub)}
                    >
                      Details
                    </Button>
                    <Button
                      className='ml-2'
                      onClick={() => openUpdateModal(sub)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={() => confirmDelete(sub.id)}
                      className='ml-2'
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='flex justify-between mt-4'>
            <Button
              onClick={() => setPage((prev) => prev - 1)}
              disabled={!prevPage}
            >
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!nextPage}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </>
  );
}
