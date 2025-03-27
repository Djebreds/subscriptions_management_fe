"use client";

import SubscriptionTable from "@/components/subscription/subscription-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoaderSpinner } from "@/components/ui/loader-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSubscription,
  getPriceHistories,
  getSubscriptions,
  importSubscriptions,
  updateSubscription,
} from "@/lib/subscription";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface Errors {
  serviceName: string;
  price: string;
  billingCyle: string;
  startDate: string;
  active: string;
}

interface Subscription {
  id: string;
  service_name: string;
  price: number;
  billing_cycle: string;
  renewal_date: string;
  start_date?: string;
  active?: boolean;
}

interface PriceHistory {
  id: string;
  old_price: string;
  new_price: string;
  changed_at: Date;
}

const subscriptionSchema = z.object({
  serviceName: z.string().nonempty({ message: "Service Name is required." }),
  price: z
    .string()
    .regex(/^[0-9]+(\.[0-9]{1,2})?$/, "Price must be a valid number"),
  billingCycle: z.enum(["monthly", "annual"], {
    errorMap: () => ({ message: "Billing cycle is required" }),
  }),
  startDate: z.string().nonempty({ message: "Start date is required." }),
  active: z.enum(["true", "false"], {
    errorMap: () => ({ message: "Status is required" }),
  }),
});

