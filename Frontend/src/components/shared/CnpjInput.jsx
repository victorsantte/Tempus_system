// Applies real-time XX.XXX.XXX/XXXX-XX mask and provides a search trigger.
// `value`    — formatted CNPJ string (controlled)
// `onChange` — (formattedValue) => void
// `onSearch` — (rawDigits14) => void — fires on Buscar click or when 14 digits complete
// `loading`  — bool — shows spinner in button
// `disabled` — bool

export function formatCNPJ(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 14);
  if (d.length <=  2) return d;
  if (d.length <=  5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <=  8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function stripCNPJ(v) {
  return v.replace(/\D/g, '');
}

export default function CnpjInput({ value = '', onChange, onSearch, loading = false, disabled = false }) {
  const digits    = stripCNPJ(value);
  const canSearch = digits.length === 14;

  const handleChange = (e) => {
    const raw       = e.target.value.replace(/\D/g, '').slice(0, 14);
    const formatted = formatCNPJ(raw);
    onChange(formatted);
    // Auto-trigger when all 14 digits are typed
    if (raw.length === 14 && !loading) onSearch(raw);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        placeholder="00.000.000/0000-00"
        maxLength={18}
        disabled={disabled}
        className="flex-1 px-3 py-2.5 border border-gray-200 rounded text-sm bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => canSearch && !loading && onSearch(digits)}
        disabled={!canSearch || loading || disabled}
        title="Buscar dados do CNPJ"
        className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded border text-sm font-medium transition shrink-0 ${
          canSearch && !loading && !disabled
            ? 'bg-black text-white border-black hover:bg-gray-800'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        )}
        {loading ? 'Buscando' : 'Buscar'}
      </button>
    </div>
  );
}
