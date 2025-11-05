"use client";

import * as React from "react";

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return <span ref={ref} className="sr-only" {...props} />;
});
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
