"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { Whiteboard as WhiteboardTypeBase } from "@/types/database";
// import { LoginModal } from "@/components/login/LoginModal";
import { useSession } from "next-auth/react";

// Extended Whiteboard type with filter properties
interface WhiteboardWithFilter {
  owner?: string;
  id: string;
  title: string;
  userId: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  sharedWith?: { userId: string }[];
  visibility?: "mine" | "shared" | "public";
  collaborators?: number;
  createdAt?: string;
}

type User = {
  id: string;
  username: string;
  email: string;
};

const WhiteboardPage = () => {
  const [boards, setBoards] = useState<WhiteboardWithFilter[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<"mine" | "shared" | "public">("mine");

  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  // const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boardVisibility, setBoardVisibility] = useState<
    "mine" | "shared" | "public"
  >("mine");
  const { data: session } = useSession();
  const userId = session?.user?.id; // 🎯 Ini sudah tersedia!
  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return board.visibility === filter && matchesSearch;
  });

  // useEffect(() => {
  //   // Get current user from localStorage or set a default
  //   const userData = localStorage.getItem("canvas-user");
  //   if (userData) {
  //     const user = JSON.parse(userData);
  //     setCurrentUser(user.username || user.email);
  //   } else {
  //     // Set a default user for demo purposes
  //     setCurrentUser("current_user");
  //   }
  // }, []);

  useEffect(() => {
    // Dummy users
    const dummyUsers = [
      { id: "user-1", username: "Alice", email: "alice@example.com" },
      { id: "user-2", username: "Bob", email: "bob@example.com" },
      { id: "user-3", username: "Charlie", email: "charlie@example.com" },
    ];

    setAllUsers(dummyUsers);
  }, []);

  useEffect(() => {
    if (!session || !session.user?.id) return;

    const fetchBoards = async () => {
      try {
        const res = await fetch("/api/get-boards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentUserId: session.user.id,
            filter,
          }),
        });

        const data = await res.json();
        console.log("📥 Raw API Response:", data);
        console.log("👤 Current User ID:", session.user.id);

        if (Array.isArray(data)) {
          setBoards(data);
        } else {
          console.warn("📛 Response bukan array:", data);
          setBoards([]);
        }
      } catch (error) {
        console.error("Gagal fetch boards:", error);
      }
    };

    fetchBoards();
  }, [session, filter]);

  // useEffect(() => {
  //   const userData = localStorage.getItem("canvas-user");
  //   if (userData) {
  //     const user = JSON.parse(userData);
  //     setCurrentUser(user.id); // ✅ ambil user.id dari database
  //   } else {
  //     setCurrentUser("current_user"); // fallback
  //   }
  // }, []);

  // useEffect(() => {
  //   const fetchBoards = async () => {
  //     if (!currentUser) return;

  //     try {
  //       const res = await fetch("/api/get-boards", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           filter,
  //           currentUserId: currentUser, // asumsi currentUser adalah user.id dari RDS
  //         }),
  //       });

  //       const data = await res.json();
  //       setBoards(data);
  //     } catch (error) {
  //       console.error("Gagal fetch boards:", error);
  //     }
  //   };

  //   fetchBoards();
  // }, [filter, currentUser]);

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
          sharedWith: boardVisibility === "shared" ? selectedUserIds : [], // Tambahkan ini
        }),
      });
      const data = await res.json();
      if (data?.id) {
        const newBoard = {
          ...data,
          isFavorite: false, // New boards start as not favorite
        };
        setBoards((prev) => [newBoard, ...prev]);
        setNewBoardTitle("");
        setSelectedUserIds([]); // Tambahkan ini
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

  // Enhanced filtering logic
  // const getFilteredBoards = () => {
  //   if (searchTerm) {
  //     return boards.filter((board) =>
  //       board.title.toLowerCase().includes(searchTerm.toLowerCase())
  //     );
  //   }
  //   return boards;
  // };

  // const filteredBoards = getFilteredBoards();

  // const getFilterCounts = () => {
  //   return {
  //     mine: 0,
  //     shared: 0,
  //     public: 0,
  //   };
  // };

  // const filterCounts = getFilterCounts();

  const getFilterCounts = () => {
    if (!userId || boards.length === 0) {
      return { mine: 0, shared: 0, public: 0 };
    }

    const counts = {
      mine: boards.filter(
        (board) => board.visibility === "mine" && board.userId === userId
      ).length,
      shared: boards.filter(
        (board) =>
          board.visibility === "shared" &&
          board.sharedWith?.some((share) => share.userId === userId)
      ).length,
      public: boards.filter((board) => board.visibility === "public").length,
    };

    console.log("📊 Updated Filter counts:", counts);
    return counts;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 lg:top-6 lg:left-6 lg:rounded-full lg:p-3"
      >
        <span className="text-base font-medium text-gray-600 lg:text-lg">
          {sidebarOpen ? "←" : "☰"}
        </span>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-80" : "w-0"
        } bg-white border-r border-gray-200 shadow-xl overflow-hidden lg:shadow-none`}
      >
        <div className="p-4 space-y-6 lg:p-8 lg:space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2 lg:text-2xl whitespace-nowrap">
              フィルター
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto lg:w-16"></div>
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
                key: "shared",
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
              const filterCounts = getFilterCounts();
              const count = filterCounts[key as keyof typeof filterCounts];
              return (
                <button
                  key={key}
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-sm lg:gap-3 lg:px-4 lg:py-4 lg:rounded-xl lg:text-base ${
                    filter === key
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                  }`}
                  onClick={() => setFilter(key as typeof filter)}
                  title={description}
                >
                  <span className="text-lg lg:text-xl">{icon}</span>
                  <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">
                    {label}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap lg:text-sm ${
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
          </div>
          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 text-center lg:rounded-xl lg:p-6">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm lg:text-base whitespace-nowrap">
              統計
            </h3>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent lg:text-3xl">
              {filteredBoards.length}
            </div>
            <p className="text-xs text-gray-600 lg:text-sm whitespace-nowrap">
              ボード数
            </p>
          </div>

          {/* Current Filter Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 lg:rounded-xl lg:p-4">
            <h4 className="font-medium text-gray-700 mb-2 text-sm lg:text-base whitespace-nowrap">
              現在のフィルター
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-base lg:text-lg">
                {filter === "mine" ? "👤" : filter === "shared" ? "🔒" : "🌐"}
              </span>
              <span className="text-xs text-gray-600 lg:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {filter === "mine"
                  ? "自分のボード"
                  : filter === "shared"
                  ? "プライベートボード"
                  : "共有ボード"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 ml-0">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12 mt-16 lg:mt-0">
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
        <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 mb-8 lg:mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-8 lg:rounded-2xl">
            <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-end">
              {/* Search */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-3 whitespace-nowrap">
                  🔍 ボードを検索
                </label>
                <div className="relative">
                  <input
                    placeholder="ボード名を入力して検索..."
                    className="w-full h-12 border border-gray-300 rounded-lg px-4 pr-10 text-sm lg:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-3 top-3 text-gray-400">🔍</div>
                </div>
              </div>

              {/* Create New Board */}
              <div className="lg:col-span-2 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-3 whitespace-nowrap">
                  ✨ 新しいボード
                </label>

                {/* Label atas */}
                <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 mb-2">
                  <div className="text-sm font-medium text-gray-600">
                    📝 ボードタイトル
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    📂 ボードの種類を選択
                  </div>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-6 lg:items-end w-full">
                  {/* Input Title */}
                  <div className="lg:col-span-1">
                    <input
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createBoard();
                      }}
                      placeholder="ボードタイトルを入力"
                      className="w-full h-12 border border-gray-300 rounded-lg px-4 text-sm lg:text-base bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition duration-200"
                    />
                  </div>

                  {/* Select Visibility */}
                  <div className="lg:col-span-1 relative">
                    <select
                      value={boardVisibility}
                      onChange={(e) =>
                        setBoardVisibility(
                          e.target.value as "mine" | "shared" | "public"
                        )
                      }
                      className="w-full h-12 border border-gray-300 rounded-lg px-4 text-sm lg:text-base bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none transition"
                    >
                      <option value="mine">👤 自分のボード</option>
                      <option value="shared">🔒 チームボード</option>
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

                  {/* Create Button */}
                  <div className="lg:col-span-1">
                    <button
                      onClick={createBoard}
                      disabled={!newBoardTitle.trim() || isCreating}
                      className="w-full h-12 bg-blue-600 text-white rounded-lg px-4 text-sm lg:text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                      {isCreating ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          作成中...
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-lg">+</span>
                          <span>作成</span>
                        </span>
                      )}
                    </button>
                  </div>

                  {boardVisibility === "shared" && (
                    <div className="mt-6 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        👥 チームメンバーを選択
                      </label>
                      <div className="border-2 border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto bg-gray-50 shadow-inner scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {allUsers.map((user) => (
                            <label
                              key={user.id}
                              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds((prev) => [
                                      ...prev,
                                      user.id,
                                    ]);
                                  } else {
                                    setSelectedUserIds((prev) =>
                                      prev.filter((id) => id !== user.id)
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200 truncate">
                                  {user.username}
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-200 truncate">
                                  {user.email}
                                </div>
                              </div>
                              {selectedUserIds.includes(user.id) && (
                                <div className="text-blue-500 text-sm animate-in fade-in duration-200">
                                  ✓
                                </div>
                              )}
                            </label>
                          ))}
                        </div>

                        {/* Selected Count Indicator */}
                        {selectedUserIds.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                選択済み:{" "}
                                <span className="font-medium text-blue-600">
                                  {selectedUserIds.length}
                                </span>{" "}
                                人
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedUserIds([])}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors duration-200"
                              >
                                すべて解除
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {allUsers.length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-2xl mb-2">
                              👥
                            </div>
                            <p className="text-sm text-gray-500">
                              利用可能なユーザーがいません
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boards Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
            {filteredBoards.map((board) => (
              <div
                key={board.id}
                onClick={() => handleClickBoard(board.id)}
                className="bg-white rounded-xl p-4 shadow-lg hover:shadow-2xl border border-gray-100 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:scale-105 lg:rounded-2xl lg:p-6 lg:hover:-translate-y-2 relative"
              >
                {/* Favorite Star Badge */}
                {board.isFavorite && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                      <span className="text-sm">⭐</span>
                    </div>
                  </div>
                )}
                {/* <h3 className="text-lg font-semibold">{board.title}</h3>
            <div className="text-xs text-gray-500 mt-1">
              {userId === board.userId ? "👤 自分" : board.isPublic ? "🌐 公開" : "🔒 チーム"}
            </div>
          </div>
        ))} */}

                {/* Board Header */}
                <div className="flex justify-between items-start mb-4 lg:mb-6">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-400 shadow-lg flex-shrink-0 lg:w-12 lg:h-12 lg:rounded-xl"></div>
                    {/* Board Type Indicator */}
                    <div className="text-sm min-w-0">
                      {board.visibility === "mine" ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium whitespace-nowrap">
                          👤 自分
                        </span>
                      ) : board.visibility === "public" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium whitespace-nowrap">
                          🌐 公開
                        </span>
                      ) : board.visibility === "shared" ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium whitespace-nowrap">
                          🔒 チーム
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 lg:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoardId(board.id);
                        setEditedTitle(board.title);
                      }}
                      title="名前を変更"
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200 lg:w-8 lg:h-8 lg:rounded-lg"
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
                      className={`w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 lg:w-8 lg:h-8 lg:rounded-lg ${
                        board.isFavorite
                          ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 scale-110"
                          : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
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
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200 lg:w-8 lg:h-8 lg:rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Title Section */}
                {editingBoardId === board.id ? (
                  <div className="space-y-3 mb-4">
                    <input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameBoard(board.id);
                      }}
                      className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRenameBoard(board.id)}
                        className="flex-1 bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingBoardId(null)}
                        className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3 className="font-bold text-lg text-gray-800 mb-4 line-clamp-2 min-h-[3.5rem] flex items-center">
                    {board.title}
                  </h3>
                )}

                {/* Board Info */}
                <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-500">👥</span>
                    <span className="font-medium">
                      {board.collaborators || 1} 人
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-500">📅</span>
                    <span className="font-medium">
                      {new Date(board.createdAt || "").toLocaleDateString(
                        "ja-JP"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                  : filter === "shared"
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
      {/* <LoginModal isOpen={isModalOpen} onLogin={handleLogin} /> */}
    </div>
  );
};

export default WhiteboardPage;
