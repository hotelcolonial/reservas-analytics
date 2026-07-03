"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { Campanha, Plataforma, StatusCampanha, TipoCampanha } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
  TIPOS_CAMPANHA,
  TIPO_CAMPANHA_LABELS,
  STATUS_CAMPANHA_LABELS,
} from "@/lib/utils";

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  campanha?: Campanha | null;
}

type FormData = Omit<Campanha, "id">;

function estadoInicial(c?: Campanha | null): FormData {
  return {
    nome: c?.nome ?? "",
    plataforma: c?.plataforma ?? "google_ads",
    tipo: c?.tipo ?? "promocao",
    status: c?.status ?? "ativa",
    // Ao criar, o store atribui a próxima ordem automaticamente; ao editar,
    // mantemos a ordem atual para não alterá-la sem querer.
    ordem: c?.ordem ?? 0,
  };
}

const statusOpcoes: StatusCampanha[] = ["ativa", "pausada", "finalizada"];

export function CampaignForm({ open, onClose, campanha }: CampaignFormProps) {
  const addCampanha = useStore((s) => s.addCampanha);
  const updateCampanha = useStore((s) => s.updateCampanha);
  const [form, setForm] = useState<FormData>(estadoInicial(campanha));
  const [erro, setErro] = useState<string | null>(null);

  const editando = Boolean(campanha);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function salvar() {
    if (!form.nome.trim()) {
      setErro("Informe o nome da campanha.");
      return;
    }
    if (campanha) {
      updateCampanha(campanha.id, form);
    } else {
      addCampanha(form);
    }
    onClose();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-colonial">
            {editando ? "Editar campanha" : "Nova campanha"}
          </SheetTitle>
          <SheetDescription>
            {editando
              ? "Atualize os dados da campanha."
              : "Cadastre uma campanha para vincular reservas e registrar a verba."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="camp-nome">
                Nome da campanha <span className="text-primary">*</span>
              </FieldLabel>
              <Input
                id="camp-nome"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex.: Black Friday 2026, Réveillon Colonial..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="camp-plataforma">
                  Plataforma <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.plataforma}
                  onValueChange={(v) => set("plataforma", v as Plataforma)}
                >
                  <SelectTrigger id="camp-plataforma" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATAFORMAS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PLATAFORMA_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="camp-tipo">
                  Tipo de campanha <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => set("tipo", v as TipoCampanha)}
                >
                  <SelectTrigger id="camp-tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CAMPANHA.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_CAMPANHA_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="camp-status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as StatusCampanha)}
              >
                <SelectTrigger id="camp-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOpcoes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CAMPANHA_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <p className="rounded-xl bg-accent px-3.5 py-3 text-xs text-muted-foreground">
              A verba gasta é registrada por dia na aba <strong>Verba</strong>, já
              que o investimento varia ao longo da campanha.
            </p>

            {erro && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            )}
          </FieldGroup>
        </div>

        <SheetFooter>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={salvar}>
              {editando ? "Salvar alterações" : "Criar campanha"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
