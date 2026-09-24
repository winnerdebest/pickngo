/**
 * PickNGo Type Definitions
 * Exact mapping of FastAPI backend models & schemas
 */

export type UserRole = 'customer' | 'runner';

export type TaskType = 'SUPERMARKET_RUN' | 'PICKUP';

export type TaskStatus =
  | 'PENDING'
  | 'FUNDED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type TrustTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type PaymentStatus = 'UNPAID' | 'ESCROW_LOCKED' | 'RELEASED' | 'REFUNDED';

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerCreate {
  full_name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface Runner {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  bike_plate_number: string;
  trust_tier: TrustTier;
  trust_score: number;
  completed_tasks_count: number;
  total_ratings_count: number;
  is_active: boolean;
  created_at: string;
}

export interface RunnerCreate {
  full_name: string;
  email: string;
  phone: string;
  bike_plate_number: string;
  password?: string;
}

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  customer_id: string;
  runner_id?: string | null;
  description: string;
  pickup_address: string;
  delivery_address: string;
  estimated_goods_cost: number;
  service_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  customer_rating?: number | null;
  customer_review?: string | null;
  dispute_reason?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | null;
  runner?: Runner | null;
}

export interface TaskCreatePayload {
  type: TaskType;
  customer_id: string;
  description: string;
  pickup_address: string;
  delivery_address: string;
  estimated_goods_cost: number;
  service_fee: number;
}

export interface TaskFundPayload {
  payment_reference?: string;
}

export interface TaskAcceptPayload {
  runner_id: string;
}

export interface TaskStatusUpdatePayload {
  status: TaskStatus;
}

export interface TaskRatePayload {
  customer_rating: number;
  customer_review?: string;
}

export interface TaskDisputePayload {
  dispute_reason: string;
}

export interface TaskCancelPayload {
  reason?: string;
}

export interface AuthSession {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  bike_plate_number?: string;
  trust_tier?: TrustTier;
  trust_score?: number;
  completed_tasks_count?: number;
}

export interface WebSocketMessage {
  type: 'task_update' | 'new_task_available' | 'ping' | 'pong';
  task?: Task;
  message?: string;
}
