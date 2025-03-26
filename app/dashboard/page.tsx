"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSubscriptions } from "@/lib/subscription";

interface Subscription {
  id: string;
  service_name: string;
  price: number;
  billing_cycle: string;
  renewal_date: string;
}

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { setTheme } = useTheme();
  const [filters, setFilters] = useState({
    service_name: "",
    billing_cycle: "",
    min_price: "",
    max_price: "",
    min_renewal_date: "",
    max_renewal_date: "",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [renewalAlerts, setRenewalAlerts] = useState<Subscription[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<
    { service_name: string; price: number }[]
  >([]);

  useEffect(() => {
    loadSubscriptions();
    loadAllSubscriptionsForBreakdown();
  }, [page, filters]);

  const loadAllSubscriptionsForBreakdown = async () => {
    try {
      let allSubscriptions: Subscription[] = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const { data, error } = await getSubscriptions({
          ...filters,
          page: currentPage.toString(),
        });

        if (error) {
          console.error(error);
          break;
        }

        allSubscriptions = [...allSubscriptions, ...(data.results || [])];
        hasNextPage = !!data.next;
        currentPage++;
      }

      console.log(allSubscriptions);

      prepareCostBreakdown(allSubscriptions);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSubscriptions({
        ...filters,
        page: page.toString(),
      });

      if (error) {
        toast.error(error, { position: "top-center" });
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
      toast.error("Something went wrong.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSpend = (data: Subscription[]) => {
    const total = data.reduce(
      (sum: number, sub: Subscription) => sum + sub.price,
      0
    );
    setTotalMonthlySpend(total);
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    setTheme(darkMode ? "light" : "dark");
  };

  const generateRenewalAlerts = (data: Subscription[]) => {
    const today = new Date();
    const upcomingRenewals = data.filter((sub: Subscription) => {
      const renewalDate = new Date(sub.renewal_date);
      const daysLeft = Math.ceil(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 7;
    });

    setRenewalAlerts(upcomingRenewals);
  };

  const prepareCostBreakdown = (data: Subscription[]) => {
    const breakdown = data.reduce(
      (acc: { service_name: string; price: number }[], sub: Subscription) => {
        const existing = acc.find(
          (item: { service_name: string; price: number }) =>
            item.service_name === sub.service_name
        );
        if (existing) {
          existing.price += sub.price;
        } else {
          acc.push({
            service_name: sub.service_name,
            price: sub.price,
          });
        }
        return acc;
      },
      []
    );
    setCostBreakdown(breakdown);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Subscription Dashboard</h1>
        <Switch checked={darkMode} onCheckedChange={handleThemeToggle} />
      </div>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold">
            Total Monthly Spend:{" "}
            {loading ? (
              <span className="inline-block w-32 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              `${totalMonthlySpend}﷼`
            )}
          </h2>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Cost Breakdown by Service</h3>
        {loading ? (
          <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={costBreakdown}>
              <XAxis
                dataKey="service_name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
                fill={darkMode ? "#FFF" : "#000"}
              />
              <YAxis
                tickFormatter={(value) => `${value}﷼`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}﷼`, "Price"]}
                wrapperClassName="rounded-md"
                contentStyle={{
                  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                  border: "none",
                  borderRadius: "0.375rem",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                labelStyle={{
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
              <Bar
                dataKey="price"
                fill={darkMode ? "#FFF" : "#000"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {loading ? (
        <div className="mt-6 p-4 bg-yellow-100 text-yellow-800 rounded">
          <h3 className="text-lg font-semibold">
            Upcoming Renewals (Next 7 Days)
          </h3>
          <div className="space-y-2">
            <div className="h-4 bg-yellow-200 rounded animate-pulse" />
            <div className="h-4 bg-yellow-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-yellow-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ) : (
        renewalAlerts.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-100 text-yellow-800 rounded">
            <h3 className="text-lg font-semibold">
              Upcoming Renewals (Next 7 Days)
            </h3>
            <ul>
              {renewalAlerts.map((sub) => (
                <li key={sub.id}>
                  {sub.service_name} - Renewal on{" "}
                  {new Date(sub.renewal_date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      <div className="mt-6 p-4 bg-blue-100 text-blue-800 rounded">
        <h3 className="text-lg font-semibold">Savings Comparison</h3>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-blue-200 rounded animate-pulse" />
            <div className="h-4 bg-blue-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-blue-200 rounded animate-pulse w-4/6" />
          </div>
        ) : (
          subscriptions.map((sub) =>
            sub.billing_cycle === "monthly" ? (
              <p key={sub.id}>
                {sub.service_name}: If you switch to annual, you&apos;ll save{" "}
                {(sub.price * 12 * 0.8).toFixed(2)}﷼ per year.
              </p>
            ) : null
          )
        )}
      </div>
    </div>
  );
}
