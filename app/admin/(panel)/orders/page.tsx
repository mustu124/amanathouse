"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminSection } from "@/components/admin/AdminCards";
import { adminFetch, formatCurrency, formatDate } from "@/lib/admin-client";
import { whatsappLink } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/pricing/hamper";
import type { HamperSnapshot } from "@/lib/hampers";

type Order = {
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity: number; image?: string; itemType?: string; hamperContents?: HamperSnapshot }>;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  pincode: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = useCallback(() =>
    adminFetch<{ orders: Order[] }>(`/api/orders?limit=50${status ? `&status=${status}` : ""}`)
      .then((res) => setOrders(res.data.orders))
      .catch((error) => toast.error(error.message)), [status]);

  useEffect(() => {
    load();
  }, [load]);

  const statusUpdateMessage = (order: Pick<Order, "customerName" | "orderNumber" | "status">) =>
    `Hello ${order.customerName}, your Amanat House order ${order.orderNumber} is ${order.status}.`;

  const whatsappPreview = useMemo(() => {
    if (!selectedOrder) return "";
    return statusUpdateMessage(selectedOrder);
  }, [selectedOrder]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const created = new Date(order.createdAt).getTime();
      if (dateFrom && created < new Date(dateFrom).setHours(0, 0, 0, 0)) return false;
      if (dateTo && created > new Date(dateTo).setHours(23, 59, 59, 999)) return false;
      return true;
    });
  }, [dateFrom, dateTo, orders]);

  const whatsappHref = (order: Order) => {
    const digits = order.customerPhone.replace(/\D/g, "");
    const normalized = digits.startsWith("91") ? digits : `91${digits}`;
    return whatsappLink(statusUpdateMessage(order), normalized);
  };

  const updateStatus = async (orderNumber: string, nextStatus: string) => {
    await adminFetch(`/api/orders/${orderNumber}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: nextStatus })
    });
    toast.success("Order status updated");
    load();
  };

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-amanat-sage">Sales</p>
        <h1 className="font-heading text-4xl font-bold">Orders</h1>
      </div>
      <AdminSection
        title="Orders Manager"
        action={
          <div className="grid gap-2 md:grid-cols-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input">
              <option value="">All statuses</option>
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="field-input" aria-label="Filter from date" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="field-input" aria-label="Filter to date" />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-amanat-sage">
              <tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>WhatsApp</th></tr>
            </thead>
            <tbody className="divide-y divide-amanat-brown/10">
              {filteredOrders.map((order) => (
                <tr key={order.orderNumber} onClick={() => setSelectedOrder(order)} className="cursor-pointer hover:bg-amanat-cream">
                  <td className="py-3 font-black">{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <select value={order.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateStatus(order.orderNumber, e.target.value)} className="rounded-lg border border-amanat-brown/15 px-2 py-1">
                      {statuses.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td><a onClick={(e) => e.stopPropagation()} href={whatsappHref(order)} target="_blank" rel="noreferrer" className="font-black text-amanat-terracotta">Message</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
      {selectedOrder && (
        <AdminSection title={`Order ${selectedOrder.orderNumber}`} action={<button onClick={() => setSelectedOrder(null)} className="rounded-full border px-4 py-2 font-black">Close</button>}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="font-heading text-xl font-bold">Items</h3>
              {selectedOrder.items.map((item, index) =>
                item.hamperContents ? (
                  <div key={`${item.name}-${index}`} className="mt-3 rounded-xl border border-amanat-brown/10 bg-amanat-cream p-3 text-sm">
                    <p className="font-black">Hamper: {item.name} x{item.quantity} — {formatMoney(item.price * item.quantity)}</p>
                    <ul className="mt-2 grid gap-1">
                      {item.hamperContents.items.map((line) => (
                        <li key={`${line.productId}-${line.variant ?? ""}`} className="flex justify-between gap-3 pl-3">
                          <span>
                            {line.name}
                            {line.variant ? ` (${line.variant})` : ""}
                            {line.size ? ` · ${line.size}` : ""} x{line.quantity}
                          </span>
                          <span>{formatMoney(line.unitPrice * line.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-2 grid gap-1 border-t border-amanat-brown/10 pt-2">
                      <div className="flex justify-between"><dt>Items subtotal</dt><dd>{formatMoney(item.hamperContents.itemsSubtotal)}</dd></div>
                      {item.hamperContents.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <dt>{item.hamperContents.pricingMode === "percentage" ? `Discount (${item.hamperContents.discountPercentApplied}%)` : "Hamper saving"}</dt>
                          <dd>−{formatMoney(item.hamperContents.discountAmount)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between"><dt>Packaging</dt><dd>{formatMoney(item.hamperContents.packagingFee)}</dd></div>
                      <div className="flex justify-between font-black"><dt>Hamper total (each)</dt><dd>{formatMoney(item.hamperContents.hamperTotal)}</dd></div>
                    </dl>
                  </div>
                ) : (
                  <p key={`${item.name}-${index}`} className="mt-2">{item.name} x{item.quantity} — {formatCurrency(item.price * item.quantity)}</p>
                )
              )}
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold">Customer</h3>
              <p>{selectedOrder.customerName}</p><p>{selectedOrder.customerPhone}</p><p>{selectedOrder.customerEmail}</p><p>{selectedOrder.deliveryAddress}</p><p>{selectedOrder.pincode}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-amanat-cream p-4">
            <p className="font-black">WhatsApp preview</p>
            <p className="mt-2">{whatsappPreview}</p>
            <a
              href={whatsappHref(selectedOrder)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full bg-amanat-terracotta px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white"
            >
              Message on WhatsApp
            </a>
          </div>
        </AdminSection>
      )}
    </div>
  );
}
