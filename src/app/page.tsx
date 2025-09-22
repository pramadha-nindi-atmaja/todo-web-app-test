"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddTaskDialog } from "@/components/addTaskDialog";

interface Task {
  id: number;
  title: string;
  done: boolean;
  priority: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log(status);

    if (status === "authenticated") {
      fetchTasks();
    } else if (status === "unauthenticated") {
      router.push(`/login`);
    }
  }, [status, router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId: number, done: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ done }),
      });

      if (response.ok) {
        setTasks(
          tasks.map((task) => (task.id === taskId ? { ...task, done } : task))
        );
      }
    } catch (error) {
      console.error("Failed to update task:", error);
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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-yellow-100 text-yellow-800";
      case 3:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Normal";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
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

        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No tasks yet. Create your first task!
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks
              .sort((a, b) => {
                if (a.done !== b.done) return a.done ? 1 : -1;
                return b.priority - a.priority;
              })
              .map((task) => (
                <Card key={task.id} className={task.done ? "opacity-60" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={task.done}
                        onCheckedChange={(checked) =>
                          toggleTask(task.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${
                            task.done ? "line-through" : ""
                          }`}
                        >
                          {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Created{" "}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Badge>
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
        </div>
      </main>

      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onTaskAdded={(newTask) => {
          setTasks([newTask, ...tasks]);
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}
