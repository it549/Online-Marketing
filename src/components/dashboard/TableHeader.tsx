import { TableColumn } from "@/types/table";

interface Props {
    columns: TableColumn[];
}

export default function TableHeader({ columns }: Props) {
    return (
        <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-400">
                {columns.map((column) => (
                    <th
                        key={column.key}
                        className={`
              px-5
              py-3
              ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}
            `}
                    >
                        {column.label}
                    </th>
                ))}
            </tr>
        </thead>
    );
}
