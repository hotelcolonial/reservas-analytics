"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, FormRow } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import type { Campanha, Plataforma, StatusCampanha, TipoCampanha } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
  TIPOS_CAMPANHA,
  TIPO_CAMPANHA_LABELS,
  STATUS_CAMPANHA_LABELS,
  todayISO,
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
    dataInicio: c?.dataInicio ?? todayISO(),
    dataFim: c?.dataFim ?? todayISO(),
    investimento: c?.investimento ?? 0,
    status: c?.status ?? "ativa",
    observacoes: c?.observacoes ?? "",
    utm: c?.utm ?? "",
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
          : "Cadastre uma campanha para vincular reservas."
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

          <FormRow label="Data de início" htmlFor="camp-inicio">
            <Input
              id="camp-inicio"
              type="date"
              value={form.dataInicio}
              onChange={(e) => set("dataInicio", e.target.value)}
            />
          </FormRow>

          <FormRow label="Data de fim" htmlFor="camp-fim">
            <Input
              id="camp-fim"
              type="date"
              value={form.dataFim}
              onChange={(e) => set("dataFim", e.target.value)}
            />
          </FormRow>

          <FormRow label="Investimento total (R$)" htmlFor="camp-invest">
            <Input
              id="camp-invest"
              type="number"
              min={0}
              step="0.01"
              value={form.investimento}
              onChange={(e) => set("investimento", Number(e.target.value))}
            />
          </FormRow>

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
        </div>

        <FormRow label="UTM / identificador (opcional)" htmlFor="camp-utm">
          <Input
            id="camp-utm"
            value={form.utm}
            onChange={(e) => set("utm", e.target.value)}
            placeholder="Ex.: black_friday_2026"
          />
        </FormRow>

        <FormRow label="Observações" htmlFor="camp-obs">
          <Textarea
            id="camp-obs"
            value={form.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Detalhes internos sobre a campanha..."
          />
        </FormRow>

        {erro && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  );
}
