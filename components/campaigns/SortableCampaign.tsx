"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MetricasCampanha } from "@/lib/types";
import { CampaignCard } from "./CampaignCard";
import { CampaignRow } from "./CampaignRow";

function DragHandle({
  attributes,
  listeners,
}: {
  attributes: React.HTMLAttributes<HTMLButtonElement>;
  listeners: React.DOMAttributes<HTMLButtonElement> | undefined;
}) {
  return (
    <button
      type="button"
      aria-label="Arrastar para reordenar"
      className="cursor-grab touch-none rounded-md p-1.5 text-colonial/45 transition-colors hover:bg-colonial-50 hover:text-colonial active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="6" r="1" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="9" cy="18" r="1" />
        <circle cx="15" cy="6" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="15" cy="18" r="1" />
      </svg>
    </button>
  );
}

interface SortableCampaignProps {
  m: MetricasCampanha;
  view: "grid" | "list";
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export function SortableCampaign({
  m,
  view,
  onEdit,
  onDelete,
  onToggle,
}: SortableCampaignProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: m.campanha.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const handle = (
    <DragHandle
      attributes={attributes as unknown as React.HTMLAttributes<HTMLButtonElement>}
      listeners={listeners as unknown as React.DOMAttributes<HTMLButtonElement>}
    />
  );

  return (
    <div ref={setNodeRef} style={style}>
      {view === "grid" ? (
        <CampaignCard
          m={m}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          dragHandle={handle}
        />
      ) : (
        <CampaignRow
          m={m}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          dragHandle={handle}
        />
      )}
    </div>
  );
}
