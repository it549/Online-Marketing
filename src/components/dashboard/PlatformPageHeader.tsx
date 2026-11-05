import Image from "next/image";

interface Props {
    name: string;
    icon: string;
    description: string;
}

export default function PlatformPageHeader({ name, icon, description }: Props) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <Image src={icon} alt={name} width={22} height={22} />
            </div>

            <div>
                <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
        </div>
    );
}
