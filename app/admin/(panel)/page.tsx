"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminSection, StatCard } from "@/components/admin/AdminCards";
import { adminFetch, formatCurrency, formatDate } from "@/lib/admin-client";
import type { StoreProduct } from "@/lib/product-data";

type OrderRow = {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch<{ products: StoreProduct[]; total: number }>("/api/products?limit=100"),
      adminFetch<{ orders: OrderRow[]; total: number }>("/api/orders?limit=10"),
      adminFetch<{ orders: OrderRow[]; total: number }>("/api/orders?status=pending&limit=1"),
      adminFetch<{ items: unknown[]; total: number }>("/api/gallery?limit=1")
    ])
      .then(([productRes, orderRes, pendingRes, galleryRes]) => {
        setProducts(productRes.data.products);
        setProductTotal(productRes.data.total);
        setOrders(orderRes.data.orders);
        setOrderTotal(orderRes.data.total);
        setPendingTotal(pendingRes.data.total);
        setGalleryCount(galleryRes.data.total);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard data"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Admin</p>
          <h1 className="font-heading text-4xl font-bold text-amanat-brown">Dashboard</h1>
        </div>
        <Link href="/admin/products/new" className="rounded-full bg-amanat-terracotta px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">
          Quick Add Product
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Products" value={isLoading ? "..." : productTotal || products.length} />
        <StatCard label="Total Orders" value={isLoading ? "..." : orderTotal} />
        <StatCard label="Pending Orders" value={isLoading ? "..." : pendingTotal} />
        <StatCard label="Gallery Items" value={isLoading ? "..." : galleryCount} />
      </div>

      <AdminSection title="Recent Orders" description="Last 10 orders received">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-amanat-sage">
              <tr>
                <th className="py-3">Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amanat-brown/10">
              {orders.map((order) => (
                <tr key={order.orderNumber}>
                  <td className="py-3 font-black">{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td>{order.status}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <Link href={`/admin/orders?order=${order.orderNumber}`} className="font-black text-amanat-terracotta">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </div>
  );
}
