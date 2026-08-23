export default function IssueForm({ category, setCategory, description, setDescription, onSubmit, isSubmitting }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <h2 className="mb-6 text-[18px] font-semibold text-slate-900 tracking-tight">
        Complaint Details
      </h2>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Issue Category
          </label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white hover:border-slate-400"
          >
            <option value="">Select Category</option>
            <option value="Garbage">Garbage</option>
            <option value="Pothole">Pothole</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Water Leakage">Water Leakage</option>
            <option value="Road Damage">Road Damage</option>
            <option value="Drainage">Drainage</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Description
          </label>
          <textarea
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[140px] rounded-xl border border-slate-300 p-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none hover:border-slate-400"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 mt-2 shadow-sm text-[15px] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit Complaint</span>
          )}
        </button>
      </div>
    </div>
  );
}