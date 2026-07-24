import { NormalizedContentImportResult } from "./content-import.types";

export function validateContentImportResult(result: NormalizedContentImportResult): void {
    if (result.posts.length === 0) {
        throw new Error("ไม่พบข้อมูลโพสต์ในไฟล์");
    }

    for (const post of result.posts) {
        if (!post.externalPostId) {
            throw new Error("Post ID ต้องไม่เป็นค่าว่าง");
        }
    }
}
