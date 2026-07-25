interface Props {
    status: string;
}

export default function CampaignStatus({ status }: Props) {
    const active = status === "ACTIVE";

    return (
        <span
            className={`text-xs px-2 py-1 rounded-full ${
                active ? "bg-green-900/50 text-green-400" : "bg-slate-700 text-slate-400"
            }`}
        >
            {active ? "กำลังทำงาน" : "หยุด"}
        </span>
    );
}
