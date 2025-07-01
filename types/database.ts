// types/database.ts
export type Whiteboard = {
  collaborators: number;
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isLocked?: boolean;
  isPublic?: boolean;
  sharedWith?: string[];
};
