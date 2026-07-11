"use client";

import Image from "next/image";

import { Platform } from "@/types/platform";
import { PLATFORMS } from "@/constants/platform";

interface Props {
    value: Platform;
    onChange: (platform: Platform) => void;
}

export default function PlatformSelector({ value, onChange }: Props) {
    return (
        <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((platform) => (
                <button
                    key={platform.id}
                    onClick={() => onChange(platform.id)}
                    className={`
            flex items-center gap-3
            rounded-xl
            border
            px-5
            py-3
            transition-all
            ${
                value === platform.id
                    ? "border-blue-500 bg-slate-800"
                    : "border-slate-700 bg-slate-900 hover:bg-slate-800"
            }
          `}
                >
                    <Image src={platform.icon} alt={platform.name} width={24} height={24} />

                    <span className="text-white text-sm font-medium">{platform.name}</span>
                </button>
            ))}
        </div>
    );
}
