interface QuizInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  type?: string;
  mask?: "phone" | "cnpj" | "none";
}

const applyPhoneMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const applyCnpjMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
};

const QuizInput = ({ value, onChange, placeholder, type = "text", mask = "none" }: QuizInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (mask === "phone") {
      onChange(applyPhoneMask(raw));
    } else if (mask === "cnpj") {
      onChange(applyCnpjMask(raw));
    } else {
      onChange(raw);
    }
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
    />
  );
};

export default QuizInput;
