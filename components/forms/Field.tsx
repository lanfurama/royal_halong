/**
 * Input dùng chung cho các form trong Plan D — label liên kết thật
 * (`htmlFor`/`id`), lỗi liên kết bằng `aria-describedby`.
 *
 * Lỗi dùng `text-red-700` chứ không `text-red-500` — đỏ nhạt trên nền trắng
 * không đạt AA (xem comment tương phản ở `app/globals.css`).
 */
export function Field({
  name,
  label,
  type = 'text',
  required,
  error,
  ...rest
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `field-${name}`
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold tracking-widest uppercase">
        {label}
        {required && (
          <span className="text-gold-text ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`border-line focus:border-gold-deep focus:outline-gold-deep w-full border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 ${
          error ? 'border-red-600' : ''
        }`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
