export default function ComplaintPreview({ category, location, onSubmit }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        Complaint Summary
      </h2>

      <div className="space-y-4">

        <Summary
          label="Issue"
          value={category || "Not selected"}
        />

        <Summary
          label="Location"
          value={location.latitude ? `${location.latitude}, ${location.longitude}` : "Not selected"}
        />

        <Summary
          label="Priority"
          value="High"
        />

        <Summary
          label="AI Confidence"
          value="98%"
        />

      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-8 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        disabled={!category || !location.latitude}
      >
        Submit Complaint
      </button>

    </div>
  );
}

function Summary({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}