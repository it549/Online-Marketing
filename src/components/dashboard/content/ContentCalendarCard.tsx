import { MessageCircle, Users } from "lucide-react";
import { ContentCalendarPost } from "@/types/contentCalendar";

interface Props {
    post: ContentCalendarPost;
}

export default function ContentCalendarCard({ post }: Props) {
    const card = (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
            <div className="aspect-video w-full overflow-hidden bg-slate-100">
                {post.imageUrl ? (
                    // Facebook CDN hosts are dynamic and the URLs expire -- not worth whitelisting via next/image remotePatterns.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-300">ไม่มีรูป</div>
                )}
            </div>

            <div className="space-y-1.5 p-2.5">
                <p className="line-clamp-2 text-xs font-medium text-slate-800">{post.title}</p>
                <p className="text-[11px] text-slate-400">{post.time} น.</p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1" title="Reach">
                        <Users className="h-3 w-3 shrink-0" strokeWidth={2} />
                        {post.reach !== null ? post.reach.toLocaleString() : "-"}
                    </span>
                    <span className="flex items-center gap-1" title="Comments">
                        <MessageCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                        {post.comments !== null ? post.comments.toLocaleString() : "-"}
                    </span>
                </div>
            </div>
        </div>
    );

    if (!post.permalink) return card;

    return (
        <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="block">
            {card}
        </a>
    );
}
