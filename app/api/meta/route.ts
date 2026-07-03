import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN หรือ META_AD_ACCOUNT_ID ไม่ได้ตั้งค่า" }, { status: 400 });
  }

  const fields = "name,status,spend,actions,ctr,cost_per_action_type";
  const datePreset = "last_30d";
  const url = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=name,status,insights.date_preset(${datePreset}){spend,actions,ctr,cost_per_action_type}&access_token=${token}`;

  try {
    const res = await fetch(url);
    const raw = await res.json();

    if (raw.error) {
      return NextResponse.json({ error: raw.error.message }, { status: 400 });
    }

    const campaigns = (raw.data || []).map((c: any) => {
      const ins = c.insights?.data?.[0] || {};
      const leads = ins.actions?.find((a: any) => a.action_type === "lead")?.value || "0";
      const spend = ins.spend || "0";
      const cpl = ins.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value || "0";
      return {
        name: c.name,
        status: c.status,
        spend,
        leads,
        cpl,
      };
    });

    const totalSpend = campaigns.reduce((s: number, c: any) => s + Number(c.spend), 0);
    const totalLeads = campaigns.reduce((s: number, c: any) => s + Number(c.leads), 0);
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    return NextResponse.json({
      spend: totalSpend.toFixed(2),
      leads: String(totalLeads),
      cpl: avgCpl.toFixed(2),
      ctr: "0",
      campaigns,
    });
  } catch (e) {
    return NextResponse.json({ error: "เชื่อมต่อ Meta API ไม่สำเร็จ" }, { status: 500 });
  }
}
