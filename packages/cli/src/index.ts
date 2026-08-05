import { parseArgs } from "node:util";
import color from "picocolors";
import { API_URL, CliError } from "./api";
import { createCommand, createFromFlags } from "./commands/create";
import { editCommand } from "./commands/edit";
import {
  deleteCommand,
  listCommand,
  listJsonCommand,
  setActiveCommand,
  switchCommand,
} from "./commands/manage";

const HELP = `
  ${color.bold("mangakai banner")} — manage MangaKai's site-wide banners

  ${color.dim("Usage")}
    pnpm banner                     ${color.dim("interactive create (same as `new`)")}
    pnpm banner new                 ${color.dim("create a banner, with prompts")}
    pnpm banner list                ${color.dim("show every banner and its status")}
    pnpm banner edit      [id]      ${color.dim("change fields, with a from → to review")}
    pnpm banner publish   [id]      ${color.dim("make a draft live")}
    pnpm banner unpublish [id]      ${color.dim("hide one without deleting it")}
    pnpm banner switch [out] [in]   ${color.dim("retire one and publish another")}
    pnpm banner delete    [id]      ${color.dim("delete permanently")}

  ${color.dim("Leave [id] off and you get a picker. A short id prefix works too.")}

  ${color.dim("Flags")}
    --help, -h                      ${color.dim("show this")}
    --json                          ${color.dim("with `list`, print raw JSON")}

  ${color.dim("Non-interactive create")} ${color.dim("(passing --title skips all prompts)")}
    --title <text>                  ${color.dim("required, 1-120 chars")}
    --body <text>
    --variant <info|announcement|warning>
    --link <url>  --label <text>
    --image <url>
    --starts <date>  --ends <date>  ${color.dim("ISO 8601, e.g. 2026-09-01T22:00:00Z")}
    --draft                         ${color.dim("save without publishing")}

  ${color.dim("Example")}
    pnpm banner new --title "Maintenance" --variant warning \\
      --body "Read-only from 22:00 UTC." --starts 2026-09-01T22:00:00Z

  ${color.dim(`API: ${API_URL}`)}
`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      json: { type: "boolean" },
      title: { type: "string" },
      body: { type: "string" },
      variant: { type: "string" },
      link: { type: "string" },
      label: { type: "string" },
      image: { type: "string" },
      starts: { type: "string" },
      ends: { type: "string" },
      draft: { type: "boolean" },
    },
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

  const [command = "new", id] = positionals;

  switch (command) {
    case "new":
    case "create":
      return values.title
        ? createFromFlags({ ...values, title: values.title })
        : createCommand();
    case "list":
    case "ls":
      return values.json ? listJsonCommand() : listCommand();
    case "edit":
    case "update":
      return editCommand(id);
    case "switch":
      return switchCommand(id, positionals[2]);
    case "publish":
      return setActiveCommand(true, id);
    case "unpublish":
      return setActiveCommand(false, id);
    case "delete":
    case "rm":
      return deleteCommand(id);
    default:
      console.error(
        `${color.red("Unknown command")} "${command}". Try: pnpm banner --help`,
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
