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

const SubscriptionModel = {
  fetchAll: () => fetch('/api/subscriptions').then((res) => res.json()),
  create: (data) =>
    fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => res.json()),
  delete: (id) =>
    fetch(`/api/subscriptions?id=${id}`, {
      method: 'DELETE',
    }).then((res) => res.json()),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/subscriptions/import_csv', {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },
};

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { setTheme } = useTheme();
  const [csvFile, setCsvFile] = useState(null);
  const [form, setForm] = useState({
    service_name: '',
    price: '',
    billing_cycle: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const data = await SubscriptionModel.fetchAll();
    setSubscriptions(data.results || []);
    calculateTotalSpend(data.results || []);
  };

  const calculateTotalSpend = (data) => {
    const total = data.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
    setTotalMonthlySpend(total);
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    setTheme(darkMode ? 'light' : 'dark');
  };

  const handleCreateSubscription = async () => {
    const data = await SubscriptionModel.create(form);
    setSubscriptions([...subscriptions, data]);
    calculateTotalSpend([...subscriptions, data]);
    setModalOpen(false);
  };

  const confirmDelete = (id) => {
    setSelectedId(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteSubscription = async () => {
    await SubscriptionModel.delete(selectedId);
    const updatedSubscriptions = subscriptions.filter(
      (sub) => sub.id !== selectedId
    );
    setSubscriptions(updatedSubscriptions);
    calculateTotalSpend(updatedSubscriptions);
    setConfirmDeleteOpen(false);
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
          <Input
            placeholder='Service Name'
            onChange={(e) => setForm({ ...form, service_name: e.target.value })}
          />
          <Input
            placeholder='Price'
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            placeholder='Billing Cycle'
            onChange={(e) =>
              setForm({ ...form, billing_cycle: e.target.value })
            }
          />
          <Button onClick={handleCreateSubscription} className='mt-2'>
            Create
          </Button>
        </DialogContent>
      </Dialog>

      <Table className='mt-6'>
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
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent>
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
          <p>Are you sure you want to delete this subscription?</p>
          <DialogFooter>
            <Button variant='destructive' onClick={handleDeleteSubscription}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
