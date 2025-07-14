export interface TodoData {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
