export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-x-blue animate-spin" />
        <div className="text-sm text-x-gray">{label}</div>
      </div>
    </div>
  );
}