export default function Subscription() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [active, setActive] = useState("true");
  const [errors, setErrors] = useState<Errors>({
    serviceName: "",
    price: "",
    billingCyle: "",
    startDate: "",
    active: "",
  });
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
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubscriptionStatus, setSelectedSubscriptionStatus] = useState<
    boolean | null
  >(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateServiceName, setUpdateServiceName] = useState("");
  const [updatePrice, setUpdatePrice] = useState("");
  const [updateBillingCycle, setUpdateBillingCycle] = useState("");
  const [updateStartDate, setUpdateStartDate] = useState("");
  const [updateActive, setUpdateActive] = useState("true");
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [priceHistories, setPriceHistories] = useState<PriceHistory[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<string | null>(null);
  const [updateCalculatedPrice, setUpdateCalculatedPrice] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadSubscriptions();
  }, [page, filters]);

  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (price && billingCycle) {
      const basePrice = parseFloat(price);
      if (!isNaN(basePrice) && basePrice > 0) {
        if (billingCycle === "monthly") {
          const annualPrice = basePrice * 12;
          setCalculatedPrice(`Annual: ${formatPrice(annualPrice)}﷼`);
        } else {
          const monthlyPrice = basePrice / 12;
          setCalculatedPrice(`Monthly: ${formatPrice(monthlyPrice)}﷼`);
        }
      } else {
        setCalculatedPrice(null);
      }
    } else {
      setCalculatedPrice(null);
    }
  }, [price, billingCycle]);

  useEffect(() => {
    if (updatePrice && updateBillingCycle) {
      const basePrice = parseFloat(updatePrice);
      if (!isNaN(basePrice) && basePrice > 0) {
        if (updateBillingCycle === "monthly") {
          const annualPrice = basePrice * 12;
          setUpdateCalculatedPrice(`Annual: ${formatPrice(annualPrice)}﷼`);
        } else {
          const monthlyPrice = basePrice / 12;
          setUpdateCalculatedPrice(`Monthly: ${formatPrice(monthlyPrice)}﷼`);
        }
      } else {
        setUpdateCalculatedPrice(null);
      }
    } else {
      setUpdateCalculatedPrice(null);
    }
  }, [updatePrice, updateBillingCycle]);

  const loadSubscriptions = async (overrideFilters = filters) => {
    try {
      setLoading(true);
      const { data, error } = await getSubscriptions({
        ...overrideFilters,
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

  const toggleActiveStatus = (id: string, currentStatus: boolean) => {
    setSelectedId(id);
    setSelectedSubscriptionStatus(currentStatus);
    setConfirmDeleteOpen(true);
  };

  const loadPriceHistories = async () => {
    if (!selectedSubscription) return;
    setLoading(true);

    try {
      const { data, error } = await getPriceHistories(selectedSubscription.id);

      if (error) {
        toast.error(error, { position: "top-center" });
        return;
      }

      setPriceHistories(data);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setUpdateServiceName(subscription.service_name);
    setUpdatePrice(subscription.price.toString());
    setUpdateBillingCycle(subscription.billing_cycle);
    setUpdateStartDate(subscription.start_date || "");
    setUpdateActive(subscription.active ? "true" : "false");
    setUpdateModalOpen(true);
  };

  const handleCreateSubscription = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrors({
      serviceName: "",
      price: "",
      billingCyle: "",
      startDate: "",
      active: "",
    });

    const validationResult = subscriptionSchema.safeParse({
      serviceName,
      price,
      billingCycle,
      startDate,
      active,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setErrors({
        serviceName: fieldErrors.serviceName?.join(" ") || "",
        price: fieldErrors.price?.join(" ") || "",
        billingCyle: fieldErrors.billingCycle?.join(" ") || "",
        startDate: "",
        active: "",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await createSubscription({
        service_name: serviceName,
        price: parseFloat(price),
        billing_cycle: billingCycle,
        start_date: startDate,
        active: active === "true",
      });

      if (error) {
        toast.error(error, { position: "top-center" });
        return;
      }

      setSubscriptions([...subscriptions, data]);
      setServiceName("");
      setPrice("");
      setBillingCycle("");
      setStartDate("");
      setActive("true");
      setModalOpen(false);
      toast.success("New subscription added.", { position: "top-center" });
    } catch (error: unknown) {
      console.error(error);
      toast.error("Something went wrong", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!selectedSubscription) return;

    setErrors({
      serviceName: "",
      price: "",
      billingCyle: "",
      startDate: "",
      active: "",
    });

    const validationResult = subscriptionSchema.safeParse({
      serviceName: updateServiceName,
      price: updatePrice,
      billingCycle: updateBillingCycle,
      startDate: updateStartDate,
      active: updateActive,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setErrors({
        serviceName: fieldErrors.serviceName?.join(" ") || "",
        price: fieldErrors.price?.join(" ") || "",
        billingCyle: fieldErrors.billingCycle?.join(" ") || "",
        startDate: "",
        active: "",
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
          start_date: updateStartDate,
          active: updateActive === "true",
        }
      );

      if (error) {
        toast.error(error, { position: "top-center" });
        return;
      }

      const updated = subscriptions.map((sub) =>
        sub.id === data.id ? data : sub
      );
      setSubscriptions(updated);
      setUpdateModalOpen(false);
      toast.success("Subscription updated successfully.", {
        position: "top-center",
      });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedId || selectedSubscriptionStatus === null) return;

    try {
      setLoading(true);

      const newStatus = !selectedSubscriptionStatus;

      const { error } = await updateSubscription(selectedId, {
        active: newStatus,
      });

      if (error) {
        toast.error(error, { position: "top-center" });
        return;
      }

      const updated = subscriptions.map((sub) =>
        sub.id === selectedId ? { ...sub, active: newStatus } : sub
      );

      setSubscriptions(updated);
      setConfirmDeleteOpen(false);
      toast.success(
        `Subscription ${newStatus ? "activated" : "deactivated"} successfully.`,
        {
          position: "top-center",
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", csvFile);

    const { data, error } = await importSubscriptions(formData);

    if (error) {
      toast.error(error, { position: "top-center" });
    } else {
      setSubscriptions(data.results || []);
      setCsvImportModalOpen(false);
      loadSubscriptions();
      toast.success("Successfuly to import subscriptions", {
        position: "top-center",
      });
    }

    setLoading(false);
  };

  const openDetailModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    loadPriceHistories();
    setDetailModalOpen(true);
  };

  return (
    <div className="p-5">
      <div className="flex gap-5 justify-between">
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="mt-6">Add Subscription</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubscription}>
              <div className="mb-3">
                <Input
                  placeholder="Service Name"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
                {errors.serviceName && (
                  <p className="text-red-500 text-sm">{errors.serviceName}</p>
                )}
              </div>

              <div className="mb-3">
                <div className="flex items-center">
                  <Input
                    placeholder="Price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <span className="ml-2 text-sm">
                    {billingCycle === "monthly" ? "﷼/month" : "﷼/year"}
                  </span>
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm">{errors.price}</p>
                )}
                {calculatedPrice && (
                  <p className="text-blue-500 text-sm mt-1 font-medium bg-blue-50 p-1.5 rounded">
                    {calculatedPrice}
                  </p>
                )}
              </div>

              <div className="mb-3">
                <Select onValueChange={(value) => setBillingCycle(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Billing Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.billingCyle && (
                  <p className="text-red-500 text-sm">{errors.billingCyle}</p>
                )}
              </div>

              <div className="mb-3">
                <Input
                  placeholder="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm">{errors.startDate}</p>
                )}
              </div>

              <div className="mb-3">
                <Select
                  onValueChange={(value) => setActive(value)}
                  defaultValue="true"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.active && (
                  <p className="text-red-500 text-sm">{errors.active}</p>
                )}
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderSpinner className="text-center" />
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={csvImportModalOpen} onOpenChange={setCsvImportModalOpen}>
          <DialogTrigger asChild>
            <Button className="mt-6">Import CSV</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import CSV</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files) {
                    setCsvFile(e.target.files[0]);
                  }
                }}
              />
              <Button onClick={handleCSVImport} disabled={loading || !csvFile}>
                {loading ? <LoaderSpinner className="text-center" /> : "Import"}
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
        confirmDelete={toggleActiveStatus}
        filters={filters}
        setFilters={(newFilters: Record<string, string>) =>
          setFilters((prev) => ({ ...prev, ...newFilters }))
        }
      />

      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubscription}>
            <div className="mb-3">
              <Input
                placeholder="Service Name"
                value={updateServiceName}
                onChange={(e) => setUpdateServiceName(e.target.value)}
              />
              {errors.serviceName && (
                <p className="text-red-500 text-sm">{errors.serviceName}</p>
              )}
            </div>

            <div className="mb-3">
              <div className="flex items-center">
                <Input
                  placeholder="Price"
                  type="number"
                  value={updatePrice}
                  onChange={(e) => setUpdatePrice(e.target.value)}
                />
                <span className="ml-2 text-sm">
                  {updateBillingCycle === "monthly" ? "﷼/month" : "﷼/year"}
                </span>
              </div>
              {errors.price && (
                <p className="text-red-500 text-sm">{errors.price}</p>
              )}
              {updateCalculatedPrice && (
                <p className="text-blue-500 text-sm mt-1 font-medium bg-blue-50 p-1.5 rounded">
                  {updateCalculatedPrice}
                </p>
              )}
            </div>

            <div className="mb-3">
              <Select
                onValueChange={(value) => setUpdateBillingCycle(value)}
                defaultValue={updateBillingCycle}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Billing Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              {errors.billingCyle && (
                <p className="text-red-500 text-sm">{errors.billingCyle}</p>
              )}
            </div>

            <div className="mb-3">
              <Input
                placeholder="Start Date"
                type="date"
                value={updateStartDate}
                onChange={(e) => setUpdateStartDate(e.target.value)}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm">{errors.startDate}</p>
              )}
            </div>

            <div className="mb-3">
              <Select
                onValueChange={(value) => setUpdateActive(value)}
                defaultValue={updateActive}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.active && (
                <p className="text-red-500 text-sm">{errors.active}</p>
              )}
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? <LoaderSpinner className="text-center" /> : "Update"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="p-10">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              <div>
                <p>
                  <strong>Service Name:</strong>{" "}
                  {selectedSubscription.service_name}
                </p>
                <p>
                  <strong>Price:</strong> {selectedSubscription.price}﷼
                </p>
                <p>
                  <strong>Billing Cycle:</strong>{" "}
                  {selectedSubscription.billing_cycle}
                </p>
                <p>
                  <strong>Renewal Date:</strong>{" "}
                  {new Date(
                    selectedSubscription.renewal_date
                  ).toLocaleDateString()}
                </p>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {selectedSubscription.start_date
                    ? new Date(
                        selectedSubscription.start_date
                      ).toLocaleDateString()
                    : "Not specified"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      selectedSubscription.active
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {selectedSubscription.active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Price History</h3>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
                  </div>
                ) : priceHistories.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Old Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            New Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Changed At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {priceHistories.map((history) => (
                          <tr key={history.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {history.old_price}﷼
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {history.new_price}﷼
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(
                                history.changed_at
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No price history available
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to{" "}
            {selectedSubscriptionStatus ? "deactivate" : "activate"} this
            subscription?
          </p>
          <DialogFooter>
            <Button
              variant={selectedSubscriptionStatus ? "destructive" : "default"}
              type="submit"
              onClick={handleToggleStatus}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderSpinner className="text-center" />
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
