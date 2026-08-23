import { useState } from 'react';
import { Filter } from 'lucide-react';

const AdvancedFilters = ({ filters, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-6 left-20 z-[1000]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Advanced Filters"
        title="Advanced Filters"
        className={`backdrop-blur-md p-3 rounded-xl border border-slate-200/50 shadow-lg transition flex items-center gap-2 
          ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-white/90 text-slate-700 hover:bg-white'}`}
      >
        <Filter size={20} />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 shadow-xl shadow-slate-900/10 min-w-[280px] flex flex-col gap-4">
          <h4 className="text-[13px] font-bold text-slate-800 tracking-wide border-b border-slate-100 pb-2">
            ADVANCED FILTERS
          </h4>
          
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1" htmlFor="statusFilter">Status</label>
            <select 
              id="statusFilter"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full h-9 rounded-lg border-slate-300 text-[13px] focus:ring-1 focus:ring-blue-500 bg-white"
              aria-label="Filter by Status"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1" htmlFor="categoryFilter">Category</label>
            <select 
              id="categoryFilter"
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full h-9 rounded-lg border-slate-300 text-[13px] focus:ring-1 focus:ring-blue-500 bg-white"
              aria-label="Filter by Category"
            >
              <option value="">All Categories</option>
              <option value="Garbage">Garbage</option>
              <option value="Pothole">Pothole</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Drainage">Drainage</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1" htmlFor="priorityFilter">Priority</label>
            <select 
              id="priorityFilter"
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="w-full h-9 rounded-lg border-slate-300 text-[13px] focus:ring-1 focus:ring-blue-500 bg-white"
              aria-label="Filter by Priority"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button 
            onClick={() => {
              onFilterChange('status', '');
              onFilterChange('category', '');
              onFilterChange('priority', '');
            }}
            className="mt-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg text-[13px] transition"
            aria-label="Clear All Filters"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
