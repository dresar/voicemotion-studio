"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import { copyText, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { AdminLedgerItem } from "@/types";

export function AdminLedgerView() {
  const { showToast } = useToast();
  const [ledger, setLedger] = useState<AdminLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListLedger();
      setLedger(data);
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const filteredLedger = ledger.filter((item) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      item.userEmail.toLowerCase().includes(query) ||
      (item.reason && item.reason.toLowerCase().includes(query)) ||
      (item.ref && item.ref.toLowerCase().includes(query))
    );
  });

  const totalAdded = ledger.filter((item) => item.delta > 0).reduce((sum, item) => sum + item.delta, 0);
  const totalSpent = Math.abs(
    ledger.filter((item) => item.delta < 0).reduce((sum, item) => sum + item.delta, 0)
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card variant="raised" padding="md" className="shadow-neu-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Total Transaksi Tercatat
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-ink">{formatNumber(ledger.length, 0)}</p>
          <p className="mt-1 text-xs text-muted">Maksimal 200 mutasi terakhir</p>
        </Card>

        <Card variant="raised" padding="md" className="shadow-neu-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Kredit Masuk (Top-up / Bonus)
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-success">+{formatNumber(totalAdded, 0)}</p>
          <p className="mt-1 text-xs text-muted">Total penambahan kredit pengguna</p>
        </Card>

        <Card variant="raised" padding="md" className="shadow-neu-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Kredit Digunakan (Generasi / Render)
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-danger">-{formatNumber(totalSpent, 0)}</p>
          <p className="mt-1 text-xs text-muted">Total konsumsi kredit studio</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card variant="raised" padding="md" className="flex flex-wrap items-center justify-between gap-3 shadow-neu-sm">
        <div className="relative w-full max-w-sm">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email, alasan, atau referensi..."
            aria-label="Cari mutasi kredit"
            className="neu-field pl-9 text-xs"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void loadLedger()}
          leftIcon={<Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} />}
          className="h-9 px-3"
        >
          <span>Segarkan Log</span>
        </Button>
      </Card>

      {/* Ledger Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filteredLedger.length === 0 ? (
        <EmptyState
          icon="creditCard"
          title={search.trim() ? "Log transaksi tidak ditemukan" : "Belum ada transaksi kredit"}
          action={
            <Button variant="secondary" onClick={() => void loadLedger()}>
              Segarkan
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line/70 bg-surface shadow-neu-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line/70 bg-bg-sunken text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Mutasi Kredit</th>
                  <th className="px-4 py-3">Alasan / Deskripsi</th>
                  <th className="px-4 py-3">ID Referensi</th>
                  <th className="px-4 py-3 text-right">Waktu Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-sunken/40 transition">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <div className="flex items-center gap-1.5">
                        <Icon name="mail" size={13} className="text-muted" />
                        <span className="font-medium">{item.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-extrabold">
                      {item.delta > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-xs text-success">
                          +{item.delta}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-danger/15 px-2 py-0.5 text-xs text-danger">
                          {item.delta}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/90 font-medium">
                      {item.reason || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{item.ref || item.id}</span>
                        {item.ref && (
                          <button
                            type="button"
                            onClick={() => {
                              void copyText(item.ref);
                              showToast("Referensi disalin", "success");
                            }}
                            className="text-muted hover:text-primary-strong"
                            title="Salin Ref"
                          >
                            <Icon name="copy" size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatRelativeTime(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
