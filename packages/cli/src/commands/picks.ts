import * as p from "@clack/prompts";
import type { AdminStaffPick } from "@mangakai/shared";
import color from "picocolors";
import {
  addStaffPick,
  deleteStaffPick,
  listStaffPicks,
  moveStaffPick,
  searchManga,
  switchStaffPick,
  updateStaffPick,
} from "../api";
import { display, optionalText, required } from "../prompt";

function shortId(id: string) {
  return id.slice(0, 8);
}

/** A pick whose manga MangaDex no longer resolves still has to be visible. */
function pickTitle(pick: AdminStaffPick) {
  return pick.title ?? color.red("(unresolved manga)");
}

function statusLabel(pick: AdminStaffPick) {
  return pick.active ? color.green("live ") : color.dim("draft");
}

async function loadPicks(): Promise<AdminStaffPick[]> {
  const picks = await listStaffPicks();

  if (picks.length === 0) {
    p.cancel("There are no staff picks yet. Add one: pnpm picks add");
    process.exit(0);
  }

  return picks;
}

/** Accepts a full manga id or any unambiguous prefix, like the banner commands. */
function findPick(picks: AdminStaffPick[], id: string) {
  return picks.find(
    (pick) => pick.mangaId === id || pick.mangaId.startsWith(id),
  );
}

async function choosePick(
  message: string,
  filter?: (pick: AdminStaffPick) => boolean,
): Promise<AdminStaffPick> {
  const all = await loadPicks();
  const picks = filter ? all.filter(filter) : all;

  if (picks.length === 0) {
    p.cancel("There are no matching staff picks.");
    process.exit(0);
  }

  const choice = required(
    await p.select<string>({
      message,
      options: picks.map((pick) => ({
        value: pick.mangaId,
        label: pickTitle(pick),
        hint: `#${pick.position} · ${pick.active ? "live" : "draft"} · ${shortId(pick.mangaId)}`,
      })),
    }),
  );

  return picks.find((pick) => pick.mangaId === choice)!;
}

/** Searches MangaDex by title so nobody has to paste a UUID by hand. */
async function chooseManga(message: string): Promise<{
  id: string;
  title: string;
}> {
  const query = required(
    await p.text({
      message,
      placeholder: "Berserk",
      validate: (value) =>
        (value?.trim() ?? "").length < 2
          ? "Type at least two characters."
          : undefined,
    }),
  );

  const results = await searchManga(query.trim());

  if (results.data.length === 0) {
    p.cancel(`Nothing on MangaDex matched "${query.trim()}".`);
    process.exit(1);
  }

  const choice = required(
    await p.select<string>({
      message: "Which one?",
      options: results.data.map((manga) => ({
        value: manga.id,
        label: manga.title,
        hint: [manga.year, manga.status].filter(Boolean).join(" · "),
      })),
    }),
  );

  return {
    id: choice,
    title: results.data.find((manga) => manga.id === choice)!.title,
  };
}

export async function listCommand(): Promise<void> {
  const picks = await listStaffPicks();

  if (picks.length === 0) {
    console.log(color.dim("\n  No staff picks yet. Add one: pnpm picks add\n"));
    return;
  }

  console.log();

  for (const pick of picks) {
    console.log(
      `  ${statusLabel(pick)} ${color.dim(`#${pick.position}`)} ${color.dim(shortId(pick.mangaId))}  ${pickTitle(pick)}`,
    );

    if (pick.note) console.log(`  ${" ".repeat(11)} ${color.dim(pick.note)}`);
  }

  const live = picks.filter((pick) => pick.active).length;

  console.log(
    color.dim(
      `\n  ${picks.length} pick(s), ${live} live. Full ids: pnpm picks list --json\n`,
    ),
  );
}

export async function listJsonCommand(): Promise<void> {
  console.log(JSON.stringify(await listStaffPicks(), null, 2));
}

