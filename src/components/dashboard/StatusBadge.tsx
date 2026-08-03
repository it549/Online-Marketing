interface Props {
    status?: string;
}

export default function StatusBadge({ status }: Props) {
    if (!status) return null;

    const active = status === "ACTIVE";

    return (
        <span
            className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-xs
        font-medium
        ring-1
        ring-inset
        ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}
      `}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {active ? "กำลังทำงาน" : "หยุด"}
        </span>
    );
}
