import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/storage/s3";

// POST /api/diaries/upload - multipart/form-data, field: file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "未找到文件" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 规范文件名（仅允许字母数字点下划线短横）
    const rawName = file.name || "image.jpg";
    const safeName = rawName.replace(/[^A-Za-z0-9._-]/g, "_").slice(-60) || "image.jpg";
    const fileName = `diaries/${Date.now()}_${safeName}`;

    const storage = getStorage();
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type || "image/jpeg",
    });

    const url = await storage.generatePresignedUrl({ key, expireTime: 604800 });

    return NextResponse.json({ success: true, data: { key, url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
