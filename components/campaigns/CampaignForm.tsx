"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, FormRow } from "@/components/ui/Field";
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
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar campanha" : "Nova campanha"}
      subtitle={
        editando
          ? "Atualize os dados da campanha."
          : "Cadastre uma campanha para vincular reservas e registrar a verba."
      }
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>
            {editando ? "Salvar alterações" : "Criar campanha"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormRow label="Nome da campanha" required htmlFor="camp-nome">
          <Input
            id="camp-nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Ex.: Black Friday 2026, Réveillon Colonial..."
          />
        </FormRow>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormRow label="Plataforma" required>
            <Select
              value={form.plataforma}
              onChange={(e) => set("plataforma", e.target.value as Plataforma)}
            >
              {PLATAFORMAS.map((p) => (
                <option key={p} value={p}>
                  {PLATAFORMA_LABELS[p]}
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Tipo de campanha" required>
            <Select
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value as TipoCampanha)}
            >
              {TIPOS_CAMPANHA.map((t) => (
                <option key={t} value={t}>
                  {TIPO_CAMPANHA_LABELS[t]}
                </option>
              ))}
            </Select>
          </FormRow>
        </div>

        <FormRow label="Status">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value as StatusCampanha)}
          >
            {statusOpcoes.map((s) => (
              <option key={s} value={s}>
                {STATUS_CAMPANHA_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormRow>

        <p className="rounded-xl bg-colonial-50 px-3.5 py-3 text-xs text-colonial/60">
          A verba gasta é registrada por dia na aba <strong>Verba</strong>, já
          que o investimento varia ao longo da campanha.
        </p>

        {erro && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  );
}
