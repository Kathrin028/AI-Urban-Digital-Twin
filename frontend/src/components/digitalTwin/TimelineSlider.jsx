const TimelineSlider = ({ currentFilter, onFilterChange }) => {
  const options = [
    { id: 'today', label: 'Today' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'all', label: 'All Time' }
  ];

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-full p-1.5 shadow-xl shadow-slate-900/10 flex items-center">
      {options.map((opt) => {
        const isActive = currentFilter === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onFilterChange(opt.id)}
            className={`
              relative px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-300
              ${isActive 
                ? 'text-white bg-slate-900 shadow-md' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default TimelineSlider;