/** Only what the homepage is actually showing, in order. */
export async function activeCommand(): Promise<void> {
  const picks = (await listStaffPicks()).filter((pick) => pick.active);

  if (picks.length === 0) {
    console.log(
      color.dim("\n  Nothing is live. The homepage row will be empty.\n"),
    );
    return;
  }

  console.log();
  for (const pick of picks) {
    console.log(`  ${color.dim(`#${pick.position}`)}  ${pickTitle(pick)}`);
  }
  console.log(color.dim(`\n  ${picks.length} live on the homepage.\n`));
}

export async function addCommand(): Promise<void> {
  p.intro(color.bgGreen(color.black(" MangaKai · add staff pick ")));

  const manga = await chooseManga("Search MangaDex for a title");

  const note = optionalText(
    required(
      await p.text({
        message: "Editorial note",
        placeholder: "Why the staff picked it (optional)",
        defaultValue: "",
      }),
    ),
  );

  const publishNow = required(
    await p.confirm({ message: "Publish it to the homepage now?" }),
  );

  await addStaffPick({ mangaId: manga.id, note, active: publishNow });

  p.outro(
    publishNow
      ? `${color.bold(manga.title)} is live on the homepage.`
      : `${color.bold(manga.title)} saved as a draft. Publish it: pnpm picks publish`,
  );
}

export async function editCommand(id?: string): Promise<void> {
  p.intro(color.bgCyan(color.black(" MangaKai · edit staff pick ")));

  const pick = id
    ? findPick(await loadPicks(), id)
    : await choosePick("Which pick should change?");

  if (!pick) {
    p.cancel(`No staff pick found matching "${id}".`);
    process.exit(1);
  }

  p.note(
    `${color.dim("title")}  ${pickTitle(pick)}\n${color.dim("note")}   ${display(pick.note)}\n${color.dim("order")}  #${pick.position}\n${color.dim("live")}   ${display(pick.active)}`,
    "Current values",
  );

  const note = optionalText(
    required(
      await p.text({
        message: "Editorial note",
        defaultValue: pick.note ?? "",
        initialValue: pick.note ?? "",
      }),
    ),
  );

  if (note === pick.note) {
    p.cancel("Nothing changed.");
    process.exit(0);
  }

  p.note(
    `${display(pick.note)}\n   ${color.dim("→")} ${display(note)}`,
    "Note",
  );

  const confirmed = required(await p.confirm({ message: "Save this change?" }));

  if (!confirmed) {
    p.cancel("Cancelled. Nothing changed.");
    process.exit(0);
  }

  await updateStaffPick(pick.mangaId, { note });

  p.outro("Updated.");
}

export async function setActiveCommand(
  active: boolean,
  id?: string,
): Promise<void> {
  const verb = active ? "publish" : "unpublish";

  p.intro(color.bgMagenta(color.black(` MangaKai · ${verb} staff pick `)));

  const pick = id
    ? findPick(await loadPicks(), id)
    : await choosePick(
        `Which pick should be ${active ? "published" : "hidden"}?`,
        (item) => item.active !== active,
      );

  if (!pick) {
    p.cancel(`No staff pick found matching "${id}".`);
    process.exit(1);
  }

  await updateStaffPick(pick.mangaId, { active });

  p.outro(
    active
      ? `${color.bold(pickTitle(pick))} is on the homepage.`
      : `${color.bold(pickTitle(pick))} is hidden but kept.`,
  );
}

export async function deleteCommand(id?: string): Promise<void> {
  p.intro(color.bgRed(color.black(" MangaKai · delete staff pick ")));

  const pick = id
    ? findPick(await loadPicks(), id)
    : await choosePick("Which pick should be deleted?");

  if (!pick) {
    p.cancel(`No staff pick found matching "${id}".`);
    process.exit(1);
  }

  const confirmed = required(
    await p.confirm({
      message: `Permanently delete ${color.bold(pickTitle(pick))}?`,
      initialValue: false,
    }),
  );

  if (!confirmed) {
    p.cancel("Cancelled. Nothing was deleted.");
    process.exit(0);
  }

  await deleteStaffPick(pick.mangaId);

  p.outro("Deleted.");
}

/**
 * Swaps the manga behind a slot, keeping its position and published state.
 *
 * The old note is not carried over — it was written about a different series.
 */
export async function switchCommand(
  fromId?: string,
  toId?: string,
): Promise<void> {
  p.intro(color.bgMagenta(color.black(" MangaKai · switch staff pick ")));

  const from = fromId
    ? findPick(await loadPicks(), fromId)
    : await choosePick("Which pick should be replaced?");

  if (!from) {
    p.cancel(`No staff pick found matching "${fromId}".`);
    process.exit(1);
  }

  const to = toId
    ? { id: toId, title: toId }
    : await chooseManga("Search MangaDex for the replacement");

  const note = optionalText(
    required(
      await p.text({
        message: "Editorial note for the new pick",
        placeholder: "The old note does not carry over",
        defaultValue: "",
      }),
    ),
  );

  p.note(
    `${color.dim("out")}  ${pickTitle(from)}\n${color.dim("in")}   ${to.title}`,
    `Slot #${from.position}`,
  );

  const confirmed = required(
    await p.confirm({ message: "Apply this switch?" }),
  );

  if (!confirmed) {
    p.cancel("Cancelled. Nothing changed.");
    process.exit(0);
  }

  const updated = await switchStaffPick(from.mangaId, to.id, note);

  p.outro(
    `Slot #${updated.position} is now ${color.bold(pickTitle(updated))}.`,
  );
}

export async function moveCommand(
  id?: string,
  rawPosition?: string,
): Promise<void> {
  p.intro(color.bgCyan(color.black(" MangaKai · reorder staff picks ")));

  const pick = id
    ? findPick(await loadPicks(), id)
    : await choosePick("Which pick should move?");

  if (!pick) {
    p.cancel(`No staff pick found matching "${id}".`);
    process.exit(1);
  }

  const position =
    rawPosition === undefined
      ? Number(
          required(
            await p.text({
              message: "New position (0 is first)",
              defaultValue: String(pick.position),
              initialValue: String(pick.position),
              validate: (value) =>
                Number.isInteger(Number(value)) && Number(value) >= 0
                  ? undefined
                  : "Use a whole number, 0 or greater.",
            }),
          ),
        )
      : Number(rawPosition);

  if (!Number.isInteger(position) || position < 0) {
    p.cancel(`"${rawPosition}" is not a position. Use a whole number.`);
    process.exit(1);
  }

  const picks = await moveStaffPick(pick.mangaId, position);

  p.note(
    picks
      .map(
        (item) =>
          `${color.dim(`#${item.position}`)} ${item.mangaId === pick.mangaId ? color.bold(pickTitle(item)) : pickTitle(item)}`,
      )
      .join("\n"),
    "New order",
  );

  p.outro("Reordered.");
}
