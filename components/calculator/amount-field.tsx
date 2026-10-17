import { numberFormat } from "@/lib/money";
export function AmountField({
  id,
  label,
  value,
  onChange,
  unit = "man",
  error,
  help,
  negative = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: "man" | "won";
  error?: string;
  help?: string;
  negative?: boolean;
}) {
  function blur() {
    const clean = value.replaceAll(",", "");
    if (/^-?\d+(?:\.\d{1,4})?$/.test(clean) && Number.isFinite(Number(clean)))
      onChange(numberFormat.format(Number(clean)));
  }
  return (
    <div className="amount-field">
      <label htmlFor={id}>{label}</label>
      <div className={`amount-control ${error ? "invalid" : ""}`}>
        <input
          id={id}
          name={id}
          type="text"
          inputMode={negative ? "text" : "decimal"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={blur}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
          placeholder="0"
        />
        <span>{unit === "man" ? "만 원" : "원"}</span>
      </div>
      <p id={`${id}-hint`} className={error ? "field-error" : "field-hint"}>
        {error || help}
      </p>
    </div>
  );
}
