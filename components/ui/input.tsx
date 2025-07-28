import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string; // Untuk tambahan class jika dibutuhkan
}

// Komponen Input
export const Input: React.FC<InputProps> = React.forwardRef<
  HTMLInputElement,
  InputProps
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
