export default function StatusBadge({ status }) {
  let styles = "bg-slate-100 text-slate-700";
  
  if (status === "Resolved") {
    styles = "bg-green-100 text-green-700";
  } else if (status === "In Progress") {
    styles = "bg-blue-100 text-blue-700";
  } else if (status === "Pending") {
    styles = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {status || "Unknown"}
    </span>
  );
}
