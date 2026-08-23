import { useState } from 'react';
import { Search } from 'lucide-react';

const MapSearch = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="absolute top-6 left-36 z-[1000] w-64 md:w-80">
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-slate-400" size={18} />
        <input 
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search ID, Category, Status..."
          className="w-full h-[46px] pl-10 pr-4 rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-md shadow-lg text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          aria-label="Search map markers"
        />
      </div>
    </div>
  );
};

export default MapSearch;
