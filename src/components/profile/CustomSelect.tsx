import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    label: string;
}

export function CustomSelect({ options, value, onChange, label }: CustomSelectProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--fc-body-gray)] uppercase tracking-wider">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none bg-[var(--fc-subtle-gray)]/50 border border-transparent rounded-lg px-3 py-2 text-sm text-[var(--fc-dark-gray)] focus:outline-none focus:bg-white focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)] transition-all cursor-pointer"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fc-body-gray)] pointer-events-none"
                />
            </div>
        </div>
    );
}
