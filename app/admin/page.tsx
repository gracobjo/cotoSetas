import AdminDashboard from "./admin-client";

export const metadata = {
  title: "Admin | Villardeciervos Micología",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
