"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Wand2,
  FolderOpen,
  ImageIcon,
  Clock,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppHeader from "@/components/common/AppHeader";
import {
  getCategories,
  getPromptGroups,
  createPromptGroup,
  updatePromptGroup,
  deletePromptGroup,
  duplicatePromptGroup,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";
import { PromptGroup, PromptCategory } from "@/lib/types";

export default function PromptGroupsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PromptGroup | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PromptCategory | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "category"; id: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, groupRes] = await Promise.all([
        getCategories(),
        getPromptGroups(),
      ]);
      setCategories(catRes.data);
      setGroups(
        groupRes.data.map((g) => ({
          ...g,
          config:
            typeof g.configJson === "string"
              ? JSON.parse(g.configJson)
              : g.config || { ratio: "1:1", width: 1024, height: 1024 },
        }))
      );
    } catch {
      toast.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredGroups = groups.filter((g) => {
    const matchesCategory = selectedCategoryId
      ? g.categoryId === selectedCategoryId
      : true;
    const matchesSearch = searchQuery
      ? g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.promptContent.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleSaveGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGroup) return;

    try {
      const payload = {
        name: editingGroup.name,
        categoryId: editingGroup.categoryId,
        promptContent: editingGroup.promptContent,
        negativePrompt: editingGroup.negativePrompt,
        config: editingGroup.config || { ratio: "1:1", width: 1024, height: 1024, model: "default", quality: "standard" },
        remark: editingGroup.remark,
        references: editingGroup.references || [],
      };

      if (editingGroup.id) {
        await updatePromptGroup(editingGroup.id, payload);
        toast.success("更新成功");
      } else {
        await createPromptGroup(payload);
        toast.success("创建成功");
      }
      setGroupModalOpen(false);
      setEditingGroup(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      if (editingCategory.id) {
        await updateCategory(editingCategory.id, { name: editingCategory.name });
        toast.success("更新成功");
      } else {
        await createCategory(editingCategory.name);
        toast.success("创建成功");
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "group") {
        await deletePromptGroup(deleteTarget.id);
        toast.success("删除成功");
      } else {
        await deleteCategory(deleteTarget.id);
        toast.success("删除成功");
      }
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const handleDuplicate = async (group: PromptGroup) => {
    try {
      await duplicatePromptGroup(group.id);
      toast.success("复制成功");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "复制失败");
    }
  };

  const openGroupModal = (group?: PromptGroup) => {
    if (group) {
      setEditingGroup({
        ...group,
        config: group.config || { ratio: "1:1", width: 1024, height: 1024, model: "default", quality: "standard" },
      });
    } else {
      setEditingGroup({
        id: "",
        tenantId: "default",
        userId: "default",
        categoryId: categories[0]?.id || "",
        name: "",
        promptContent: "",
        negativePrompt: "",
        config: { ratio: "1:1", width: 1024, height: 1024, model: "default", quality: "standard" },
        remark: "",
        useCount: 0,
        references: [],
        createdAt: "",
        updatedAt: "",
      });
    }
    setGroupModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FC]">
      <AppHeader />
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-500" />
              提示词组管理
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">管理你的提示词组分类和内容</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingCategory({ id: "", tenantId: "default", userId: "default", name: "", sortOrder: 0, createdAt: "", updatedAt: "" });
                setCategoryModalOpen(true);
              }}
              className="border-gray-300"
            >
              <Tag className="w-4 h-4 mr-1.5" />
              新建分类
            </Button>
            <Button
              onClick={() => openGroupModal()}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              新建提示词组
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="搜索提示词组..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm bg-white border-gray-200"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategoryId === null
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-xs font-medium text-gray-600">名称</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">分类</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">参考图</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">尺寸</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">最近使用</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                    暂无提示词组，点击右上角新建
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm text-gray-700 font-medium">
                      {group.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-gray-200 text-gray-500">
                        {group.category?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {group.references?.length || 0} 张
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {group.config?.width}×{group.config?.height}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {group.lastUsedAt
                          ? new Date(group.lastUsedAt).toLocaleDateString("zh-CN")
                          : "未使用"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/ai-image/workbench?group=${group.id}`)}
                          className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Wand2 className="w-3.5 h-3.5 mr-1" />
                          使用
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openGroupModal(group)}
                          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(group)}
                          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteTarget({ type: "group", id: group.id });
                            setDeleteConfirmOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Group Modal */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingGroup?.id ? "编辑提示词组" : "新建提示词组"}
            </DialogTitle>
          </DialogHeader>
          {editingGroup && (
            <form onSubmit={handleSaveGroup} className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">名称</label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="输入名称"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">分类</label>
                <select
                  value={editingGroup.categoryId}
                  onChange={(e) => setEditingGroup({ ...editingGroup, categoryId: e.target.value })}
                  className="w-full h-8 text-sm rounded-md border border-gray-200 px-2"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Prompt</label>
                <textarea
                  value={editingGroup.promptContent}
                  onChange={(e) => setEditingGroup({ ...editingGroup, promptContent: e.target.value })}
                  placeholder="输入 Prompt"
                  className="w-full min-h-[80px] text-sm rounded-md border border-gray-200 px-3 py-2 resize-none"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)} className="h-8 text-sm">
                  取消
                </Button>
                <Button type="submit" className="h-8 text-sm bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                  {editingGroup.id ? "保存" : "创建"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingCategory?.id ? "编辑分类" : "新建分类"}
            </DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleSaveCategory} className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">分类名称</label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="输入分类名称"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="h-8 text-sm">
                  取消
                </Button>
                <Button type="submit" className="h-8 text-sm bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                  {editingCategory.id ? "保存" : "创建"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mt-2">
            确定要删除这个{deleteTarget?.type === "group" ? "提示词组" : "分类"}吗？此操作不可撤销。
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="h-8 text-sm">
              取消
            </Button>
            <Button onClick={handleDelete} variant="destructive" className="h-8 text-sm">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
