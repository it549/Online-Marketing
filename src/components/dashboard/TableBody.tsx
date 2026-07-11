import { TableColumn, TableRow } from "@/types/table";
import StatusBadge from "./StatusBadge";

interface Props {
    columns: TableColumn[];
    rows: TableRow[];
}

export default function TableBody({ columns, rows }: Props) {
    return (
        <tbody>
            {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    {columns.map((column) => {
                        const value = row[column.key];

                        if (column.key === "status") {
                            return (
                                <td key={column.key} className="px-5 py-3 text-center">
                                    <StatusBadge status={String(value)} />
                                </td>
                            );
                        }

                        return (
                            <td
                                key={column.key}
                                className={`
                  px-5
                  py-3
                  ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"}
                  text-white
                `}
                            >
                                {String(value)}
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tbody>
    );
}
