"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import * as XLSX from "xlsx"; // for Excel export

export default function AttendanceReportPage() {
  const [report, setReport] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    employeeId: ""
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      // ✅ only send non-empty filters
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;
      if (filters.employeeId) params.employeeId = filters.employeeId;

      const res = await axios.get("/api/attendance/report", { params });
      setReport(res.data);
    } catch (err) {
      console.error("Error fetching report", err);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      report.map((r) => ({
        Employee: r.userId?.name || "",
        Date: format(new Date(r.date), "yyyy-MM-dd"),
        "Check In": r.checkIn || "-",
        "Check Out": r.checkOut || "-",
        Status: r.approvalStatus || "pending",
        "Approved By": r.approvedBy?.name || "-"
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, "attendance_report.xlsx");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance Report</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {/* optional: future dropdown for employee filter */}
        <button
          onClick={fetchReport}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Apply
        </button>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Employee</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Check In</th>
              <th className="border p-2">Check Out</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Approved By</th>
            </tr>
          </thead>
          <tbody>
            {report.map((att, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2">{att.userId?.name}</td>
                <td className="border p-2">
                  {format(new Date(att.date), "yyyy-MM-dd")}
                </td>
                <td className="border p-2">{att.checkIn || "-"}</td>
                <td className="border p-2">{att.checkOut || "-"}</td>
                <td className="border p-2 capitalize">
                  {att.approvalStatus || "pending"}
                </td>
                <td className="border p-2">{att.approvedBy?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
