import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, type, due_date, location, notes, status, completed_at } = body;

    const client = getSupabaseClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (location !== undefined) updateData.location = location || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed" && !completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      if (status === "pending") {
        updateData.completed_at = null;
      }
    }

    const { data, error } = await client
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`更新失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = getSupabaseClient();
    const { error } = await client.from("tasks").delete().eq("id", id);
    if (error) throw new Error(`删除失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
