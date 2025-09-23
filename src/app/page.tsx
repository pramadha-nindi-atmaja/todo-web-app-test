"use client";

import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddTaskDialog } from "@/components/addTaskDialog";
import {
  Pagination,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
  PaginationContent,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [togglingTasks, setTogglingTasks] = useState<Set<number>>(new Set());

  const fetchTasks = useCallback(
    async (page: number, query = "", size = pageSize) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/tasks?page=${page}&pageSize=${size}&q=${encodeURIComponent(
            query
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          setTasks(data.items);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  // const toggleTask = async (taskId: number, done: boolean) => {
  //   try {
  //     const response = await fetch(`/api/tasks/${taskId}/toggle`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ done }),
  //     });
  //
  //     if (response.ok) {
  //       setTasks(
  //         tasks.map((task) => (task.id === taskId ? { ...task, done } : task))
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Failed to update task:", error);
  //   }
  // };
  const toggleTask = async (taskId: number, done: boolean) => {
    setTogglingTasks((prev) => new Set(prev).add(taskId));
    try {
      const response = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (response.ok) {
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, done } : task))
        );
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setTogglingTasks((prev) => {
        const copy = new Set(prev);
        copy.delete(taskId);
        return copy;
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks(page);
    } else if (status === "unauthenticated") {
      router.push(`/login`);
    }
  }, [status, page, router, fetchTasks]);

  const handleSearch = () => {
    setPage(1);
    fetchTasks(1, search);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Todo Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Your Tasks</h2>
              <p className="text-muted-foreground">
                {tasks.filter((t) => !t.done).length} pending,{" "}
                {tasks.filter((t) => t.done).length} completed
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className=""
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Button
              onClick={() => {
                handleSearch();
              }}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {status === "loading" || isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No tasks yet. Create your first task!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className={task.done ? "opacity-60" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        {togglingTasks.has(task.id) ? (
                          <Spinner className="w-5 h-5" />
                        ) : (
                          <Switch
                            checked={task.done}
                            onCheckedChange={(checked) =>
                              toggleTask(task.id, checked as boolean)
                            }
                          />
                        )}
                        <div className="flex-1">
                          <h3 className={`font-medium ${task.done ? "line-through" : ""}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(task.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                ))
              )}
            </>
          )}
        </div>
        <Pagination>
          <PaginationContent className="justify-center mt-6">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                const newSize = parseInt(value, 10);
                setPageSize(newSize);
                setPage(1);
                fetchTasks(1, search, newSize);
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                // disabled={page <= 1}
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(
              (p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {totalPages > 5 && page < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                // disabled={page >= totalPages}
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>

      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onTaskAdded={(newTask) => {
          setTasks([newTask, ...tasks]);
          setPage(1);
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}
