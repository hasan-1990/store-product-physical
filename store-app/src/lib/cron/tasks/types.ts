export interface TaskResult {
  success: boolean;
  message: string;
  details?: any;
}

export type TaskHandler = (config: any) => Promise<TaskResult>;
