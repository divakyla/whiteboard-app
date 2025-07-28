// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const usersApi = process.env.USERS_API_LINK as string;
//     const resp = await fetch(usersApi, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       cache: "no-store",
//     });
//     const users = await resp.json();
//     // console.log('users',users)
//     return NextResponse.json(users.result);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { message: "Error fetching users" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // PASTIKAN INI ADALAH LINK KE API YANG MENGEMBALIKAN DATA PENGGUNA (USERS) BUKAN HANYA DEPARTEMEN
    // Contoh: const usersApi = process.env.USERS_API_LINK as string;
    // GANTI 'DEPARTMENTS_API_LINK' DENGAN LINK API PENGGUNA YANG SEBENARNYA.
    const usersApi = process.env.USERS_API_LINK as string;

    // Periksa apakah USERS_API_LINK telah diatur
    if (!usersApi) {
      throw new Error("USERS_API_LINK environment variable is not set.");
    }

    const resp = await fetch(usersApi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Tambahkan header otorisasi jika API pengguna Anda memerlukannya
        // 'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store", // Pastikan data selalu terbaru
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(
        `Failed to fetch users: ${resp.status} ${resp.statusText} - ${errorText}`
      );
    }

    const usersData = await resp.json();

    // Pastikan struktur respons dari API eksternal sesuai dengan yang diharapkan.
    // Jika API Anda mengembalikan { result: [...] } atau { data: [...] }, sesuaikan di sini.
    // Asumsi: API mengembalikan array pengguna secara langsung atau di properti 'result'.
    const usersList = usersData.result || usersData; // Sesuaikan jika struktur API Anda berbeda

    // Jika Anda perlu memfilter atau memanipulasi data sebelum mengirim ke frontend, lakukan di sini.
    // Misalnya, untuk memastikan setiap user memiliki department:
    // const formattedUsers = usersList.map(user => ({
    //   ...user,
    //   department: user.department || 'Tidak Diketahui', // Fallback jika department kosong
    //   position: user.position || 'Tidak Diketahui', // Fallback jika position kosong
    // }));

    return NextResponse.json(usersList); // Mengembalikan daftar pengguna
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: `Error fetching users: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
