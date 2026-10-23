import Link from "next/link";

// TODO: replace with the real contact address before submitting to Meta / TikTok / Shopee app review.
export const LEGAL_CONTACT_EMAIL = "[ใส่อีเมลติดต่อ]";
export const LEGAL_UPDATED_AT = "23 ตุลาคม 2569";

export interface LegalSection {
    title: string;
    paragraphs?: string[];
    items?: string[];
}

interface Props {
    title: string;
    intro: string;
    sections: LegalSection[];
}

export default function LegalPage({ title, intro, sections }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10">
            <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="mt-1 text-xs text-slate-500">Rungsiyo Marketing AI · อัปเดตล่าสุด {LEGAL_UPDATED_AT}</p>
                <p className="mt-5 text-sm leading-relaxed text-slate-700">{intro}</p>

                {sections.map((section, index) => (
                    <section key={section.title} className="mt-7">
                        <h2 className="text-base font-semibold text-slate-900">
                            {index + 1}. {section.title}
                        </h2>
                        {section.paragraphs?.map((text) => (
                            <p key={text} className="mt-2 text-sm leading-relaxed text-slate-700">
                                {text}
                            </p>
                        ))}
                        {section.items && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
                                {section.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}

                <nav className="mt-10 flex gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <Link href="/privacy" className="hover:text-indigo-600">นโยบายความเป็นส่วนตัว</Link>
                    <Link href="/terms" className="hover:text-indigo-600">ข้อกำหนดการใช้บริการ</Link>
                    <Link href="/login" className="ml-auto hover:text-indigo-600">เข้าสู่ระบบ</Link>
                </nav>
            </article>
        </div>
    );
}
