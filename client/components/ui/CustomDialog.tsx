"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription, // (optional if needed)
} from "@/components/ui/dialog";

import { ReactNode } from "react";

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

const CustomDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClass = "sm:max-w-md",
}: CustomDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={widthClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <div className="py-2">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;
