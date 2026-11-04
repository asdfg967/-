"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BottomNav, { TabKey } from "@/components/bottom-nav";

const TodoTab = dynamic(() => import("@/components/todo-tab"), { ssr: false });
const WeekTab = dynamic(() => import("@/components/week-tab"), { ssr: false });
const HabitTab = dynamic(() => import("@/components/habit-tab"), { ssr: false });
const DiaryTab = dynamic(() => import("@/components/diary-tab"), { ssr: false });

export default function Home() {
  const [tab, setTab] = useState<TabKey>("todo");

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {tab === "todo" && <TodoTab />}
      {tab === "week" && <WeekTab />}
      {tab === "habit" && <HabitTab />}
      {tab === "diary" && <DiaryTab />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
