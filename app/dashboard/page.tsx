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
          console.log(error);
          break;
        }

        allSubscriptions = [...allSubscriptions, ...(data.results || [])];
        hasNextPage = !!data.next;
        currentPage++;
      }

      prepareCostBreakdown(allSubscriptions);
      generateRenewalAlerts(allSubscriptions);
      calculateTotalSpend(allSubscriptions);
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
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSpend = (data: Subscription[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInCurrentMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();
    const currentDay = today.getDate();

    const total = data.reduce((sum: number, sub: Subscription) => {
      const price = Number(sub.price);
      const renewalDate = new Date(sub.renewal_date);
      const renewalMonth = renewalDate.getMonth();
      const renewalYear = renewalDate.getFullYear();

      if (
        renewalMonth < currentMonth ||
        (renewalMonth === currentMonth && renewalYear < currentYear)
      ) {
        return sum;
      }

      if (sub.billing_cycle === "monthly") {
        return sum + price;
      } else if (sub.billing_cycle === "annual") {
        const dailyRate = price / 365;
        const daysInMonth =
          renewalMonth === currentMonth ? currentDay : daysInCurrentMonth;
        return sum + dailyRate * daysInMonth;
      }

      return sum;
    }, 0);

    setTotalMonthlySpend(Number(total.toFixed(2)));
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    setTheme(darkMode ? "light" : "dark");
  };

  const generateRenewalAlerts = (data: Subscription[]) => {
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingRenewals = data.filter((sub: Subscription) => {
      const renewalDate = new Date(sub.renewal_date);
      return renewalDate >= today && renewalDate <= oneMonthFromNow;
    });

    // Sort by renewal date
    upcomingRenewals.sort(
      (a, b) =>
        new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
    );

    setRenewalAlerts(upcomingRenewals);
  };

  const isRenewalWithinSevenDays = (renewalDate: string) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const renewal = new Date(renewalDate);
    return renewal >= today && renewal <= sevenDaysFromNow;
  };

  const calculateAnnualSavings = (monthlyPrice: number) => {
    // Assuming 20% discount for annual subscriptions
    const annualPrice = monthlyPrice * 12 * 0.8;
    const monthlyPricePerYear = monthlyPrice * 12;
    return monthlyPricePerYear - annualPrice;
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium text-muted-foreground mb-2">
              Total Monthly Spend
            </h2>
            <div className="text-3xl font-bold">
              {loading ? (
                <span className="inline-block w-32 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              ) : (
                `${totalMonthlySpend.toFixed(2)}﷼`
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium text-muted-foreground mb-2">
              Upcoming Renewals
            </h2>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {loading ? (
                <span className="inline-block w-32 h-8 bg-yellow-200 dark:bg-yellow-800 animate-pulse rounded" />
              ) : (
                renewalAlerts.length
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Renewal Calendar</h3>
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : renewalAlerts.length > 0 ? (
            <div className="space-y-4">
              {renewalAlerts.map((sub) => (
                <div
                  key={sub.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isRenewalWithinSevenDays(sub.renewal_date)
                      ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                      : "bg-yellow-50 dark:bg-yellow-950/20"
                  }`}
                >
                  <div>
                    <h4 className="font-medium">{sub.service_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Renewal: {new Date(sub.renewal_date).toLocaleDateString()}
                      {isRenewalWithinSevenDays(sub.renewal_date) && (
                        <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                          (Renewing soon!)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{sub.price}﷼</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {sub.billing_cycle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No upcoming renewals in the next 30 days
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">
          Cost Breakdown by Service
        </h3>
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
                tickFormatter={(value: number) => `${value}﷼`}
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

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">
            Annual Savings Comparison
          </h3>
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions
                .filter((sub) => sub.billing_cycle === "monthly")
                .map((sub) => {
                  const savings = calculateAnnualSavings(sub.price);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{sub.service_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Current: {sub.price}﷼/month
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600 dark:text-green-400">
                          Save {savings.toFixed(2)}﷼/year
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Switch to annual
                        </p>
                      </div>
                    </div>
                  );
                })}
              {subscriptions.filter((sub) => sub.billing_cycle === "monthly")
                .length === 0 && (
                <p className="text-muted-foreground">
                  No monthly subscriptions found
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
