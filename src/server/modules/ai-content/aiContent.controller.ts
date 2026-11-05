import { NextRequest, NextResponse } from "next/server";
import { generateContentService } from "./aiContent.service";

export async function generateContentController(
    req: NextRequest,
) {
    try {
        const body = await req.json();

        const result = await generateContentService(body);

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            {
                error:
                    e instanceof Error
                        ? e.message
                        : "Generate Content Error",
            },
            {
                status: 500,
            },
        );
    }
}