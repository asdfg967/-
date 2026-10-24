import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

interface Task {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  source_text: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/tasks - List all tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const client = getSupabaseClient();
    let query = client
      .from("tasks")
      .select("id, title, type, due_date, location, notes, status, source_text, completed_at, created_at, updated_at")
      .order("due_date", { ascending: true, nullsFirst: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询失败: ${error.message}`);

    return NextResponse.json({ success: true, data: data as Task[] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, due_date, location, notes, source_text } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "标题不能为空" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("tasks")
      .insert({
        title,
        type: type || "other",
        due_date: due_date || null,
        location: location || null,
        notes: notes || null,
        source_text: source_text || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(`创建失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/tasks - Batch create tasks
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks: tasksData } = body;

    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      return NextResponse.json({ success: false, error: "任务列表不能为空" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const insertData = tasksData.map((t: { title: string; type?: string; due_date?: string; location?: string; notes?: string; source_text?: string }) => ({
      title: t.title,
      type: t.type || "other",
      due_date: t.due_date || null,
      location: t.location || null,
      notes: t.notes || null,
      source_text: t.source_text || null,
      status: "pending" as const,
    }));

    const { data, error } = await client.from("tasks").insert(insertData).select();
    if (error) throw new Error(`批量创建失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
