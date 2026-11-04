"use client";

import { useState, useEffect } from "react";

// 定义任务的类型
export type Task = {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  location: string | null;
  notes: string | null;
  completed: boolean;
  created_at?: string;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 页面加载时，从浏览器里把数据拿出来
  useEffect(() => {
    try {
      const localData = localStorage.getItem("my_tasks");
      if (localData) {
        setTasks(JSON.parse(localData));
      }
    } catch (e) {
      console.error("读取本地数据失败", e);
    }
    setLoading(false);
  }, []);

  // 2. 保存数据的方法
  const addTasks = (newTasks: Partial<Task>[]) => {
    const formattedTasks: Task[] = newTasks.map(item => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      title: item.title || "未命名",
      type: item.type || "other",
      due_date: item.due_date || null,
      location: item.location || null,
      notes: item.notes || null,
      completed: false,
      created_at: new Date().toISOString()
    }));

    const updated = [...formattedTasks, ...tasks];
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  // 3. 切换完成状态
  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  // 4. 删除任务
  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem("my_tasks", JSON.stringify(updated));
  };

  return {
    tasks,
    loading,
    addTasks,
    toggleTask,
    deleteTask
  };
}
