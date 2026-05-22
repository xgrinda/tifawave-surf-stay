import type { ComponentPropsWithoutRef } from "react";

type ContainerProps = ComponentPropsWithoutRef<"div">;

export function Container({
  className = "",
  children,
  ...props
}: ContainerProps) {
  return (
    <div className={`container-shell ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
