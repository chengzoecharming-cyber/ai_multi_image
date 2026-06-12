"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Loader2, ExternalLink } from "lucide-react";

interface TaskItem {
  id: string;
  status: string;
  resultImageUrl: string | null;
  createdAt: string;
  userPrompt: string | null;
}

export default function AssetsPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-image/tasks?limit=50")
      .then((res) => (res.ok ? res.json() : { tasks: [] }))
      .then((data: { tasks?: TaskItem[] }) => {
        setTasks(
          (data.tasks || [])
            .filter((t) => t.resultImageUrl && t.status === "completed")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden">
      <div className="px-6 py-4 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-semibold text-[#0f1419]">我的素材</h1>
          <p className="text-sm text-stone-500 mt-0.5">查看和管理你生成的所有图片</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ImageIcon className="w-10 h-10 text-stone-300 mb-3" />
              <p className="text-sm text-stone-500">暂无素材</p>
              <p className="text-xs text-stone-400 mt-1">
                去生图工作台生成图片后，这里会显示你的作品
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tasks.map((task) => (
                <a
                  key={task.id}
                  href={task.resultImageUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 hover:shadow-md transition-all"
                >
                  <img
                    src={task.resultImageUrl || ""}
                    alt={task.userPrompt || "生成的图片"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
