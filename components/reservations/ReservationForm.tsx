"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, FormRow } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import type { Plataforma, Reserva } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
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
    codigo: r?.codigo ?? "",
    dataReserva: r?.dataReserva ?? todayISO(),
    checkIn: r?.checkIn ?? todayISO(),
    checkOut: r?.checkOut ?? todayISO(),
    campanhaId: r?.campanhaId ?? null,
    plataforma: r?.plataforma ?? "google_ads",
    valor: r?.valor ?? 0,
    pax: r?.pax ?? 1,
    noites: r?.noites ?? 0,
    veioDaCampanha: r?.veioDaCampanha ?? true,
    status: r?.status ?? "confirmada", // mantido interno; novas reservas confirmadas
  };
}

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
    if (!form.codigo.trim()) {
      setErro("Informe o ID da reserva.");
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
        <FormRow label="ID da reserva" required htmlFor="res-codigo">
          <Input
            id="res-codigo"
            value={form.codigo}
            onChange={(e) => set("codigo", e.target.value)}
            placeholder="Ex.: RES-0001"
          />
        </FormRow>

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

        {form.campanhaId && (
          <FormRow label="A data da reserva coincide com a campanha?">
            <Select
              value={form.veioDaCampanha ? "sim" : "nao"}
              onChange={(e) => set("veioDaCampanha", e.target.value === "sim")}
            >
              <option value="sim">Sim, a data coincide com a campanha</option>
              <option value="nao">Não, a data não coincide</option>
            </Select>
          </FormRow>
        )}

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

        {erro && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  );
}
