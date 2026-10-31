export default function Loader({ label = "Loading..." }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-8 text-sm text-gray-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#87A96B]" />
      {label}
    </div>
  );
}
