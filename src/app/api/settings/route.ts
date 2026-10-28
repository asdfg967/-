import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// GET /api/settings - 获取全部设置
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from("app_settings").select("key, value");
    if (error) throw new Error(`查询失败: ${error.message}`);

    const settings: Record<string, string> = {};
    (data as { key: string; value: string | null }[]).forEach((row) => {
      settings[row.key] = row.value ?? "";
    });
    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/settings - 更新设置  body: { key, value }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key) {
      return NextResponse.json({ success: false, error: "key 不能为空" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("app_settings")
      .upsert({ key, value: String(value ?? ""), updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw new Error(`保存失败: ${error.message}`);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
