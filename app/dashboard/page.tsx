'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useDebouncedCallback } from 'use-debounce';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SubscriptionModel = {
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
  const [filters, setFilters] = useState({
    service_name: '',
    billing_cycle: '',
    min_price: '',
    max_price: '',
    min_renewal_date: '',
    max_renewal_date: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [renewalAlerts, setRenewalAlerts] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState([]);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateServiceName, setUpdateServiceName] = useState('');
  const [updatePrice, setUpdatePrice] = useState('');
  const [updateBillingCycle, setUpdateBillingCycle] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, [page, filters]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return params.toString();
  };

  const openUpdateModal = (subscription) => {
    setSelectedSubscription(subscription);
    setUpdateServiceName(subscription.service_name);
    setUpdatePrice(subscription.price.toString());
    setUpdateBillingCycle(subscription.billing_cycle);
    setUpdateModalOpen(true);
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      console.log('Fetching with query params:', buildQueryParams());
      const res = await fetch(`/api/subscriptions?${buildQueryParams()}`);
      const data = await res.json();

      if (res.ok) {
        setSubscriptions(data.results || []);
        setNextPage(data.next);
        setPrevPage(data.previous);
        calculateTotalSpend(data.results || []);
        setSubscriptions(data.results || []);
        calculateTotalSpend(data.results || []);
        generateRenewalAlerts(data.results || []);
        prepareCostBreakdown(data.results || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong.', { position: 'top-center' });
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
      const res = await fetch(
        `/api/subscriptions/?id=${selectedSubscription.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_name: updateServiceName,
            price: parseFloat(updatePrice),
            billing_cycle: updateBillingCycle,
          }),
        }
      );

      const data = await res.json();

      // Update the local state with the updated subscription details
      const updatedSubscriptions = subscriptions.map((sub) =>
        sub.id === data.id ? data : sub
      );
      setSubscriptions(updatedSubscriptions);
      calculateTotalSpend(updatedSubscriptions);

      setUpdateModalOpen(false);
      toast.success('Subscription updated successfully.', {
        position: 'top-center',
      });
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

  const generateRenewalAlerts = (data) => {
    const today = new Date();
    const upcomingRenewals = data.filter((sub) => {
      const renewalDate = new Date(sub.renewal_date);
      const daysLeft = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7;
    });

    setRenewalAlerts(upcomingRenewals);
  };

  const prepareCostBreakdown = (data) => {
    const breakdown = data.reduce((acc, sub) => {
      const existing = acc.find(
        (item) => item.service_name === sub.service_name
      );
      if (existing) {
        existing.price += parseFloat(sub.price);
      } else {
        acc.push({
          service_name: sub.service_name,
          price: parseFloat(sub.price),
        });
      }
      return acc;
    }, []);
    setCostBreakdown(breakdown);
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

  const debouncedFilterUpdate = useDebouncedCallback((newFilters) => {
    setFilters(newFilters);
    loadSubscriptions();
  }, 500);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value.trim() };
    debouncedFilterUpdate(updatedFilters);
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

      {/* Cost Breakdown Chart */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold'>Cost Breakdown by Service</h3>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={costBreakdown}>
            <XAxis dataKey='service_name' />
            <YAxis />
            <Tooltip />
            <Bar dataKey='price' fill='#3182CE' />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Renewal Alerts */}
      {renewalAlerts.length > 0 && (
        <div className='mt-6 p-4 bg-yellow-100 text-yellow-800 rounded'>
          <h3 className='text-lg font-semibold'>
            Upcoming Renewals (Next 7 Days)
          </h3>
          <ul>
            {renewalAlerts.map((sub) => (
              <li key={sub.id}>
                {sub.service_name} - Renewal on{' '}
                {new Date(sub.renewal_date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='mt-6 p-4 bg-blue-100 text-blue-800 rounded'>
        <h3 className='text-lg font-semibold'>Savings Comparison</h3>
        {subscriptions.map((sub) =>
          sub.billing_cycle === 'monthly' ? (
            <p key={sub.id}>
              {sub.service_name}: If you switch to annual, you’ll save{' '}
              {(sub.price * 12 * 0.8).toFixed(2)}﷼ per year.
            </p>
          ) : null
        )}
      </div>

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

      <div className='grid grid-cols-2 gap-4 mt-4'>
        <Input
          name='service_name'
          placeholder='Service Name'
          onChange={handleFilterChange}
        />
        <Select
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, billing_cycle: value }))
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Billing Cycle' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='monthly'>Monthly</SelectItem>
            <SelectItem value='annual'>Annual</SelectItem>
          </SelectContent>
        </Select>
        <Input
          name='min_price'
          type='number'
          placeholder='Min Price'
          onChange={handleFilterChange}
        />
        <Input
          name='max_price'
          type='number'
          placeholder='Max Price'
          onChange={handleFilterChange}
        />
        <Input
          name='min_renewal_date'
          type='date'
          onChange={handleFilterChange}
        />
        <Input
          name='max_renewal_date'
          type='date'
          onChange={handleFilterChange}
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
