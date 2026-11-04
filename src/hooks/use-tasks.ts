"use client";

import { useState, useEffect } from "react";

export type Task = {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  start_time?: string | null;
  color?: string;
  status?: string;
  is_manual?: boolean;
  location: string | null;
  notes: string | null;
  completed: boolean;
  created_at?: string;
};

export const TYPE_LABELS: Record<string, string> = {
  homework: "作业", exam: "考试", meeting: "会议", payment: "缴费", checkin: "打卡", other: "其他",
};

export const TYPE_COLORS: Record<string, string> = {
  homework: "bg-blue-100 text-blue-600", exam: "bg-red-100 text-red-600", meeting: "bg-purple-100 text-purple-600", payment: "bg-orange-100 text-orange-600", checkin: "bg-green-100 text-green-600", other: "bg-gray-100 text-gray-600",
};

export function getUrgency(due_date: string | null): "overdue" | "expired" | "today" | "upcoming" | "none" {
  if (!due_date) return "none";
  const now = new Date();
  const due = new Date(due_date);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  return "upcoming";
}

export function formatDueDate(due_date: string | null): string {
  if (!due_date) return "无截止时间";
  const due = new Date(due_date);
  return due.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  // 👇 关键！初始状态直接设为 false，不给它转圈圈的机会
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    try {
      const localData = localStorage.getItem("my_tasks");
      if (localData) {
        setTasks(JSON.parse(localData));
      }
    } catch (e) {
      console.error("读取本地数据失败", e);
    }
  }, []);

  const addTasks = (newTasks: Partial<Task>[]) => {
    const formattedTasks: Task[] = newTasks.map(item => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      title: item.title || "未命名",
      type: item.type || "other",
      due_date: item.due_date || null,
      start_time: item.start_time || null,
      color: item.color || "",
      status: item.status || "pending", // 确保默认是 pending
      is_manual: item.is_manual || false,
      location: item.location || null,
      notes: item.notes || null,
      completed: false,
      created_at: new Date().toISOString()
    }));

    const updated = [...formattedTasks, ...tasks];
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  return {
    tasks,
    loading,
    addTasks,
    createTask: addTasks,
    createtask: addTasks,
    toggleTask,
    deleteTask,
    updateTask,
    updatetask: updateTask
  };
}
