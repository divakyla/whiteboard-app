"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
// import { Whiteboard as WhiteboardTypeBase } from "@/types/database";
// import { LoginModal } from "@/components/login/LoginModal";
import { useSession } from "next-auth/react";
import { Building2, Search, Plus, Minus, GripVertical } from "lucide-react"; // Import icons
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DepartmentTree } from "@/components/departments/DepartmentsTree"; // Sesuaikan path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extended Whiteboard type with filter properties
interface WhiteboardWithFilter {
  owner?: Users;
  id: string;
  title: string;
  userId: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  sharedWith?: { userId: string }[];
  visibility?: "mine" | "team" | "public";
  collaborators?: number;
  createdAt?: string;
}

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

const WhiteboardPage = () => {
  console.log("HALAMAN MEMUAT"); // <-- Tambahkan ini
  const [boards, setBoards] = useState<WhiteboardWithFilter[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  // const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<Users[]>([]);
  const selectedUsers = selectedUserIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as Users[];

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<"mine" | "team" | "public">("mine");

  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  // const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boardVisibility, setBoardVisibility] = useState<
    "mine" | "team" | "public"
  >("mine");
  const { data: session } = useSession();
  const userId = session?.user?.id; // 🎯 Ini sudah tersedia!
  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (filter === "mine") {
      return board.visibility === "mine" && matchesSearch;
    } else if (filter === "team") {
      return (
        board.visibility === "team" &&
        board.sharedWith?.some((share) => share.userId === userId) &&
        matchesSearch
      );
    } else if (filter === "public") {
      return board.visibility === "public" && matchesSearch;
    }
    return false;
  });
  // --- STATE BARU UNTUK FUNGSI DEPARTEMEN & MODAL ---
  const [allDepartment, setDepartments] = useState<Departments[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const departmentFilteredUsers =
    selectedDepartment === "ALL"
      ? users
      : users.filter(
          (user) =>
            user.department ===
            allDepartment.find(
              (dept) => dept.department_id === selectedDepartment
            )?.department_name
        );
  const filteredUsers = departmentFilteredUsers.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // const [departments, setDepartments] = useState<Departments[]>([]);
  // const [modalSelectedDepartment, setModalSelectedDepartment] =
  //   useState<string>(""); // State untuk filter departemen di dalam modal
  // const [showDepartmentUsersModal, setShowDepartmentUsersModal] =
  //   useState<boolean>(false); // Mengontrol visibilitas modal
  // const [selectedDepartmentName, setSelectedDepartmentName] = useState<
  //   string | null
  // >(null); // Nama departemen yang diklik
  const [usersInClickedDepartment, setUsersInClickedDepartment] = useState<
    Users[]
  >([]); // User yang difilter dari departemen yang diklik
  const [currentBoardIdForMemberAdd, setCurrentBoardIdForMemberAdd] = useState<
    string | null
  >(null); // Menyimpan ID papan yang departemennya diklik
  // --- AKHIR STATE BARU ---

  console.log("PAGE RENDER: allUsers state:", users);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const userData = await fetchUser();
      setUsers(userData);
    };
    fetchData();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments", {
        // Asumsi Anda punya endpoint ini
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }
      const data = await response.json();
      // Sesuaikan jika API departemen Anda mengembalikan { result: [...] }
      return data.result || data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const userData = await fetchUser();
      setUsers(userData);
      const deptData = await fetchDepartments(); // Panggil ini
      setDepartments(deptData); // Set state departemen
    };
    fetchData();
  }, []);

  // ... setelah useEffect untuk fetchUser

  const handleDepartmentClick = useCallback(
    (departmentName: string, boardId: string) => {
      // setSelectedDepartmentName(departmentName);
      setCurrentBoardIdForMemberAdd(boardId);

      // Set filter departemen di modal ke departemen yang diklik
      setModalSelectedDepartment(departmentName); // <--- Tambahkan baris ini

      // Filter users for the initial display in the modal
      const filteredUsers = users.filter(
        (user) => user.department === departmentName
      );
      setUsersInClickedDepartment(filteredUsers); // Ini akan diabaikan karena kita akan filter 'users' langsung di render modal
      // tapi tetap biarkan untuk konsistensi atau jika ada logika lain yang bergantung padanya
      setShowDepartmentUsersModal(true);
    },
    [users]
  );

  const handleCloseDepartmentUsersModal = useCallback(() => {
    setShowDepartmentUsersModal(false);
    // setSelectedDepartmentName(null);
    setUsersInClickedDepartment([]);
    setCurrentBoardIdForMemberAdd(null);
    setModalSelectedDepartment(""); // <--- Tambahkan baris ini
  }, []);

  const handleSelectedUsersDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(selectedUserIds);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSelectedUserIds(reordered);
  };

  // --- FUNGSI BARU UNTUK MENAMBAHKAN ANGGOTA TIM ---
  const handleAddTeamMember = useCallback(
    async (userIdToAdd: string) => {
      if (!currentBoardIdForMemberAdd) {
        console.error("No board selected for adding members.");
        return;
      }

      try {
        const res = await fetch("/api/board-collaborators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: currentBoardIdForMemberAdd,
            userId: userIdToAdd,
            action: "add",
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to add team member");
        }

        const updatedBoard = await res.json();
        console.log("Member added successfully:", updatedBoard);

        // ✅ PERBAIKAN: Update local state dengan data yang konsisten
        setBoards((prevBoards) =>
          prevBoards.map((board) => {
            if (board.id === currentBoardIdForMemberAdd) {
              return {
                ...board,
                // Ambil langsung dari respons API
                collaborators: updatedBoard.board.collaborators,
                sharedWith: updatedBoard.board.sharedWith,
              };
            }
            return board;
          })
        );

        // Show success message
        const addedUser = usersInClickedDepartment.find(
          (u) => u.id === userIdToAdd
        );
        alert(
          `${addedUser?.username || "ユーザー"} がチームに追加されました！`
        );

        // Close modal
        handleCloseDepartmentUsersModal();
      } catch (error) {
        console.error("Error adding team member:", error);
        alert("メンバーの追加に失敗しました。");
      }
    },
    [
      currentBoardIdForMemberAdd,
      usersInClickedDepartment,
      handleCloseDepartmentUsersModal,
    ]
  );
  console.log("ini user", usersInClickedDepartment);
  // Tambahkan setBoards sebagai dependency
  // --- AKHIR FUNGSI BARU ---

  // ... useMemo dan useEffect lainnya

  // useEffect(() => {
  //   if (!session || !session.user?.id) return;

  //   const fetchBoards = async () => {
  //     try {
  //       const res = await fetch("/api/get-boards", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           currentUserId: session.user.id,
  //           // filter,
  //         }),
  //       });

  //       const data = await res.json();
  //       console.log("📥 Raw API Response:", data);
  //       console.log("👤 Current User ID:", session.user.id);

  //       if (Array.isArray(data)) {
  //         setBoards(data);
  //       } else {
  //         console.warn("📛 Response bukan array:", data);
  //         setBoards([]);
  //       }
  //     } catch (error) {
  //       console.error("Gagal fetch boards:", error);
  //     }
  //   };

  //   fetchBoards();
  // }, [session]);

  const fetchBoards = useCallback(async () => {
    if (!session || !session.user?.id) return;

    try {
      const res = await fetch("/api/get-boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: session.user.id,
        }),
      });

      const data = await res.json();
      console.log("📥 Raw API Response:", data);

      if (Array.isArray(data)) {
        setBoards(data);
      } else {
        console.warn("📛 Response bukan array:", data);
        setBoards([]);
      }
    } catch (error) {
      console.error("Gagal fetch boards:", error);
    }
  }, [session, setBoards]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = async () => {
    if (!newBoardTitle.trim()) return;
    if (!userId) return; // pastikan userId ada

    setIsCreating(true);
    try {
      const res = await fetch("/api/create-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBoardTitle,
          userId: userId,
          visibility: boardVisibility, // 👈 "mine" | "shared" | "public"
          sharedWith: boardVisibility === "team" ? selectedUserIds : [], // Tambahkan ini
        }),
      });
      const data = await res.json();
      if (data?.id) {
        // const newBoard = {
        //   ...data,
        //   isFavorite: false, // New boards start as not favorite
        //   // collaborators:
        //   //   boardVisibility === "team" ? selectedUserIds.length + 1 : 1,
        // };
        await fetchBoards();
        // setBoards((prev) => [newBoard, ...prev]);
        setNewBoardTitle("");
        setSelectedUserIds([]);
      }
    } catch (err) {
      console.error("Create failed", err);
    } finally {
      setIsCreating(false);
    }
  };

  const router = useRouter();

  const handleClickBoard = (boardId: string) => {
    if (!userId) return;
    router.push(`/whiteboard/${boardId}?user=${userId}`);
  };
  console.log("handleClickBoard");
  // const handleLogin = (userData: { username: string; email?: string }) => {
  //   setIsModalOpen(false);
  //   localStorage.setItem("canvas-user", JSON.stringify(userData));
  //   router.push(
  //     `/whiteboard/${selectedBoardId}?user=${encodeURIComponent(
  //       userData.username
  //     )}${userData.email ? `&email=${encodeURIComponent(userData.email)}` : ""}`
  //   );
  // };

  // const handleLogin = (userData: {
  //   id: string;
  //   username: string;
  //   email?: string;
  // }) => {
  //   setIsModalOpen(false);

  //   // ⬇️ Simpan juga user.id ke localStorage
  //   localStorage.setItem("canvas-user", JSON.stringify(userData));

  //   router.push(
  //     `/whiteboard/${selectedBoardId}?user=${encodeURIComponent(
  //       userData.username
  //     )}${userData.email ? `&email=${encodeURIComponent(userData.email)}` : ""}`
  //   );

  //   // ⬇️ Langsung set currentUser
  //   setCurrentUser(userData.id);
  // };

  const handleDeleteBoard = async (boardId: string) => {
    await fetch("/api/delete-board", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId }),
    });
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
  };

  const handleRenameBoard = async (boardId: string) => {
    if (!editedTitle.trim()) return;
    try {
      const res = await fetch("/api/rename-board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, title: editedTitle }),
      });
      const updated = await res.json();
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, title: updated.title } : b))
      );
      setEditingBoardId(null);
    } catch (err) {
      console.error("Rename failed", err);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = (boardId: string) => {
    setBoards((prev) =>
      prev.map((board) =>
        board.id === boardId
          ? { ...board, isFavorite: !board.isFavorite }
          : board
      )
    );
  };

  const filterCounts = useMemo(() => {
    if (!userId || boards.length === 0) {
      return { mine: 0, team: 0, public: 0 };
    }

    const counts = {
      mine: boards.filter(
        (board) => board.visibility === "mine" && board.userId === userId
      ).length,
      team: boards.filter(
        (board) =>
          board.visibility === "team" &&
          board.sharedWith?.some((share) => share.userId === userId)
      ).length,
      public: boards.filter((board) => board.visibility === "public").length,
    };

    console.log("📊 Updated Filter counts:", counts);
    return counts;
  }, [boards, userId]);

  const getCollaboratorsCount = (board: WhiteboardWithFilter): number => {
    if (board.collaborators !== undefined) return board.collaborators;
    return (board.sharedWith?.length || 0) + 1; // fallback lama
  };
  const addUser = useCallback(
    async (user: Users) => {
      if (!currentBoardIdForMemberAdd) {
        console.error("No board selected for adding members.");
        return;
      }

      try {
        const response = await fetch("/api/board-collaborators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: currentBoardIdForMemberAdd,
            userId: user.id,
            action: "add",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add team member");
        }

        const updatedBoard = await response.json();

        // Update the local boards state with the new collaborator
        setBoards((prevBoards) =>
          prevBoards.map((board) =>
            board.id === currentBoardIdForMemberAdd
              ? {
                  ...board,
                  collaborators: updatedBoard.board.collaborators,
                  sharedWith: updatedBoard.board.sharedWith,
                }
              : board
          )
        );

        // Show success message
        alert(`${user.username} がチームに追加されました！`);
      } catch (error) {
        console.error("Error adding team member:", error);
        alert("メンバーの追加に失敗しました。");
      }
    },
    [currentBoardIdForMemberAdd, setBoards]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile & Tablet Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle (all screens) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:scale-105 transition-transform duration-200"
      >
        <span className="text-lg text-gray-600">{sidebarOpen ? "←" : "☰"}</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 shadow-lg overflow-hidden transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64 sm:w-72 md:w-80 lg:w-80" : "w-0"}`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {sidebarOpen && (
              <>
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 lg:text-2xl whitespace-nowrap">
                    フィルター
                  </h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto lg:w-16" />
                </div>
                {/* Filter Buttons */}
                <div className="space-y-2 lg:space-y-3">
                  {[
                    {
                      key: "mine",
                      icon: "👤",
                      label: "自分のボード",
                      description: "あなたが作成したボード",
                    },
                    {
                      key: "team",
                      icon: "🔒",
                      label: "チームボード",
                      description: "他の人があなたと共有したボード",
                    },
                    {
                      key: "public",
                      icon: "🌐",
                      label: "共有ボード",
                      description: "誰でもアクセスできるボード",
                    },
                  ].map(({ key, icon, label, description }) => {
                    const count =
                      filterCounts[key as keyof typeof filterCounts];
                    return (
                      <button
                        key={key}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm lg:gap-4 lg:px-5 lg:py-4 lg:rounded-xl lg:text-base ${
                          filter === key
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                        }`}
                        onClick={() => setFilter(key as typeof filter)}
                        title={description}
                      >
                        <span className="text-lg lg:text-xl flex-shrink-0">
                          {icon}
                        </span>
                        <span className="flex-1 text-left truncate min-w-0">
                          {label}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full flex-shrink-0 lg:text-sm ${
                            filter === key
                              ? "bg-white/20 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  {/* </div> */}
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 text-center">
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm lg:text-base">
                    統計
                  </h3>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent lg:text-3xl">
                    {filteredBoards.length}
                  </div>
                  <p className="text-xs text-gray-600 lg:text-sm">ボード数</p>
                </div>

                {/* Current Filter Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2 text-sm lg:text-base">
                    現在のフィルター
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-base lg:text-lg flex-shrink-0">
                      {filter === "mine"
                        ? "👤"
                        : filter === "team"
                        ? "🔒"
                        : "🌐"}
                    </span>
                    <span className="text-xs text-gray-600 lg:text-sm truncate min-w-0">
                      {filter === "mine"
                        ? "自分のボード"
                        : filter === "team"
                        ? "チームボード"
                        : "共有ボード"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8
          ${sidebarOpen ? "lg:ml-80" : "lg:ml-0"}`}
      >
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12 mt-12 sm:mt-8 lg:mt-0">
          <h1 className="text-2xl md:text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-2 lg:mb-4">
            <span className="whitespace-nowrap">📋 ボード一覧</span>
          </h1>
          <p className="text-gray-600 text-sm md:text-lg lg:text-xl font-medium">
            <span className="whitespace-nowrap">
              ✨ あなたのクリエイティブスペース ✨
            </span>
          </p>
        </div>

        {/* Search and Create Section */}
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-12 lg:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 lg:p-12">
            <div className="space-y-10">
              {/* Search */}
              <div className="space-y-6 md:grid md:grid-cols-2 md:gap-10 md:space-y-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    🔍 ボード検索
                  </label>
                  <div className="relative">
                    <input
                      placeholder="ボード名を入力..."
                      className="w-full h-14 border border-gray-300 rounded-xl px-5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-3 top-3 text-gray-400">
                      🔍
                    </div>
                  </div>
                </div>
              </div>

              {/* Create New Board */}
              <div className="border-t border-gray-200 pt-10 mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  ✨ 新しいボードを作成
                </h3>

                <div className="space-y-4">
                  {/* Title and Visibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ボードタイトル
                      </label>
                      <input
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") createBoard();
                        }}
                        placeholder="ボードタイトルを入力"
                        className="w-full h-14 border border-gray-300 rounded-xl px-5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ボードの種類
                      </label>
                      <div className="relative">
                        <select
                          value={boardVisibility}
                          onChange={(e) =>
                            setBoardVisibility(
                              e.target.value as "mine" | "team" | "public"
                            )
                          }
                          className="w-full h-14 border border-gray-300 rounded-xl px-5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none appearance-none bg-white"
                        >
                          <option value="mine">👤 自分のボード</option>
                          <option value="team">🔒 チームボード</option>
                          <option value="public">🌐 共有ボード</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>{" "}
                  {/* Team Member Selection for Team Boards */}
                  {boardVisibility === "team" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-8 mt-6 border-t border-gray-200">
                      {/* Left Side - User Selection */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Department Select */}
                          <div className="flex-1">
                            <Label className="block text-sm font-medium text-gray-700 mb-3">
                              部署選択
                            </Label>
                            <Select
                              value={selectedDepartment}
                              onValueChange={setSelectedDepartment}
                            >
                              <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="部署を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">全ての部署</SelectItem>
                                {allDepartment.map((dept) => (
                                  <SelectItem
                                    key={dept.department_id ?? ""}
                                    value={dept.department_id ?? ""}
                                  >
                                    {dept.department_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Search Input */}
                          <div className="flex-1">
                            <Label className="block text-sm font-medium text-gray-700 mb-3">
                              ユーザー検索
                            </Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="search"
                                placeholder="ユーザー名を検索..."
                                className="pl-10 h-10 w-full"
                                value={searchTerm}
                                onChange={handleSearchChange}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">
                            ユーザー一覧
                          </Label>
                          <div className="border rounded-lg overflow-hidden bg-white">
                            <div className="bg-green-50 border-b border-green-200">
                              <div className="grid grid-cols-12 gap-2 p-3 font-semibold text-sm text-green-800">
                                <div className="col-span-1 text-center">
                                  追加
                                </div>
                                <div className="col-span-7">ユーザー名</div>
                                <div className="col-span-4">役職</div>
                              </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {filteredUsers && filteredUsers.length === 0 ? (
                                <div className="text-sm text-gray-500 px-4 py-8 text-center">
                                  <div className="text-gray-400 text-2xl mb-2">
                                    👥
                                  </div>
                                  この部署にはユーザーはいません。
                                </div>
                              ) : (
                                filteredUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className="grid grid-cols-12 gap-2 p-3 border-b border-gray-100 hover:bg-gray-50 items-center transition-colors duration-150"
                                  >
                                    <div className="col-span-1 flex justify-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                                        onClick={() => {
                                          if (
                                            !selectedUserIds.includes(user.id)
                                          ) {
                                            setSelectedUserIds((prev) => [
                                              ...prev,
                                              user.id,
                                            ]);
                                          }
                                        }}
                                        disabled={selectedUserIds.includes(
                                          user.id
                                        )}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="col-span-7">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.username}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {user.department}
                                      </div>
                                    </div>
                                    <div className="col-span-4 text-sm text-gray-600 truncate">
                                      {user.position}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Selected Users */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          選択されたメンバー
                          <span className="ml-2 text-xs text-gray-500">
                            (ドラッグで順序変更可能)
                          </span>
                        </Label>
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <div className="bg-blue-50 border-b border-blue-200">
                            <div className="grid grid-cols-12 gap-2 p-3 font-semibold text-sm text-blue-800">
                              <div className="col-span-1 text-center">順序</div>
                              <div className="col-span-1"></div>
                              <div className="col-span-6">ユーザー名</div>
                              <div className="col-span-3">役職</div>
                              <div className="col-span-1 text-center">削除</div>
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {selectedUsers.length === 0 ? (
                              <div className="p-8 text-center text-gray-500">
                                <div className="text-gray-400 text-3xl mb-3">
                                  👥
                                </div>
                                <div className="text-sm">
                                  ユーザーが選択されていません
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  左側からユーザーを追加してください
                                </div>
                              </div>
                            ) : (
                              <DragDropContext
                                onDragEnd={handleSelectedUsersDragEnd}
                              >
                                <Droppable droppableId="selected-users">
                                  {(provided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                    >
                                      {selectedUsers.map((user, index) => (
                                        <Draggable
                                          key={user.id}
                                          draggableId={user.id}
                                          index={index}
                                        >
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`grid grid-cols-12 gap-2 p-3 border-b border-gray-100 items-center transition-all duration-200 ${
                                                snapshot.isDragging
                                                  ? "bg-blue-50 shadow-lg border-blue-200 rounded-md"
                                                  : "hover:bg-gray-50"
                                              }`}
                                            >
                                              <div className="col-span-1 flex justify-center">
                                                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                  {index + 1}
                                                </div>
                                              </div>
                                              <div className="col-span-1 flex justify-center">
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="cursor-move p-1 hover:bg-gray-200 rounded transition-colors duration-150"
                                                >
                                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                                </div>
                                              </div>
                                              <div className="col-span-6">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {user.username}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  {user.department}
                                                </div>
                                              </div>
                                              <div className="col-span-3 text-sm text-gray-600 truncate">
                                                {user.position}
                                              </div>
                                              <div className="col-span-1 flex justify-center">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                                  onClick={() =>
                                                    setSelectedUserIds((prev) =>
                                                      prev.filter(
                                                        (id) => id !== user.id
                                                      )
                                                    )
                                                  }
                                                >
                                                  <Minus className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                            )}
                          </div>
                        </div>
                        {selectedUsers.length > 0 && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                            💡 ヒント: メンバーをドラッグして順序を変更できます
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Create Button */}
                  <div className="flex justify-end pt-8 mt-8 border-t border-gray-200">
                    <button
                      onClick={createBoard}
                      disabled={!newBoardTitle.trim() || isCreating}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] min-w-[140px]"
                    >
                      {isCreating ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          作成中...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" />
                          ボードを作成
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Boards Grid */}
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mt-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
              {filteredBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => handleClickBoard(board.id)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-200 cursor-pointer group transition-all duration-300 hover:-translate-y-1 relative p-6 h-[160px]"
                >
                  {/* Favorite Star Badge */}
                  {board.isFavorite && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white">
                        <span className="text-xs">⭐</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoardId(board.id);
                        setEditedTitle(board.title);
                      }}
                      title="名前を変更"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 text-xs hover:scale-110"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(board.id);
                      }}
                      title={
                        board.isFavorite
                          ? "お気に入りから削除"
                          : "お気に入りに追加"
                      }
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 text-xs ${
                        board.isFavorite
                          ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                          : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:scale-110"
                      }`}
                    >
                      {board.isFavorite ? "⭐" : "☆"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBoard(board.id);
                      }}
                      title="削除"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 text-xs hover:scale-110"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Main Content */}
                  <div className="flex items-start gap-4 h-full">
                    {/* Left - Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-white border-2 border-gray-200 shadow-lg overflow-hidden relative">
                        {/* Mini canvas preview */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
                          {/* Simulated content elements */}
                          <div className="absolute top-1 left-1 w-3 h-2 bg-blue-400 rounded-sm opacity-80"></div>
                          <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full opacity-70"></div>
                          <div className="absolute bottom-2 left-1 w-4 h-1 bg-purple-300 rounded-full opacity-60"></div>
                          <div className="absolute bottom-1 right-1 w-2 h-1 bg-orange-300 rounded-sm opacity-50"></div>
                          <div className="absolute top-3 left-2 w-1 h-3 bg-pink-300 rounded-sm opacity-40"></div>
                          {/* Grid pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <svg width="100%" height="100%" viewBox="0 0 56 56">
                              <defs>
                                <pattern
                                  id="grid"
                                  width="8"
                                  height="8"
                                  patternUnits="userSpaceOnUse"
                                >
                                  <path
                                    d="M 8 0 L 0 0 0 8"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                  />
                                </pattern>
                              </defs>
                              <rect
                                width="100%"
                                height="100%"
                                fill="url(#grid)"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right - Content */}
                    <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
                      {/* Top Section - Title */}
                      <div className="mb-3">
                        {editingBoardId === board.id ? (
                          <div className="space-y-2">
                            <input
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleRenameBoard(board.id);
                              }}
                              className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-lg font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRenameBoard(board.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingBoardId(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 leading-tight pr-16">
                            {board.title}
                          </h3>
                        )}
                      </div>

                      {/* Bottom Section */}
                      <div className="space-y-3">
                        {/* Board Type Badge */}
                        <div className="flex justify-start">
                          {board.visibility === "mine" ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <span className="mr-1">👤</span>
                              自分
                            </span>
                          ) : board.visibility === "public" ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <span className="mr-1">🌐</span>
                              公開
                            </span>
                          ) : board.visibility === "team" ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <span className="mr-1">🔒</span>
                              チーム
                            </span>
                          ) : null}
                        </div>

                        {/* Footer - Avatars and Date */}
                        <div className="flex justify-between items-center">
                          {/* Left - Team Members */}
                          <div className="flex items-center">
                            {board.visibility === "team" &&
                            board.sharedWith &&
                            board.sharedWith.length > 0 ? (
                              <div className="flex -space-x-2">
                                {/* Owner Avatar */}
                                <div
                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm z-10"
                                  title={board.owner?.username || "Owner"}
                                >
                                  {(board.owner?.username || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                {/* Collaborators */}
                                {board.sharedWith
                                  .slice(0, 4)
                                  .map((member, index) => {
                                    const user = users.find(
                                      (u) => u.id === member.userId
                                    );
                                    const initial = (user?.username || "U")
                                      .charAt(0)
                                      .toUpperCase();
                                    const colors = [
                                      "from-emerald-500 to-teal-600",
                                      "from-orange-500 to-red-600",
                                      "from-pink-500 to-purple-600",
                                      "from-indigo-500 to-blue-600",
                                    ];

                                    return (
                                      <div
                                        key={member.userId}
                                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                                          colors[index % colors.length]
                                        } flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm`}
                                        style={{ zIndex: 9 - index }}
                                        title={user?.username || "Member"}
                                      >
                                        {initial}
                                      </div>
                                    );
                                  })}

                                {/* +N indicator */}
                                {board.sharedWith.length > 4 && (
                                  <div
                                    className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm"
                                    title={`+${
                                      board.sharedWith.length - 4
                                    } more`}
                                  >
                                    +{board.sharedWith.length - 4}
                                  </div>
                                )}
                              </div>
                            ) : board.visibility === "mine" ? (
                              <div
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                title={board.owner?.username || "Owner"}
                              >
                                {(board.owner?.username || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                🌐
                              </div>
                            )}
                          </div>

                          {/* Right - Date */}
                          <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-blue-500 text-xs">📅</span>
                            <span className="text-xs font-medium">
                              {new Date(
                                board.createdAt || ""
                              ).toLocaleDateString("ja-JP", {
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredBoards.length === 0 && (
            <div className="text-center mt-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-gray-400">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === "mine"
                  ? "自分のボードが見つかりません"
                  : filter === "team"
                  ? "共有されたボードが見つかりません"
                  : "公開ボードが見つかりません"}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "検索条件を変更してください"
                  : "新しいボードを作成してください"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhiteboardPage;
