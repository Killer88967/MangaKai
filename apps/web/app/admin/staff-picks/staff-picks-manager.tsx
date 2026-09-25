"use client";

import { useState, useTransition } from "react";
import type { AdminStaffPick } from "@mangakai/shared";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createStaffPickAction,
  deleteStaffPickAction,
  moveStaffPickAction,
  switchStaffPickAction,
  updateStaffPickAction,
} from "./actions";

interface StaffPickForm {
  mangaId: string;
  note: string;
  active: boolean;
}

const EMPTY_FORM: StaffPickForm = {
  mangaId: "",
  note: "",
  active: true,
};

export function StaffPicksManager({
  initialPicks,
}: {
  initialPicks: AdminStaffPick[];
}) {
  const [picks, setPicks] = useState(initialPicks);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminStaffPick | null>(null);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Homepage picks</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {picks.length} {picks.length === 1 ? "title" : "titles"}
          </p>
        </div>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger render={<Button />}>Add staff pick</DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add staff pick</DialogTitle>

              <DialogDescription>
                Enter the MangaDex UUID for the manga you want to feature.
              </DialogDescription>
            </DialogHeader>

            <CreatePickForm
              onCreated={() => {
                setCreating(false);
                window.location.reload();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {picks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No staff picks</CardTitle>

            <CardDescription>
              Add a MangaDex title to start building the homepage Staff Picks
              shelf.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {picks.map((pick, index) => (
            <Card key={pick.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-black text-brand-hover">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>
                        {pick.title ?? "Unavailable MangaDex title"}
                      </CardTitle>

                      <Badge
                        variant="outline"
                        className={
                          pick.active
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "text-muted-foreground"
                        }
                      >
                        {pick.active ? "Active" : "Draft"}
                      </Badge>
                    </div>

                    <CardDescription className="mt-1 break-all">
                      {pick.mangaId}
                    </CardDescription>

                    {pick.note && (
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {pick.note}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <MoveButton
                    mangaId={pick.mangaId}
                    position={index - 1}
                    disabled={index === 0}
                    label="↑"
                  />

                  <MoveButton
                    mangaId={pick.mangaId}
                    position={index + 1}
                    disabled={index === picks.length - 1}
                    label="↓"
                  />

                  <Button variant="outline" onClick={() => setEditing(pick)}>
                    Edit
                  </Button>

                  <DeletePickButton
                    pick={pick}
                    onDeleted={() =>
                      setPicks((current) =>
                        current.filter((item) => item.mangaId !== pick.mangaId),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit staff pick</DialogTitle>

            <DialogDescription>
              Change its note, publication state, or MangaDex title.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <EditPickForm
              pick={editing}
              onSaved={() => {
                setEditing(null);
                window.location.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreatePickForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const result = await createStaffPickAction(form);

          if (!result.ok) {
            toast.error(result.error ?? "Unable to add staff pick.");

            return;
          }

          toast.success("Staff pick added.");
          onCreated();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="staff-pick-manga-id">MangaDex UUID</Label>

        <Input
          id="staff-pick-manga-id"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={form.mangaId}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              mangaId: event.target.value,
            }))
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="staff-pick-note">Editorial note</Label>

        <Textarea
          id="staff-pick-note"
          placeholder="Why did MangaKai staff pick this?"
          value={form.note}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              note: event.target.value,
            }))
          }
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              active: event.target.checked,
            }))
          }
          className="size-4 accent-brand"
        />
        Publish immediately
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add staff pick"}
      </Button>
    </form>
  );
}

function EditPickForm({
  pick,
  onSaved,
}: {
  pick: AdminStaffPick;
  onSaved: () => void;
}) {
  const [mangaId, setMangaId] = useState(pick.mangaId);
  const [note, setNote] = useState(pick.note ?? "");
  const [active, setActive] = useState(pick.active);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          let result;

          if (mangaId.trim() !== pick.mangaId) {
            result = await switchStaffPickAction(pick.mangaId, mangaId, note);
          } else {
            result = await updateStaffPickAction(pick.mangaId, {
              note,
              active,
            });
          }

          if (!result.ok) {
            toast.error(result.error ?? "Unable to update staff pick.");

            return;
          }

          /*
           * Switching keeps the existing active state in the API.
           * If the admin changed both manga and publication state,
           * apply the state as a second update.
           */
          if (mangaId.trim() !== pick.mangaId && active !== pick.active) {
            const stateResult = await updateStaffPickAction(mangaId.trim(), {
              note,
              active,
            });

            if (!stateResult.ok) {
              toast.error(
                stateResult.error ??
                  "The manga changed, but its publication state could not be updated.",
              );

              return;
            }
          }

          toast.success("Staff pick updated.");
          onSaved();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="edit-staff-pick-manga">MangaDex UUID</Label>

        <Input
          id="edit-staff-pick-manga"
          required
          value={mangaId}
          onChange={(event) => setMangaId(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-staff-pick-note">Editorial note</Label>

        <Textarea
          id="edit-staff-pick-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="size-4 accent-brand"
        />
        Published
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function MoveButton({
  mangaId,
  position,
  disabled,
  label,
}: {
  mangaId: string;
  position: number;
  disabled: boolean;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon"
      disabled={disabled || isPending}
      aria-label={label === "↑" ? "Move up" : "Move down"}
      onClick={() => {
        startTransition(async () => {
          const result = await moveStaffPickAction(mangaId, position);

          if (!result.ok) {
            toast.error(result.error ?? "Unable to move staff pick.");

            return;
          }

          window.location.reload();
        });
      }}
    >
      {label}
    </Button>
  );
}

function DeletePickButton({
  pick,
  onDeleted,
}: {
  pick: AdminStaffPick;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        const title = pick.title ?? "this staff pick";

        if (!window.confirm(`Remove "${title}"?`)) {
          return;
        }

        startTransition(async () => {
          const result = await deleteStaffPickAction(pick.mangaId);

          if (!result.ok) {
            toast.error(result.error ?? "Unable to remove staff pick.");

            return;
          }

          onDeleted();
          toast.success("Staff pick removed.");
        });
      }}
    >
      {isPending ? "Removing…" : "Remove"}
    </Button>
  );
}
