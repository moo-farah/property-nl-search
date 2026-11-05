import { connection } from "next/server";
import { NextResponse } from "next/server";
import { searchStats } from "@/lib/searchLog";

export async function GET() {
    await connection();
    return NextResponse.json(searchStats());
}
