'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getSubscriptions } from '@/lib/subscription';

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { setTheme } = useTheme();
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
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [renewalAlerts, setRenewalAlerts] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState([]);

  useEffect(() => {
    loadSubscriptions();
  }, [page, filters]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSubscriptions({
        ...filters,
        page: page.toString(),
      });

      if (error) {
        toast.error(error, { position: 'top-center' });
        return;
      }

      setSubscriptions(data.results || []);
      setNextPage(data.next);
      setPrevPage(data.previous);
      calculateTotalSpend(data.results || []);
      generateRenewalAlerts(data.results || []);
      prepareCostBreakdown(data.results || []);
    } catch (err) {
      console.error(err);
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
    </div>
  );
}
