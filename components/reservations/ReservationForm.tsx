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
import type { Plataforma, Reserva } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
  calcNoites,
  porOrdemSelecionaveis,
  todayISO,
} from "@/lib/utils";

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  reserva?: Reserva | null;
}

type FormData = Omit<Reserva, "id">;

// Radix Select não aceita value="" — usamos este sentinel para "sem campanha".
const SEM_CAMPANHA = "sem";

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

  function setCampanha(value: string) {
    const campanhaId = value === SEM_CAMPANHA ? null : value;
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
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-colonial">
            {editando ? "Editar reserva" : "Nova reserva"}
          </SheetTitle>
          <SheetDescription>
            {editando
              ? "Atualize os dados da reserva."
              : "Registre uma reserva e vincule-a à campanha de origem."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="res-codigo">
                ID da reserva <span className="text-primary">*</span>
              </FieldLabel>
              <Input
                id="res-codigo"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
                placeholder="Ex.: RES-0001"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="res-campanha">Campanha de origem</FieldLabel>
              <Select
                value={form.campanhaId ?? SEM_CAMPANHA}
                onValueChange={setCampanha}
              >
                <SelectTrigger id="res-campanha" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_CAMPANHA}>
                    Sem campanha / direto
                  </SelectItem>
                  {porOrdemSelecionaveis(campanhas, form.campanhaId).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.campanhaId && (
              <Field>
                <FieldLabel htmlFor="res-veio">
                  A data da reserva coincide com a campanha?
                </FieldLabel>
                <Select
                  value={form.veioDaCampanha ? "sim" : "nao"}
                  onValueChange={(v) => set("veioDaCampanha", v === "sim")}
                >
                  <SelectTrigger id="res-veio" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">
                      Sim, a data coincide com a campanha
                    </SelectItem>
                    <SelectItem value="nao">Não, a data não coincide</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="res-plataforma">
                Plataforma de origem <span className="text-primary">*</span>
              </FieldLabel>
              <Select
                value={form.plataforma}
                onValueChange={(v) => set("plataforma", v as Plataforma)}
              >
                <SelectTrigger id="res-plataforma" className="w-full">
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="res-data">Data da reserva</FieldLabel>
                <Input
                  id="res-data"
                  type="date"
                  value={form.dataReserva}
                  onChange={(e) => set("dataReserva", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="res-checkin">Check-in</FieldLabel>
                <Input
                  id="res-checkin"
                  type="date"
                  value={form.checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="res-checkout">Check-out</FieldLabel>
                <Input
                  id="res-checkout"
                  type="date"
                  value={form.checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="res-valor">
                  Valor total (R$) <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="res-valor"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={form.valor === 0 ? "" : form.valor}
                  onChange={(e) =>
                    set("valor", e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="res-pax">Pax (hóspedes)</FieldLabel>
                <Input
                  id="res-pax"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={form.pax === 0 ? "" : form.pax}
                  onChange={(e) =>
                    set("pax", e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="res-noites">Noites</FieldLabel>
                <Input
                  id="res-noites"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.noites === 0 ? "" : form.noites}
                  onChange={(e) => {
                    setNoitesAuto(false);
                    set(
                      "noites",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    );
                  }}
                />
              </Field>
            </div>
            <p className="-mt-3 text-xs text-muted-foreground">
              As noites são calculadas automaticamente pelo check-in/check-out,
              mas você pode ajustá-las manualmente.
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
              {editando ? "Salvar alterações" : "Registrar reserva"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
