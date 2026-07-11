interface Props {
    status?: string;
}

export default function StatusBadge({ status }: Props) {
    if (!status) return null;

    const active = status === "ACTIVE";

    return (
        <span
            className={`
        rounded-full
        px-2
        py-1
        text-xs
        ${active ? "bg-green-900/50 text-green-400" : "bg-slate-700 text-slate-400"}
      `}
        >
            {active ? "กำลังทำงาน" : "หยุด"}
        </span>
    );
}
