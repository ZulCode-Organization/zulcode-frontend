"use client";

import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends Omit<React.ComponentProps<"input">, "type"> {
  label?: string
  icon?: React.ReactNode
  error?: string
  type?: React.HTMLInputTypeAttribute
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.523 10.523 0 01-2.117 3.639M6.226 6.228A10.451 10.451 0 002.458 12c1.274 4.057 5.065 7 9.542 7a9.478 9.478 0 004.638-1.195"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

function Input({ className, type, label, icon, error, id, ...props }: InputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  const isPassword = type === "password"
  const [showPassword, setShowPassword] = React.useState(false)
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-4 flex items-center text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={resolvedType}
          data-slot="input"
          aria-invalid={!!error}
          className={cn(
            "h-12 w-full min-w-0 rounded-full border border-input bg-transparent px-4 py-1 text-base transition-colors duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            icon && "pl-11",
            isPassword && "pr-11",
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 flex items-center text-muted-foreground hover:text-primary transition-colors duration-150"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export { Input }