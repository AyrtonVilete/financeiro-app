"use client";

import { useActionState, useState } from "react";
import { createHousehold, joinHousehold, leaveHousehold, type ProfileActionState } from "@/app/(app)/profile/actions";

const initialState: ProfileActionState = { error: null };

export function HouseholdPanel({
  household,
}: {
  household: { id: string; inviteCode: string; partnerName: string | null } | null;
}) {
  const [createState, createAction, creating] = useActionState(createHousehold, initialState);
  const [joinState, joinAction, joining] = useActionState(joinHousehold, initialState);
  const [tab, setTab] = useState<"create" | "join">("create");

  if (household) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Espaço compartilhado</h2>
        {household.partnerName ? (
          <p className="text-sm text-muted-foreground">
            Você e <span className="font-medium text-foreground">{household.partnerName}</span> dividem as
            finanças combinadas.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Envie este código para seu parceiro(a) entrar no espaço compartilhado:
            </p>
            <p className="rounded-lg bg-surface-muted px-3 py-2 text-center font-mono text-lg tracking-widest">
              {household.inviteCode}
            </p>
          </>
        )}
        <form action={leaveHousehold.bind(null, household.id)}>
          <button type="submit" className="text-sm text-expense">
            Sair do espaço compartilhado
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-medium">Modo casal</h2>
      <p className="text-sm text-muted-foreground">
        Crie um espaço compartilhado ou entre em um usando o código do seu parceiro(a).
      </p>

      <div className="flex rounded-xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "create" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}
        >
          Criar
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "join" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}
        >
          Entrar
        </button>
      </div>

      {tab === "create" ? (
        <form action={createAction} className="flex flex-col gap-2">
          <input
            type="text"
            name="name"
            placeholder="Nome do espaço (ex: Casa)"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none"
          />
          {createState.error && <p className="text-sm text-expense">{createState.error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar espaço"}
          </button>
        </form>
      ) : (
        <form action={joinAction} className="flex flex-col gap-2">
          <input
            type="text"
            name="inviteCode"
            placeholder="Código de convite"
            required
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none"
          />
          {joinState.error && <p className="text-sm text-expense">{joinState.error}</p>}
          <button
            type="submit"
            disabled={joining}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {joining ? "Entrando..." : "Entrar no espaço"}
          </button>
        </form>
      )}
    </div>
  );
}
