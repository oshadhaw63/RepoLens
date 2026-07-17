import { NextResponse } from "next/server";

import { parserDemoResult } from "@/lib/repolens/parser-demo";

export function GET() {
  return NextResponse.json(parserDemoResult);
}