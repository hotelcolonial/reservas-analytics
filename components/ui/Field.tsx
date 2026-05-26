"use client";

import { cn } from "@/lib/utils";

const baseControl =
  "w-full rounded-xl border border-colonial/15 bg-branco px-3.5 py-2.5 text-sm text-colonial " +
  "placeholder:text-colonial/35 transition-colors focus:border-colonial focus:outline-none " +
  "focus:ring-2 focus:ring-colonial/15";

export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-colonial/80"
    >
      {children}
      {required && <span className="ml-0.5 text-laranja-dark">*</span>}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseControl, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(baseControl, "min-h-[80px] resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseControl, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

/** Agrupa label + controle com espaçamento padrão. */
export function FormRow({
  label,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
    </div>
  );
}
