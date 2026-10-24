import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { signImageUrls } from "@/storage/s3";

interface DiaryRow {
  id: string;
  diary_date: string;
  content: string;
  image_keys: string[] | null;
  location: string | null;
  mood: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

// tags 字段当前用于存储天气，前缀 weather:
function decodeWeather(tags: string | null): { weather: string | null } {
  if (tags && tags.startsWith("weather:")) {
    return { weather: tags.slice("weather:".length) || null };
  }
  return { weather: null };
}

async function normalize(row: DiaryRow) {
  const keys = row.image_keys || [];
  const urlMap = await signImageUrls(keys);
  return {
    ...row,
    image_keys: keys,
    images: keys.map((k) => urlMap[k] || ""),
    ...decodeWeather(row.tags),
  };
}

// GET /api/diaries?date=YYYY-MM-DD  指定日期；不传则全部倒序
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const client = getSupabaseClient();
    let query = client.from("diaries").select("*");
    if (date) {
      query = query.eq("diary_date", date);
    } else {
      query = query.order("diary_date", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询失败: ${error.message}`);

    const rows = data as DiaryRow[];
    if (date) {
      const row = rows[0] || null;
      return NextResponse.json({ success: true, data: row ? await normalize(row) : null });
    }
    return NextResponse.json({ success: true, data: await Promise.all(rows.map(normalize)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/diaries - 创建或更新某天日记（一天一篇，upsert）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diary_date, content, image_keys, location, mood, weather } = body;

    if (!diary_date) {
      return NextResponse.json({ success: false, error: "日期不能为空" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("diaries")
      .upsert(
        {
          diary_date,
          content: content || "",
          image_keys: Array.isArray(image_keys) ? image_keys : [],
          location: location || null,
          mood: mood || null,
          tags: weather ? `weather:${weather}` : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "diary_date" }
      )
      .select()
      .single();

    if (error) throw new Error(`保存失败: ${error.message}`);
    return NextResponse.json({ success: true, data: await normalize(data as DiaryRow) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
