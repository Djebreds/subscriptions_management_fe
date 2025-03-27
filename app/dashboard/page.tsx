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
  active: boolean;
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
    active: "1",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [renewalAlerts, setRenewalAlerts] = useState<Subscription[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<
    { service_name: string; price: number }[]
  >([]);
  const [chartBillingCycle, setChartBillingCycle] = useState<
    "all" | "monthly" | "annual"
  >("all");

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
          active: "1",
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
        active: "1",
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

    // Only include active subscriptions
    const activeData = data.filter((sub) => sub.active);

    const total = activeData.reduce((sum: number, sub: Subscription) => {
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

    // Only include active subscriptions
    const activeData = data.filter((sub) => sub.active);

    const upcomingRenewals = activeData.filter((sub: Subscription) => {
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
    // Only include active subscriptions
    const activeData = data.filter((sub) => sub.active);

    // Filter by billing cycle if not "all"
    const filteredData =
      chartBillingCycle === "all"
        ? activeData
        : activeData.filter((sub) => sub.billing_cycle === chartBillingCycle);

    const breakdown = filteredData.reduce(
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

  useEffect(() => {
    if (subscriptions.length > 0) {
      prepareCostBreakdown(subscriptions);
    }
  }, [chartBillingCycle]);

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
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground mt-1">Next 30 days</p>
              {!loading &&
                renewalAlerts.filter((sub) =>
                  isRenewalWithinSevenDays(sub.renewal_date)
                ).length > 0 && (
                  <div className="mt-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium">
                    {
                      renewalAlerts.filter((sub) =>
                        isRenewalWithinSevenDays(sub.renewal_date)
                      ).length
                    }{" "}
                    within 7 days
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex justify-between items-center">
            <span>Renewal Calendar</span>
            {!loading &&
              renewalAlerts.filter((sub) =>
                isRenewalWithinSevenDays(sub.renewal_date)
              ).length > 0 && (
                <span className="text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-md">
                  {
                    renewalAlerts.filter((sub) =>
                      isRenewalWithinSevenDays(sub.renewal_date)
                    ).length
                  }{" "}
                  urgent renewals
                </span>
              )}
          </h3>
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
                      ? "bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-700 shadow-sm"
                      : "bg-yellow-50 dark:bg-yellow-950/20"
                  }`}
                >
                  <div>
                    <h4 className="font-medium">{sub.service_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Renewal: {new Date(sub.renewal_date).toLocaleDateString()}
                      {isRenewalWithinSevenDays(sub.renewal_date) && (
                        <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                          (Urgent!{" "}
                          {Math.ceil(
                            (new Date(sub.renewal_date).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days left)
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Cost Breakdown by Service</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChartBillingCycle("all")}
                className={`px-3 py-1 text-sm rounded-md ${
                  chartBillingCycle === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setChartBillingCycle("monthly")}
                className={`px-3 py-1 text-sm rounded-md ${
                  chartBillingCycle === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartBillingCycle("annual")}
                className={`px-3 py-1 text-sm rounded-md ${
                  chartBillingCycle === "annual"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        ) : costBreakdown.length > 0 ? (
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
                fill={darkMode ? "#8884d8" : "#4f46e5"}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-[300px] bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-muted-foreground">
              No data available for{" "}
              {chartBillingCycle === "all" ? "any" : chartBillingCycle} billing
              cycle
            </p>
          </div>
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
                .filter((sub) => sub.billing_cycle === "monthly" && sub.active)
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
              {subscriptions.filter(
                (sub) => sub.billing_cycle === "monthly" && sub.active
              ).length === 0 && (
                <p className="text-muted-foreground">
                  No monthly subscriptions found
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">
            Upcoming Renewals at a Glance
          </h3>
          {loading ? (
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : renewalAlerts.length > 0 ? (
            <div>
              <ul className="space-y-2">
                {renewalAlerts.slice(0, 5).map((sub) => {
                  const renewalDate = new Date(sub.renewal_date);
                  const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ];
                  const month = monthNames[renewalDate.getMonth()];
                  const day = renewalDate.getDate();
                  const isUrgent = isRenewalWithinSevenDays(sub.renewal_date);

                  return (
                    <li
                      key={sub.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            isUrgent ? "bg-red-500" : "bg-yellow-500"
                          }`}
                        ></div>
                        <span className="font-medium">{sub.service_name}</span>
                        <span className="text-muted-foreground ml-2">
                          on {month} {day}
                        </span>
                      </div>
                      <span
                        className={`${
                          isUrgent
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        ﷼ {Number(sub.price).toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {renewalAlerts.length > 5 && (
                <div className="mt-3 text-sm text-center">
                  <p className="text-muted-foreground">
                    + {renewalAlerts.length - 5} more renewals coming up
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total upcoming in 30 days:
                  </span>
                  <span className="font-medium">
                    ﷼{" "}
                    {renewalAlerts
                      .reduce((sum, sub) => sum + Number(sub.price), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No upcoming renewals in the next 30 days
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
