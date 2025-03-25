'use client';

import SubscriptionTable from '@/components/subscription/subscription-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoaderSpinner } from '@/components/ui/loader-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  importSubscriptions,
  updateSubscription,
} from '@/lib/subscription';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

interface Errors {
  serviceName: string;
  price: string;
  billingCyle: string;
}

const subscriptionSchema = z.object({
  serviceName: z.string().nonempty({ message: 'Service Name is required.' }),
  price: z
    .string()
    .regex(/^[0-9]+(\.[0-9]{1,2})?$/, 'Price must be a valid number'),
  billingCycle: z.enum(['monthly', 'annual'], {
    errorMap: () => ({ message: 'Billing cycle is required' }),
  }),
});

export default function Subscription() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('');
  const [errors, setErrors] = useState<Errors>({
    serviceName: '',
    price: '',
    billingCyle: '',
  });
  const [filters, setFilters] = useState({
    service_name: '',
    billing_cycle: '',
    min_price: '',
    max_price: '',
    min_renewal_date: '',
    max_renewal_date: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateServiceName, setUpdateServiceName] = useState('');
  const [updatePrice, setUpdatePrice] = useState('');
  const [updateBillingCycle, setUpdateBillingCycle] = useState('');
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [page, filters]);

  const loadSubscriptions = async (overrideFilters = filters) => {
    try {
      setLoading(true);
      const { data, error } = await getSubscriptions({
        ...overrideFilters,
        page: page.toString(),
      });

      if (error) {
        toast.error(error, { position: 'top-center' });
        return;
      }

      setSubscriptions(data.results || []);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong.', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setSelectedId(id);
    setConfirmDeleteOpen(true);
  };

  const openUpdateModal = (subscription) => {
    setSelectedSubscription(subscription);
    setUpdateServiceName(subscription.service_name);
    setUpdatePrice(subscription.price.toString());
    setUpdateBillingCycle(subscription.billing_cycle);
    setUpdateModalOpen(true);
  };

  const handleCreateSubscription = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrors({ serviceName: '', price: '', billingCyle: '' });

    const validationResult = subscriptionSchema.safeParse({
      serviceName,
      price,
      billingCycle,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setErrors({
        serviceName: fieldErrors.serviceName?.join(' ') || '',
        price: fieldErrors.price?.join(' ') || '',
        billingCyle: fieldErrors.billingCycle?.join(' ') || '',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await createSubscription({
        service_name: serviceName,
        price: parseFloat(price),
        billing_cycle: billingCycle,
      });

      if (error) {
        toast.error(error, { position: 'top-center' });
        return;
      }

      setSubscriptions([...subscriptions, data]);
      setServiceName('');
      setPrice('');
      setBillingCycle('');
      setModalOpen(false);
      toast.success('New subscription added.', { position: 'top-center' });
    } catch (error: unknown) {
      console.error(error);
      toast.error('Something went wrong', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrors({ serviceName: '', price: '', billingCyle: '' });

    const validationResult = subscriptionSchema.safeParse({
      serviceName: updateServiceName,
      price: updatePrice,
      billingCycle: updateBillingCycle,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setErrors({
        serviceName: fieldErrors.serviceName?.join(' ') || '',
        price: fieldErrors.price?.join(' ') || '',
        billingCyle: fieldErrors.billingCycle?.join(' ') || '',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await updateSubscription(
        selectedSubscription.id,
        {
          service_name: updateServiceName,
          price: parseFloat(updatePrice),
          billing_cycle: updateBillingCycle,
        }
      );

      if (error) {
        toast.error(error, { position: 'top-center' });
        return;
      }

      const updated = subscriptions.map((sub) =>
        sub.id === data.id ? data : sub
      );
      setSubscriptions(updated);
      setUpdateModalOpen(false);
      toast.success('Subscription updated successfully.', {
        position: 'top-center',
      });
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async () => {
    try {
      setLoading(true);
      const { error } = await deleteSubscription(selectedId);

      if (error) {
        toast.error(error, { position: 'top-center' });
        return;
      }

      const updated = subscriptions.filter((sub) => sub.id !== selectedId);
      setSubscriptions(updated);
      setConfirmDeleteOpen(false);
      toast.success('Subscription has been deleted.', {
        position: 'top-center',
      });
      loadSubscriptions();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong.', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    const { data, error } = await importSubscriptions(formData);

    if (error) {
      toast.error(error, { position: 'top-center' });
    } else {
      setSubscriptions(data.results || []);
      setCsvImportModalOpen(false);
      loadSubscriptions();
      toast.success('Successfuly to import subscriptions', {
        position: 'top-center',
      });
    }

    setLoading(false);
  };

  const openDetailModal = (subscription) => {
    setSelectedSubscription(subscription);
    setDetailModalOpen(true);
  };

  return (
    <div className='p-5'>
      <div className='flex gap-5 justify-between'>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className='mt-6'>Add Subscription</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubscription}>
              <div className='mb-3'>
                <Input
                  placeholder='Service Name'
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
                {errors.serviceName && (
                  <p className='text-red-500 text-sm'>{errors.serviceName}</p>
                )}
              </div>

              <div className='mb-3'>
                <Input
                  placeholder='Price'
                  type='number'
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {errors.price && (
                  <p className='text-red-500 text-sm'>{errors.price}</p>
                )}
              </div>

              <div className='mb-3'>
                <Select onValueChange={(value) => setBillingCycle(value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Billing Cycle' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                    <SelectItem value='annual'>Annual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.billingCyle && (
                  <p className='text-red-500 text-sm'>{errors.billingCyle}</p>
                )}
              </div>

              <Button type='submit' className='mt-2 w-full' disabled={loading}>
                {loading ? (
                  <>
                    <LoaderSpinner className='text-center' />
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={csvImportModalOpen} onOpenChange={setCsvImportModalOpen}>
          <DialogTrigger asChild>
            <Button className='mt-6'>Import CSV</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import CSV</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col gap-4'>
              <Input
                type='file'
                accept='.csv'
                onChange={(e) => {
                  if (e.target.files) {
                    setCsvFile(e.target.files[0]);
                  }
                }}
              />
              <Button onClick={handleCSVImport} disabled={loading || !csvFile}>
                {loading ? <LoaderSpinner className='text-center' /> : 'Import'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SubscriptionTable
        subscriptions={subscriptions}
        loading={loading}
        page={page}
        nextPage={nextPage}
        prevPage={prevPage}
        setPage={setPage}
        openDetailModal={openDetailModal}
        openUpdateModal={openUpdateModal}
        confirmDelete={confirmDelete}
        filters={filters}
        setFilters={setFilters}
      />

      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubscription}>
            <div className='mb-3'>
              <Input
                placeholder='Service Name'
                value={updateServiceName}
                onChange={(e) => setUpdateServiceName(e.target.value)}
              />
              {errors.serviceName && (
                <p className='text-red-500 text-sm'>{errors.serviceName}</p>
              )}
            </div>

            <div className='mb-3'>
              <Input
                placeholder='Price'
                type='number'
                value={updatePrice}
                onChange={(e) => setUpdatePrice(e.target.value)}
              />
              {errors.price && (
                <p className='text-red-500 text-sm'>{errors.price}</p>
              )}
            </div>

            <div className='mb-3'>
              <Select
                onValueChange={(value) => setUpdateBillingCycle(value)}
                defaultValue={updateBillingCycle}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Billing Cycle' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='monthly'>Monthly</SelectItem>
                  <SelectItem value='annual'>Annual</SelectItem>
                </SelectContent>
              </Select>
              {errors.billingCyle && (
                <p className='text-red-500 text-sm'>{errors.billingCyle}</p>
              )}
            </div>

            <Button type='submit' className='mt-2 w-full' disabled={loading}>
              {loading ? <LoaderSpinner className='text-center' /> : 'Update'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className='p-10'>
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div>
              <p>
                <strong>Service Name:</strong>{' '}
                {selectedSubscription.service_name}
              </p>
              <p>
                <strong>Price:</strong> {selectedSubscription.price}﷼
              </p>
              <p>
                <strong>Billing Cycle:</strong>{' '}
                {selectedSubscription.billing_cycle}
              </p>
              <p>
                <strong>Renewal Date:</strong>{' '}
                {new Date(
                  selectedSubscription.renewal_date
                ).toLocaleDateString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel this subscription?</p>
          <DialogFooter>
            <Button
              variant='destructive'
              type='submit'
              onClick={handleDeleteSubscription}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderSpinner className='text-center' />
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
