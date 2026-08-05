import { parseArgs } from "node:util";
import color from "picocolors";
import { API_URL, CliError } from "./api";
import {
  activeCommand,
  addCommand,
  deleteCommand,
  editCommand,
  listCommand,
  listJsonCommand,
  moveCommand,
  setActiveCommand,
  switchCommand,
} from "./commands/picks";

const HELP = `
  ${color.bold("mangakai picks")} — manage the homepage Staff Picks row

  ${color.dim("Usage")}
    pnpm picks                       ${color.dim("show every pick (same as `list`)")}
    pnpm picks list                  ${color.dim("every pick, live and draft")}
    pnpm picks active                ${color.dim("only what the homepage shows")}
    pnpm picks add                   ${color.dim("search MangaDex and add one")}
    pnpm picks edit      [manga-id]  ${color.dim("change the editorial note")}
    pnpm picks publish   [manga-id]  ${color.dim("put a draft on the homepage")}
    pnpm picks unpublish [manga-id]  ${color.dim("hide one without deleting it")}
    pnpm picks switch    [from] [to] ${color.dim("swap the manga in a slot")}
    pnpm picks move      [id] [pos]  ${color.dim("reorder; 0 is first")}
    pnpm picks delete    [manga-id]  ${color.dim("remove permanently")}

  ${color.dim("Leave [manga-id] off and you get a picker. A short id prefix works too.")}
  ${color.dim("Ids here are MangaDex manga ids, not staff-pick row ids.")}

  ${color.dim("Flags")}
    --help, -h                       ${color.dim("show this")}
    --json                           ${color.dim("with `list`, print raw JSON")}

  ${color.dim(`API: ${API_URL}`)}
`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      json: { type: "boolean" },
    },
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

  const [command = "list", first, second] = positionals;

  switch (command) {
    case "list":
    case "ls":
      return values.json ? listJsonCommand() : listCommand();
    case "active":
      return activeCommand();
    case "add":
    case "new":
      return addCommand();
    case "edit":
    case "update":
      return editCommand(first);
    case "publish":
      return setActiveCommand(true, first);
    case "unpublish":
      return setActiveCommand(false, first);
    case "switch":
      return switchCommand(first, second);
    case "move":
      return moveCommand(first, second);
    case "delete":
    case "rm":
      return deleteCommand(first);
    default:
      console.error(
        `${color.red("Unknown command")} "${command}". Try: pnpm picks --help`,
      );
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof CliError || error instanceof Error
      ? error.message
      : String(error);

  console.error(`\n  ${color.red("✖")} ${message}\n`);
  process.exitCode = 1;
});
