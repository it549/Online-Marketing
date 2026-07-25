interface Props {
    message: string;
}

export default function DashboardError({ message }: Props) {
    return <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">⚠️ {message}</div>;
}
