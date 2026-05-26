"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, FormRow } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import type { Plataforma, Reserva, StatusReserva } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
  STATUS_RESERVA_LABELS,
  calcNoites,
  todayISO,
} from "@/lib/utils";

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  reserva?: Reserva | null;
}

type FormData = Omit<Reserva, "id">;

function estadoInicial(r?: Reserva | null): FormData {
  return {
    cliente: r?.cliente ?? "",
    telefone: r?.telefone ?? "",
    dataReserva: r?.dataReserva ?? todayISO(),
    checkIn: r?.checkIn ?? todayISO(),
    checkOut: r?.checkOut ?? todayISO(),
    campanhaId: r?.campanhaId ?? null,
    plataforma: r?.plataforma ?? "google_ads",
    valor: r?.valor ?? 0,
    pax: r?.pax ?? 1,
    noites: r?.noites ?? 0,
    tipoQuarto: r?.tipoQuarto ?? "",
    status: r?.status ?? "confirmada",
    atendente: r?.atendente ?? "",
    observacoes: r?.observacoes ?? "",
  };
}

const statusOpcoes: StatusReserva[] = ["confirmada", "pendente", "cancelada"];

export function ReservationForm({
  open,
  onClose,
  reserva,
}: ReservationFormProps) {
  const campanhas = useStore((s) => s.campanhas);
  const addReserva = useStore((s) => s.addReserva);
  const updateReserva = useStore((s) => s.updateReserva);

  const [form, setForm] = useState<FormData>(estadoInicial(reserva));
  // Quando true, as noites seguem o cálculo automático de check-in/check-out.
  const [noitesAuto, setNoitesAuto] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const editando = Boolean(reserva);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setCheckIn(value: string) {
    setForm((f) => ({
      ...f,
      checkIn: value,
      noites: noitesAuto ? calcNoites(value, f.checkOut) : f.noites,
    }));
  }

  function setCheckOut(value: string) {
    setForm((f) => ({
      ...f,
      checkOut: value,
      noites: noitesAuto ? calcNoites(f.checkIn, value) : f.noites,
    }));
  }

  function setCampanha(id: string) {
    const campanhaId = id === "" ? null : id;
    const campanha = campanhas.find((c) => c.id === campanhaId);
    setForm((f) => ({
      ...f,
      campanhaId,
      // Ao escolher campanha, herda a plataforma dela (ainda editável).
      plataforma: campanha ? campanha.plataforma : f.plataforma,
    }));
  }

  function salvar() {
    if (!form.cliente.trim()) {
      setErro("Informe o nome do cliente.");
      return;
    }
    if (reserva) {
      updateReserva(reserva.id, form);
    } else {
      addReserva(form);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar reserva" : "Nova reserva"}
      subtitle={
        editando
          ? "Atualize os dados da reserva."
          : "Registre uma reserva e vincule-a à campanha de origem."
      }
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar}>
            {editando ? "Salvar alterações" : "Registrar reserva"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormRow label="Nome do cliente" required htmlFor="res-cliente">
            <Input
              id="res-cliente"
              value={form.cliente}
              onChange={(e) => set("cliente", e.target.value)}
              placeholder="Nome completo"
            />
          </FormRow>

          <FormRow label="Telefone / WhatsApp" htmlFor="res-tel">
            <Input
              id="res-tel"
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </FormRow>
        </div>

        <FormRow label="Campanha de origem">
          <Select
            value={form.campanhaId ?? ""}
            onChange={(e) => setCampanha(e.target.value)}
          >
            <option value="">Sem campanha / direto</option>
            {campanhas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </FormRow>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormRow label="Plataforma de origem" required>
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

          <FormRow label="Data da reserva" htmlFor="res-data">
            <Input
              id="res-data"
              type="date"
              value={form.dataReserva}
              onChange={(e) => set("dataReserva", e.target.value)}
            />
          </FormRow>

          <FormRow label="Check-in" htmlFor="res-checkin">
            <Input
              id="res-checkin"
              type="date"
              value={form.checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </FormRow>

          <FormRow label="Check-out" htmlFor="res-checkout">
            <Input
              id="res-checkout"
              type="date"
              value={form.checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <FormRow label="Valor total (R$)" required htmlFor="res-valor">
            <Input
              id="res-valor"
              type="number"
              min={0}
              step="0.01"
              value={form.valor}
              onChange={(e) => set("valor", Number(e.target.value))}
            />
          </FormRow>

          <FormRow label="Pax (hóspedes)" htmlFor="res-pax">
            <Input
              id="res-pax"
              type="number"
              min={1}
              value={form.pax}
              onChange={(e) => set("pax", Number(e.target.value))}
            />
          </FormRow>

          <FormRow label="Noites" htmlFor="res-noites">
            <Input
              id="res-noites"
              type="number"
              min={0}
              value={form.noites}
              onChange={(e) => {
                setNoitesAuto(false);
                set("noites", Number(e.target.value));
              }}
            />
          </FormRow>
        </div>
        <p className="-mt-2 text-xs text-colonial/50">
          As noites são calculadas automaticamente pelo check-in/check-out, mas
          você pode ajustá-las manualmente.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormRow label="Tipo de quarto (opcional)" htmlFor="res-quarto">
            <Input
              id="res-quarto"
              value={form.tipoQuarto}
              onChange={(e) => set("tipoQuarto", e.target.value)}
              placeholder="Ex.: Casal Standard"
            />
          </FormRow>

          <FormRow label="Atendente responsável" htmlFor="res-atendente">
            <Input
              id="res-atendente"
              value={form.atendente}
              onChange={(e) => set("atendente", e.target.value)}
              placeholder="Quem atendeu"
            />
          </FormRow>
        </div>

        <FormRow label="Status da reserva" required>
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value as StatusReserva)}
          >
            {statusOpcoes.map((s) => (
              <option key={s} value={s}>
                {STATUS_RESERVA_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormRow>

        <FormRow label="Observações" htmlFor="res-obs">
          <Textarea
            id="res-obs"
            value={form.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Pedidos especiais, detalhes do atendimento..."
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
