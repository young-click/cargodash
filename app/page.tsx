"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Ship,
  Search,
  RefreshCw,
  Edit3,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Check,
  Building2,
  Filter,
} from "lucide-react";

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  cargo: string;
  weight: number;
  status: "Pending" | "In Transit" | "Delivered" | "Customs Hold" | "Cancelled";
  carrier?: string;
  estimatedArrival?: string;
  updatedAt?: string;
}

const STATUS_CONFIG: Record<
  Shipment["status"],
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Pending: {
    label: "Pending",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    dotClass: "bg-amber-400",
    icon: Clock,
  },
  "In Transit": {
    label: "In Transit",
    badgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/25",
    dotClass: "bg-sky-400 animate-pulse",
    icon: Ship,
  },
  Delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    dotClass: "bg-emerald-400",
    icon: CheckCircle2,
  },
  "Customs Hold": {
    label: "Customs Hold",
    badgeClass: "bg-purple-500/10 text-purple-400 border border-purple-500/25",
    dotClass: "bg-purple-400",
    icon: AlertTriangle,
  },
  Cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    dotClass: "bg-rose-400",
    icon: X,
  },
};

const STATUS_OPTIONS: Shipment["status"][] = [
  "Pending",
  "In Transit",
  "Delivered",
  "Customs Hold",
  "Cancelled",
];

