interface Props {
    message: string;
}

export default function DashboardError({ message }: Props) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm shadow-sm">⚠️ {message}</div>;
}
