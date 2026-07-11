import { DashboardTable as DashboardTableType } from "@/types/table";

import TableHeader from "./TableHeader";
import TableBody from "./TableBody";

interface Props {
    table: DashboardTableType;
}

export default function DashboardTable({ table }: Props) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 px-5 py-4">
                <h3 className="text-sm font-semibold text-white">รายการข้อมูล</h3>
            </div>

            <table className="w-full text-sm">
                <TableHeader columns={table.columns} />

                <TableBody columns={table.columns} rows={table.rows} />
            </table>
        </div>
    );
}
