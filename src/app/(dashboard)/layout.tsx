import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
