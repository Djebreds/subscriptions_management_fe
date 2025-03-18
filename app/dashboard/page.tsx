'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { LoaderSpinner } from '../../components/ui/loader-spinner';
import { SkeletonTable } from '../../components/ui/skeleton-table';

const SubscriptionModel = {
  fetchAll: () => fetch('/api/subscriptions').then((res) => res.json()),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/subscriptions/import_csv', {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },
};

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

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { setTheme } = useTheme();
  const [csvFile, setCsvFile] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('');
  const [errors, setErrors] = useState<Errors>({
    serviceName: '',
    price: '',
    billingCyle: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscriptions');
      const data = await res.json();

      if (res.ok) {
        setSubscriptions(data.results || []);
        calculateTotalSpend(data.results || []);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error('Something went wrong.', {
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSpend = (data) => {
    const total = data.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
    setTotalMonthlySpend(total);
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    setTheme(darkMode ? 'light' : 'dark');
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
        serviceName: fieldErrors.serviceName
          ? fieldErrors.serviceName.join(' ')
          : '',
        price: fieldErrors.price ? fieldErrors.price.join(' ') : '',
        billingCyle: fieldErrors.billingCycle
          ? fieldErrors.billingCycle.join(' ')
          : '',
      });

      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: serviceName,
          price: parseFloat(price),
          billing_cycle: billingCycle,
        }),
      });

      const data = await res.json();

      setSubscriptions([...subscriptions, data]);
      calculateTotalSpend([...subscriptions, data]);

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

  const confirmDelete = (id) => {
    setSelectedId(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteSubscription = async () => {
    try {
      setLoading(true);

      await fetch(`/api/subscriptions/?id=${selectedId}`, {
        method: 'DELETE',
      });

      const updatedSubscriptions = subscriptions.filter(
        (sub) => sub.id !== selectedId
      );

      setSubscriptions(updatedSubscriptions);
      calculateTotalSpend(updatedSubscriptions);
      setConfirmDeleteOpen(false);

      toast.success('Subscription has been deleted.', {
        position: 'top-center',
      });
    } catch (error: unknown) {
      console.error(error);
      toast.error('Something went wrong.', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;
    const data = await SubscriptionModel.importCSV(csvFile);
    setSubscriptions(data.results || []);
    calculateTotalSpend(data.results || []);
  };

  const openDetailModal = (subscription) => {
    setSelectedSubscription(subscription);
    setDetailModalOpen(true);
  };

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold'>Subscription Dashboard</h1>
        <Switch checked={darkMode} onCheckedChange={handleThemeToggle} />
      </div>

      <Card>
        <CardContent>
          <h2 className='text-xl font-semibold'>
            Total Monthly Spend: {totalMonthlySpend}﷼
          </h2>
        </CardContent>
      </Card>

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
                type='text'
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

      {loading ? (
        <>
          <SkeletonTable />
        </>
      ) : (
        <Table className='mt-6 w-full'>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Monthly Cost</TableHead>
              <TableHead>Renewal Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.service_name}</TableCell>
                <TableCell>{sub.price}﷼</TableCell>
                <TableCell>
                  {new Date(sub.renewal_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button onClick={() => openDetailModal(sub)}>Details</Button>
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
      )}

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
