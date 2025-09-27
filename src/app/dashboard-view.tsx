"use client";
import AdminLayout from '@/components/AdminLayout';

export default function DashboardView() {

  return (
    <AdminLayout currentPage="dashboard">
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-stone-800 mb-4">Dashboard</h2>
          <p className="text-stone-600">soon ...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
