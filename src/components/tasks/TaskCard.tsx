import React from 'react';
import { Task, TaskStatus } from '@/types/task-system';

interface TaskCardProps {
  task: Task;
  onAction?: (taskId: string, action: string) => void;
  showActions?: boolean;
}

const statusConfig = {
  [TaskStatus.ASSIGNED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-200',
    label: 'New Assignment',
  },
  [TaskStatus.ACCEPTED]: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200',
    label: 'Accepted',
  },
  [TaskStatus.IN_PROGRESS]: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    border: 'border-yellow-200',
    label: 'In Progress',
  },
  [TaskStatus.COMPLETED]: {
    bg: 'bg-green-50',
    text: 'text-green-900',
    border: 'border-green-200',
    label: 'Completed',
  },
  [TaskStatus.FAILED]: {
    bg: 'bg-red-50',
    text: 'text-red-900',
    border: 'border-red-200',
    label: 'Failed',
  },
  [TaskStatus.CANCELLED]: {
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    border: 'border-gray-200',
    label: 'Cancelled',
  },
};

export function TaskCard({ task, onAction, showActions = true }: TaskCardProps) {
  const daysLeft = task.dueDate
    ? Math.ceil(
        (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isDueSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

  const config = statusConfig[task.status as TaskStatus] || statusConfig[TaskStatus.ASSIGNED];

  return (
    <div className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${config.bg} ${config.border} border-2`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${config.text}`}>
            {task.template?.name || 'Task'}
          </h3>
          <p className={`text-sm ${config.text} opacity-75`}>
            {task.template?.description}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full font-semibold text-xs ${config.bg} ${config.text} ${config.border} border`}>
          {config.label}
        </span>
      </div>

      {/* Task Details Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div>
          <span className={`${config.text} opacity-70`}>Type:</span>
          <p className={`font-medium ${config.text}`}>{task.template?.type}</p>
        </div>
        {daysLeft !== null && (
          <div>
            <span className={`${config.text} opacity-70`}>Due:</span>
            <p
              className={`font-medium ${
                isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : config.text
              }`}
            >
              {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''}{' '}
              {isOverdue ? 'ago' : daysLeft === 0 ? 'today' : 'left'}
            </p>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {task.notes && (
        <div className={`mb-3 p-2 ${config.bg} rounded text-sm ${config.text} opacity-80 border ${config.border}`}>
          <strong>Notes:</strong> {task.notes}
        </div>
      )}

      {/* Context/Specifications Display */}
      {task.context && Object.keys(task.context).length > 0 && (
        <div className={`mb-3 p-2 ${config.bg} rounded text-xs border ${config.border}`}>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(task.context).map(([key, value]) => (
              <div key={key} className={config.text}>
                <span className="font-semibold opacity-75">{key}:</span> <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2 pt-2">
          {task.status === TaskStatus.ASSIGNED && (
            <>
              <button
                onClick={() => onAction?.(task.id, 'accept')}
                className="flex-1 py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
              >
                ✓ Accept
              </button>
              <button
                onClick={() => onAction?.(task.id, 'reject')}
                className="flex-1 py-2 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
              >
                ✕ Reject
              </button>
            </>
          )}

          {task.status === TaskStatus.ACCEPTED && (
            <button
              onClick={() => onAction?.(task.id, 'start')}
              className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Start Work
            </button>
          )}

          {task.status === TaskStatus.IN_PROGRESS && (
            <button
              onClick={() => onAction?.(task.id, 'submit')}
              className="w-full py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
            >
              Complete Task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
