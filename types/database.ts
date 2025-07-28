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

export interface Users {
  id: string;
  username: string;
  email: string;
  email2: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  fullNameKana: string;
  employeeId: string;
  department: string;
  position: string;
  employmentType: string;
  role: string;
  phone: string;
  phone2: string;
  remark: string;
  profilePic: string;
  tags: string[];
  updatedAt: string;
}
