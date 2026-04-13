import React, { useEffect, useState } from 'react';
import { Task } from '@/types/task-system';
import { TaskCard } from './TaskCard';

interface RefereeDashboardProps {
  refereeId: string;
}

type TabType = 'assigned' | 'active' | 'completed';

export function RefereeTaskDashboard({ refereeId }: RefereeDashboardProps) {
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
        const res = await fetch('/api/referee/dashboard');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        setTasks({
          assigned: data.tasks?.assigned || [],
          active: data.tasks?.active || [],
          completed: data.tasks?.completed || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [refereeId]);

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      const res = await fetch(`/api/referee/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error('Action failed');

      // Refetch tasks
      const dashRes = await fetch('/api/referee/dashboard');
      if (dashRes.ok) {
        const data = await dashRes.json();
        setTasks({
          assigned: data.tasks?.assigned || [],
          active: data.tasks?.active || [],
          completed: data.tasks?.completed || [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
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
          <div className="text-sm text-yellow-600">Active Tasks</div>
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
            Active ({activeCount})
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