export default function CargoDashPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<Shipment["status"]>("Pending");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch shipments from /api/shipments on load
  const fetchShipments = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/shipments");
      if (!res.ok) {
        throw new Error(`Failed to load shipments: HTTP ${res.status}`);
      }
      const data: Shipment[] = await res.json();
      setShipments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to shipment service";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q) ||
        (item.carrier && item.carrier.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [shipments, searchQuery, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status);
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    if (isUpdating) return;
    setIsModalOpen(false);
    setSelectedShipment(null);
  };

  // Handle Save Status Update
  const handleSaveStatus = async () => {
    if (!selectedShipment) return;

    try {
      setIsUpdating(true);

      const res = await fetch(`/api/shipments/${selectedShipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update shipment status");
      }

      const updatedItem: Shipment = await res.json();

      // Update in local state
      setShipments((prev) =>
        prev.map((s) => (s.id === updatedItem.id ? updatedItem : s))
      );

      // Trigger temporary toast
      setToastMessage(`Shipment ${selectedShipment.id} status updated to ${newStatus}`);
      setTimeout(() => setToastMessage(null), 3500);

      handleCloseModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      alert(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick statistics
  const stats = useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter((s) => s.status === "In Transit").length;
    const delivered = shipments.filter((s) => s.status === "Delivered").length;
    const pending = shipments.filter((s) => s.status === "Pending").length;
    const totalWeightKg = shipments.reduce((acc, curr) => acc + curr.weight, 0);

    return { total, inTransit, delivered, pending, totalWeightKg };
  }, [shipments]);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#0B111E]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070B12] rounded-[11px] flex items-center justify-center">
                <Ship className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Cargo<span className="text-cyan-400">Dash</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  Freight Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                B2B Freight Forwarding & Logistics Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>API Gateway Connected</span>
            </div>

            <button
              onClick={() => fetchShipments(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Refresh shipment data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-cyan-400 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0D1524] border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Shipments</span>
              <Layers className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-white">
              {loading ? "..." : stats.total}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Active manifests in system</div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="bg-[#0D1524] border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>In Transit</span>
              <Ship className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-sky-400">
              {loading ? "..." : stats.inTransit}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
              En route on sea & air routes
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="bg-[#0D1524] border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Delivered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
              {loading ? "..." : stats.delivered}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Successfully cleared & delivered</div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="bg-[#0D1524] border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Cargo Weight</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-300">
              {loading ? "..." : `${(stats.totalWeightKg / 1000).toFixed(1)} MT`}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {stats.totalWeightKg.toLocaleString()} kg active payload
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>
        </section>

        {/* Filters and Search Bar */}
        <div className="bg-[#0B111E] border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Origin, Destination, or Cargo..."
              className="w-full bg-[#080D17] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter shipments by status"
              className="bg-[#080D17] border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Statuses ({shipments.length})</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shipments Table Container */}
        <div className="bg-[#0B111E] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Table Header Section */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <span>Shipment Registry</span>
                <span className="text-xs font-normal text-slate-400">
                  ({filteredShipments.length}{" "}
                  {filteredShipments.length === 1 ? "record" : "records"})
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time freight manifests loaded from /api/shipments
              </p>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              Auto-synced with carrier updates
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">ID</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Origin</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Destination</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Cargo</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Weight (kg)</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Status</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                {/* Loading Skeleton */}
                {loading && (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 w-20 bg-slate-800 rounded"></div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 w-32 bg-slate-800 rounded"></div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 w-32 bg-slate-800 rounded"></div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 w-40 bg-slate-800 rounded"></div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="h-4 w-16 bg-slate-800 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-6 w-24 bg-slate-800 rounded-full"></div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="h-7 w-16 bg-slate-800 rounded mx-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Error State */}
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                        <div className="text-sm font-semibold text-rose-300">
                          Error Loading Shipments
                        </div>
                        <p className="text-xs text-slate-400">{error}</p>
                        <button
                          onClick={() => fetchShipments()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition"
                        >
                          Retry Connection
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Empty State */}
                {!loading && !error && filteredShipments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 px-6 text-center">
                      <div className="max-w-sm mx-auto space-y-3 text-slate-400">
                        <Package className="w-10 h-10 mx-auto text-slate-600" />
                        <div className="text-sm font-semibold text-slate-300">
                          No shipments found
                        </div>
                        <p className="text-xs text-slate-500">
                          {searchQuery || statusFilter !== "ALL"
                            ? "Try adjusting your search criteria or clearing filters."
                            : "No shipments are currently registered in the system."}
                        </p>
                        {(searchQuery || statusFilter !== "ALL") && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("ALL");
                            }}
                            className="text-xs text-cyan-400 hover:underline inline-block mt-1"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data Rows */}
                {!loading &&
                  !error &&
                  filteredShipments.map((shipment) => {
                    const statusConfig =
                      STATUS_CONFIG[shipment.status] || STATUS_CONFIG.Pending;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr
                        key={shipment.id}
                        className="hover:bg-slate-800/40 transition-colors duration-150 group"
                      >
                        {/* ID Column */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-1 rounded-md">
                              {shipment.id}
                            </span>
                          </div>
                        </td>

                        {/* Origin Column */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="font-medium text-slate-200">
                            {shipment.origin}
                          </div>
                          {shipment.carrier && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-600" />
                              {shipment.carrier}
                            </div>
                          )}
                        </td>

                        {/* Destination Column */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="font-medium text-slate-200 flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:inline" />
                            <span>{shipment.destination}</span>
                          </div>
                          {shipment.estimatedArrival && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              ETA: {shipment.estimatedArrival}
                            </div>
                          )}
                        </td>

                        {/* Cargo Column */}
                        <td className="py-4 px-4 sm:px-6 max-w-xs">
                          <div className="text-slate-300 truncate font-medium">
                            {shipment.cargo}
                          </div>
                        </td>

                        {/* Weight (kg) Column */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right font-mono text-slate-200">
                          <span className="font-medium">
                            {shipment.weight.toLocaleString()}
                          </span>
                          <span className="text-slate-500 text-xs ml-1">kg</span>
                        </td>

                        {/* Status Column */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${statusConfig.badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}
                            />
                            <StatusIcon className="w-3 h-3 shrink-0" />
                            <span>{statusConfig.label}</span>
                          </span>
                        </td>

                        {/* Actions Column with Edit Button */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleOpenEdit(shipment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-cyan-600/20 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-all shadow-sm active:scale-95 group-hover:border-slate-600"
                            title={`Edit status for ${shipment.id}`}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Showing {filteredShipments.length} of {shipments.length} total shipments
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span> In Transit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Delivered
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Status Modal */}
      {isModalOpen && selectedShipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="bg-[#0D1525] border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="modal-title" className="text-sm font-semibold text-white">
                    Update Shipment Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modify transit progress for {selectedShipment.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isUpdating}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Shipment Details Snapshot */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shipment ID:</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {selectedShipment.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cargo:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[200px]">
                    {selectedShipment.cargo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Route:</span>
                  <span className="text-slate-300 truncate max-w-[220px]">
                    {selectedShipment.origin.split(",")[0]} → {selectedShipment.destination.split(",")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Weight:</span>
                  <span className="font-mono text-slate-200">
                    {selectedShipment.weight.toLocaleString()} kg
                  </span>
                </div>
              </div>

              {/* Status Radio/Tile Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Select New Status:
                </label>
                <div className="space-y-1.5">
                  {STATUS_OPTIONS.map((status) => {
                    const isSelected = newStatus === status;
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewStatus(status)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? "bg-cyan-950/30 border-cyan-500/60 text-white shadow-sm ring-1 ring-cyan-500/30"
                            : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1.5 rounded-lg ${
                              isSelected
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-medium">{status}</span>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg transition shadow-md shadow-cyan-950/50 flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Save Status</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
