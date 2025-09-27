import * as React from "react"
import clsx from "clsx"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'lg' | 'default'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      default: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    }

    return (
      <button
        className={clsx(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
