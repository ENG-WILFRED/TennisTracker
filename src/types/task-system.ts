/**
 * Typed Task System - Role-aware Workflow Engine
 * 
 * Supports:
 * - REFEREE: Event-driven tasks (tournament control, match officiation)
 * - COACH: Form-driven tasks (training plans, player evaluations)
 */

// ────────────────────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────────────────────

export enum TaskRole {
  REFEREE = "REFEREE",
  COACH = "COACH",
  ADMIN = "ADMIN",
}

export enum TaskType {
  // Referee tasks
  TOURNAMENT_CONTROL = "TOURNAMENT_CONTROL",
  MATCH_OFFICIATION = "MATCH_OFFICIATION",
  SUBMIT_MATCH_REPORT = "SUBMIT_MATCH_REPORT",
  
  // Coach tasks
  TRAINING_PLAN = "TRAINING_PLAN",
  PLAYER_EVALUATION = "PLAYER_EVALUATION",
  SESSION_REPORT = "SESSION_REPORT",
  PREPARE_ATHLETES = "PREPARE_ATHLETES",
}

export enum TaskStatus {
  ASSIGNED = "ASSIGNED",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum TaskSubmissionStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NEEDS_REVISION = "NEEDS_REVISION",
}

export enum FormFieldType {
  TEXT = "text",
  TEXTAREA = "textarea",
  NUMBER = "number",
  DATE = "date",
  SELECT = "select",
  CHECKBOX = "checkbox",
  FILE = "file",
  EMAIL = "email",
  PHONE = "phone",
}

// ────────────────────────────────────────────────────────────────────────────
// Form Schema Types
// ────────────────────────────────────────────────────────────────────────────

export interface FormFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface FormFieldOption {
  label: string;
  value: string | number;
}

export interface CreateFormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  position?: number;
}

export interface FormField extends CreateFormField {
  id: string;
  sectionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormSection {
  title: string;
  description?: string;
  fields: CreateFormField[];
  position?: number;
}

export interface FormSection extends Omit<CreateFormSection, 'fields'> {
  id: string;
  templateId: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// Task Template Types
// ────────────────────────────────────────────────────────────────────────────

export interface SuccessCriteria {
  description: string;
  requirements?: Record<string, any>;
}

export interface CreateTaskTemplate {
  name: string;
  description?: string;
  role: TaskRole;
  type: TaskType;
  isFormBased: boolean;
  contextFields: string[];
  instructions?: string;
  estimatedHours?: number;
  successCriteria?: SuccessCriteria;
  sections?: CreateFormSection[]; // For form-based tasks
}

export interface TaskTemplate extends Omit<CreateTaskTemplate, 'sections'> {
  id: string;
  organizationId: string;
  sections?: FormSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// Task Instance Types
// ────────────────────────────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  status: TaskStatus;
  timestamp: Date;
  changedBy?: string;
  notes?: string;
}

export interface AssignTaskPayload {
  templateId: string;
  assignedToId: string; // Staff user ID
  context: Record<string, any>;
  dueDate?: Date;
  notes?: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  notes?: string;
  rejectionReason?: string;
}

export interface Task {
  id: string;
  templateId: string;
  organizationId: string;
  assignedToId: string;
  assignedById: string;
  status: TaskStatus;
  statusHistory: StatusHistoryEntry[];
  context: Record<string, any>;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  template?: TaskTemplate;
  submissions?: TaskSubmission[];
}

// ────────────────────────────────────────────────────────────────────────────
// Task Submission Types
// ────────────────────────────────────────────────────────────────────────────

export interface SubmitTaskPayload {
  formData: Record<string, any>;
  attachments?: string[]; // File URLs
}

export interface ReviewSubmissionPayload {
  reviewStatus: TaskSubmissionStatus;
  reviewNotes?: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  submittedByUserId: string;
  formData: Record<string, any>;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfGeneratedAt?: Date;
  reviewStatus: TaskSubmissionStatus;
  reviewedByUserId?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  submittedAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// Task History Types
// ────────────────────────────────────────────────────────────────────────────

export enum TaskAction {
  ASSIGNED = "ASSIGNED",
  ACCEPTED = "ACCEPTED",
  STARTED = "STARTED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  SUBMITTED = "SUBMITTED",
  REVIEWED = "REVIEWED",
}

export interface TaskHistory {
  id: string;
  taskId: string;
  status: TaskStatus;
  action: TaskAction;
  changedByUserId: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard Types
// ────────────────────────────────────────────────────────────────────────────

export interface TaskDashboardData {
  assignedTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  failedTasks: Task[];
  pendingSubmissions: TaskSubmission[];
}

export interface TaskStatistics {
  totalAssigned: number;
  totalAccepted: number;
  totalCompleted: number;
  totalFailed: number;
  completionRate: number;
  averageCompletionTime?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// API Response Types
// ────────────────────────────────────────────────────────────────────────────

export interface TaskTemplateResponse {
  success: boolean;
  data?: TaskTemplate;
  error?: string;
}

export interface TaskResponse {
  success: boolean;
  data?: Task;
  error?: string;
}

export interface TaskListResponse {
  success: boolean;
  data?: Task[];
  error?: string;
}

export interface TaskSubmissionResponse {
  success: boolean;
  data?: TaskSubmission;
  error?: string;
}

export interface TaskActionResponse {
  success: boolean;
  message: string;
  data?: Task | TaskSubmission;
  error?: string;
}
