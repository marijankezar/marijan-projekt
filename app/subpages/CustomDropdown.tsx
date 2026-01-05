import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Option {
  value: number;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  selectedValue: number;
  onChange: (value: number) => void;
}

export default function CustomDropdown({ options, selectedValue, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className="relative w-full sm:w-80">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center shimmer-bg-Dropdown-Button text-gray-900 dark:text-white border border-blue-400 dark:border-cyan-400 rounded-xl px-5 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-cyan-400 transition-all duration-300 hover:shadow-blue-400/70 dark:hover:shadow-cyan-400/70 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow"
      >
        <span>{selectedOption?.label || "Bitte auswählen"}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Dropdown-Options */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-white/95 dark:bg-gray-900/95 border border-blue-400 dark:border-cyan-400 rounded-xl shadow-lg z-10 animate-fadeInUp overflow-hidden">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-5 py-3 cursor-pointer transition-all duration-200
                hover:bg-blue-500/20 dark:hover:bg-cyan-500/20 hover:pl-6 ${
                  opt.value === selectedValue ? "bg-blue-500/10 dark:bg-cyan-500/10 font-semibold text-blue-600 dark:text-cyan-300" : "text-gray-900 dark:text-white"
                }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
