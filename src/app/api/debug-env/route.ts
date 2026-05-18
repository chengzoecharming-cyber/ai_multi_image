import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    kimiKeyExists: !!process.env.KIMI_API_KEY,
    kimiKeyPrefix: process.env.KIMI_API_KEY?.slice(0, 15),
    kimiModel: process.env.KIMI_MODEL,
  });
}
