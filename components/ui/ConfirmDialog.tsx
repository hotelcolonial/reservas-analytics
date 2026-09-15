"use client";

import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  /**
   * Conteúdo extra entre a mensagem e os botões (uma lista, por exemplo).
   * Fica fora da `Description`, que é um `<p>` e não aceita blocos dentro.
   */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" (padrão, excluir) ou "default" (confirmar algo normal). */
  confirmVariant?: "destructive" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  children,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
