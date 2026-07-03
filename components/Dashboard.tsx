"use client";
import { useEffect, useState } from "react";

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  color: string;
}

interface Campaign {
  name: string;
  spend: string;
  leads: string;
  cpl: string;
  status: string;
}

interface MetaData {
  spend: string;
  leads: string;
  cpl: string;
  ctr: string;
  campaigns: Campaign[];
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); }
        else { setData({ ...d, campaigns: d.campaigns || [] }); }
        setLoading(false);
      })
      .catch(() => { setError("ไม่สามารถดึงข้อมูลได้ — ตรวจสอบ META_ACCESS_TOKEN"); setLoading(false); });
  }, []);

  const cards: MetricCard[] = data
    ? [
        { label: "ยอดใช้จ่ายรวม", value: `฿${Number(data.spend).toLocaleString()}`, sub: "30 วันล่าสุด", color: "text-blue-400" },
        { label: "Leads ทั้งหมด", value: data.leads, sub: "30 วันล่าสุด", color: "text-green-400" },
        { label: "ค่าต่อ Lead (CPL)", value: `฿${Number(data.cpl).toFixed(0)}`, sub: "เฉลี่ย", color: "text-yellow-400" },
        { label: "CTR", value: `${Number(data.ctr).toFixed(2)}%`, sub: "Click-through rate", color: "text-purple-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">ภาพรวม Facebook Ads</h2>

      {loading && (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-400 text-xs mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-slate-500 text-xs mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="font-semibold text-white text-sm">แคมเปญทั้งหมด</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left px-5 py-3">ชื่อแคมเปญ</th>
                  <th className="text-right px-5 py-3">Spend</th>
                  <th className="text-right px-5 py-3">Leads</th>
                  <th className="text-right px-5 py-3">CPL</th>
                  <th className="text-center px-5 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-5 py-3 text-white">{c.name}</td>
                    <td className="px-5 py-3 text-right text-slate-300">฿{Number(c.spend).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-green-400">{c.leads}</td>
                    <td className="px-5 py-3 text-right text-yellow-400">฿{Number(c.cpl).toFixed(0)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.status === "ACTIVE" ? "bg-green-900/50 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                        {c.status === "ACTIVE" ? "กำลังทำงาน" : "หยุด"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
