export default function DashboardLoading() {
    return (
        <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-200/70 rounded-2xl p-5 h-24 animate-pulse" />
            ))}
        </div>
    );
}
