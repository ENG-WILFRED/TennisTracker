import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { Task } from '@/types/task-system';
import { TaskCard } from './TaskCard';

interface CoachDashboardProps {
  coachId?: string;
}

type TabType = 'assigned' | 'active' | 'completed';

export function CoachTaskDashboard({ coachId }: CoachDashboardProps) {
  const [tasks, setTasks] = useState<{
    assigned: Task[];
    active: Task[];
    completed: Task[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('assigned');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Use the new /api/admin/tasks/my-tasks endpoint or specific coach endpoint
        const endpoint = coachId 
          ? `/api/admin/tasks/coach/${coachId}`
          : `/api/admin/tasks/my-tasks`;
        
        const res = await authenticatedFetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch tasks');
        
        const data = await res.json();
        const taskList = Array.isArray(data.tasks) ? data.tasks : [];

        // Categorize tasks by status
        const assigned = taskList.filter((t: any) => t.status === 'pending');
        const active = taskList.filter((t: any) => t.status === 'in_progress');
        const completed = taskList.filter((t: any) => t.status === 'completed');

        setTasks({
          assigned,
          active,
          completed,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [coachId]);

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      const res = await authenticatedFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error('Action failed');

      // Refetch tasks using correct endpoint
      const endpoint = coachId 
        ? `/api/admin/tasks/coach/${coachId}`
        : `/api/admin/tasks/my-tasks`;
      
      const dashRes = await authenticatedFetch(endpoint);
      if (dashRes.ok) {
        const data = await dashRes.json();
        const taskList = Array.isArray(data.tasks) ? data.tasks : [];
        const assigned = taskList.filter((t: any) => t.status === 'pending');
        const active = taskList.filter((t: any) => t.status === 'in_progress');
        const completed = taskList.filter((t: any) => t.status === 'completed');

        setTasks({
          assigned,
          active,
          completed,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Expose method to add task optimistically (for parent components)
  const addTaskOptimistically = (newTask: any) => {
    if (!tasks) return;
    
    const formattedTask = {
      id: newTask.id || newTask.data?.id,
      title: newTask.template?.name || newTask.data?.template?.name || 'Task',
      description: newTask.notes || newTask.data?.notes,
      status: 'pending',
      role: newTask.template?.type || newTask.data?.template?.type || 'Task',
      dueDate: newTask.dueDate || newTask.data?.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks({
      ...tasks,
      assigned: [formattedTask as any, ...tasks.assigned],
    });
  };

  if (loading) return <div className="text-center py-8">Loading tasks...</div>;
  if (error) return <div className="text-red-600 py-8">Error: {error}</div>;
  if (!tasks) return <div className="text-center py-8">No data</div>;

  const assignedCount = tasks.assigned.length;
  const activeCount = tasks.active.length;
  const completedCount = tasks.completed.length;

  const tasksByTab = {
    assigned: tasks.assigned,
    active: tasks.active,
    completed: tasks.completed,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
          <div className="text-sm text-blue-600">New Assignments</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{activeCount}</div>
          <div className="text-sm text-yellow-600">In Progress</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex border-b gap-0">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'assigned'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            New ({assignedCount})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            In Progress ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Done ({completedCount})
          </button>
        </div>

        <div className="mt-4">
          <div className="grid gap-4">
            {tasksByTab[activeTab].length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No {activeTab} tasks
              </p>
            ) : (
              tasksByTab[activeTab].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAction={handleTaskAction}
                  showActions={activeTab !== 'completed'}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
