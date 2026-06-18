export function FormField({ label, error, children, required }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 border border-gray-200 rounded text-sm bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2.5 border border-gray-200 rounded text-sm bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
