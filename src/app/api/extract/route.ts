import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

const EXTRACT_SYSTEM_PROMPT = `你是一个班级通知解析助手。你的任务是从学生收到的班级通知文本中提取待办事项。

当前日期时间：{current_datetime}

请从通知中提取所有待办事项，每个事项包含以下字段：
- title: 事项标题（简洁明了）
- type: 事项类型，只能是以下之一：homework(作业)、exam(考试)、meeting(会议)、payment(缴费)、checkin(打卡)、other(其他)
- due_date: 截止日期时间，ISO 8601 格式（如 "2025-01-20T15:00:00+08:00"）。注意：
  - "本周五" 需要根据当前日期换算为具体日期
  - "下周一" 需要根据当前日期换算
  - "明天" "后天" 等相对时间需要换算
  - 如果通知只说了日期没说时间，默认设为 23:59
  - 如果无法确定具体时间，设为 null
- location: 地点（如有），没有则为 null
- notes: 备注/原始说明（保留重要细节），没有则为 null

重要规则：
1. 一条通知可能包含多个事项，请全部提取
2. 如果通知中没有可提取的待办事项，返回空数组
3. 标题要简洁，不超过30个字
4. 类型判断要准确：布置的作业是 homework，测验/考试是 exam，班会/家长会是 meeting，交费是 payment，签到/打卡是 checkin

请严格按照以下 JSON 格式返回，不要包含其他内容：
{"items": [{"title": "...", "type": "...", "due_date": "...", "location": "...", "notes": "..."}]}`;

function getCurrentDateTime(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return now.toLocaleString("zh-CN", options);
}

// POST /api/extract - Extract tasks from text or images
export async function POST(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const body = await request.json();
    const { text, images } = body as { text?: string; images?: string[] };

    if (!text && (!images || images.length === 0)) {
      return NextResponse.json(
        { success: false, error: "请提供文字内容或上传图片" },
        { status: 400 }
      );
    }

    const currentDatetime = getCurrentDateTime();
    const systemPrompt = EXTRACT_SYSTEM_PROMPT.replace("{current_datetime}", currentDatetime);

    // Build message content
    const contentParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "high" | "low" } }
    > = [];

    if (text) {
      contentParts.push({ type: "text", text: `请从以下通知中提取待办事项：\n\n${text}` });
    }

    if (images && images.length > 0) {
      contentParts.push({
        type: "text",
        text: images.length > 1
          ? "请从以下多张截图中识别文字内容，并提取所有待办事项："
          : "请从以下截图中识别文字内容，并提取所有待办事项：",
      });
      for (const img of images) {
        contentParts.push({
          type: "image_url",
          image_url: { url: img, detail: "high" },
        });
      }
    }

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string | typeof contentParts }> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: contentParts },
    ];

    const response = await client.invoke(messages, {
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.2,
    });

    // Parse the response
    let items: Array<{
      title: string;
      type: string;
      due_date: string | null;
      location: string | null;
      notes: string | null;
    }> = [];

    try {
      const content = response.content.trim();
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        items = parsed.items || [];
      }
    } catch {
      // If parsing fails, return the raw content for debugging
      return NextResponse.json({
        success: false,
        error: "AI 返回格式异常，请重试",
        raw: response.content,
      });
    }

    return NextResponse.json({ success: true, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
