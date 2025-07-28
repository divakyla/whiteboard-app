"use client";

import type React from "react";
import { useState } from "react";
import { ChevronRight, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Users } from "@/types/database";

// interface Users {
//   id: string;
//   username: string;
//   email: string;
//   email2: string;
//   password: string;
//   confirmPassword: string;
//   fullName: string;
//   fullNameKana: string;
//   employeeId: string;
//   department: string;
//   position: string;
//   employmentType: string;
//   role: string;
//   phone: string;
//   phone2: string;
//   remark: string;
//   profilePic: string;
//   tags: string[];
//   updatedAt: string;
// }
interface Department {
  id: string;
  name: string;
  is_active: boolean;
  rank: number;
  children?: Department[];
  members?: { id: string; name: string }[];
}
interface childDept {
  department_id?: string;
  department_code: string;
  department_name: string;
  parent_department_id?: string | null;
  manager_id?: string | null;
  is_active: boolean;
  rank: number;
  users?: Users[];
}
interface Departments {
  department_id?: string;
  department_code: string;
  department_name: string;
  parent_department_id?: string | null;
  manager_id?: string | null;
  is_active: boolean;
  rank: number;
  //children?: childDept[];
  children_departments?: childDept[];
  users?: Users[];
}

interface DepartmentTreeProps {
  // departments: Department[]
  departments: Departments[];
  users: Users[];
  onSelectUser: (userId: string) => void;
  selectedUserIds: string[];
}
const buildDepartmentTree = (departments: Departments[], users: Users[]) => {
  const departmentMap: { [key: string]: Departments } = {};

  // Create a map with all departments
  departments.forEach((dept) => {
    if (dept.department_id) {
      departmentMap[dept.department_id] = {
        ...dept,
        children_departments: [],
        users: [],
      };
    }
  });

  // Assign departments as children to their parents
  departments.forEach((dept) => {
    if (dept.parent_department_id) {
      const parent = departmentMap[dept.parent_department_id];
      if (parent) {
        parent.children_departments?.push(departmentMap[dept.department_id!]);
      }
    }
  });
  users.forEach((user) => {
    const department = Object.values(departmentMap).find(
      (dept) => dept.department_name.trim() === user.department.trim()
    );
    if (department) {
      department.users?.push(user);
    }
  });

  // Return only root departments (those without a parent)
  return Object.values(departmentMap).filter(
    (dept) => !dept.parent_department_id
  );
};
const DepartmentNode: React.FC<{
  department: Departments;
  onSelectUser: (userId: string) => void;
  selectedUserIds: string[]; // <-- Tambahkan prop ini
}> = ({ department, onSelectUser, selectedUserIds }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="ml-3.5">
      {/* Department Name & Expand Button */}
      <div
        className="flex items-center cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {department.children_departments &&
          department.children_departments.length > 0 && (
            <Button variant="ghost" size="icon" className="h-4 w-4">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        <span className="ml-1 font-semibold">{department.department_name}</span>
      </div>

      {/* Users in this department */}
      {isExpanded &&
        department.users &&
        department.users.length > 0 && ( // <-- Hanya tampilkan jika diperluas
          <div className="ml-4 border-l border-gray-200 pl-2 py-1">
            {" "}
            {/* Tambahkan styling untuk indentasi */}
            {department.users.map((user) => (
              <label // Menggunakan label untuk checkbox
                key={user.id}
                className="flex items-center gap-2 p-1 cursor-pointer hover:bg-blue-50 rounded text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)} // <-- Gunakan prop selectedUserIds
                  onChange={() => onSelectUser(user.id)} // <-- Panggil onSelectUser saat checkbox berubah
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  {user.fullName || user.username}
                </span>
                {user.position && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-auto">
                    {user.position}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

      {/* Recursive Child Departments */}
      {isExpanded &&
        department.children_departments &&
        department.children_departments.map((child) => (
          <DepartmentNode
            key={child.department_id}
            department={child}
            onSelectUser={onSelectUser}
            selectedUserIds={selectedUserIds} // <-- Teruskan prop ini
          />
        ))}
    </div>
  );
};

export const DepartmentTree: React.FC<DepartmentTreeProps> = ({
  departments,
  users,
  onSelectUser,
  selectedUserIds, // <-- Tambahkan prop ini di DepartmentTree
}) => {
  const rootDepartments = buildDepartmentTree(departments, users);

  return (
    <div className="p-1">
      {rootDepartments.map((department) => (
        <DepartmentNode
          key={department.department_id}
          department={department}
          onSelectUser={onSelectUser}
          selectedUserIds={selectedUserIds} // <-- Teruskan prop ini ke DepartmentNode
        />
      ))}
    </div>
  );
};
