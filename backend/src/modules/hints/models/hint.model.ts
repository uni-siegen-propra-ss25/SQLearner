import { Role } from '@prisma/client';

export interface HintData {
  id: number;
  authorId: number;
  title: string;
  content: string;
  isActive: boolean;
  targetRole: Role | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    firstName: string;
    lastName: string;
    role: Role;
  };
}
