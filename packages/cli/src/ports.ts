import * as p from "@clack/prompts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import color from "picocolors";

const execFileAsync = promisify(execFile);

interface Listener {
  port: number;
  pid: number;
  command: string;
  address: string;
}

function parseLsof(output: string): Listener[] {
  const listeners: Listener[] = [];
  let pid: number | undefined;
  let command = "unknown";

  for (const line of output.split("\n")) {
    const field = line[0];
    const value = line.slice(1);

    if (field === "p") {
      pid = Number(value);
      command = "unknown";
      continue;
    }

    if (field === "c") {
      command = value;
      continue;
    }

    if (field !== "n" || !pid) continue;

    const match = value.match(/:(\d+)$/);
    if (!match) continue;

    listeners.push({
      port: Number(match[1]),
      pid,
      command,
      address: value.slice(0, -match[0].length),
    });
  }

  return listeners;
}

function parseWindowsNetstat(output: string): Array<Omit<Listener, "command">> {
  const listeners: Array<Omit<Listener, "command">> = [];

  for (const line of output.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts[0]?.toUpperCase() !== "TCP" || parts[3] !== "LISTENING") continue;

    const match = parts[1]?.match(/^(.*):(\d+)$/);
    const pid = Number(parts[4]);
    if (!match || !pid) continue;

    listeners.push({
      address: match[1],
      port: Number(match[2]),
      pid,
    });
  }

  return listeners;
}

async function findListeners(): Promise<Listener[]> {
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"]);
    const found = parseWindowsNetstat(stdout);
    const names = new Map<number, string>();

    await Promise.all(
      [...new Set(found.map(({ pid }) => pid))].map(async (pid) => {
        try {
          const result = await execFileAsync("tasklist", [
            "/FI",
            `PID eq ${pid}`,
            "/FO",
            "CSV",
            "/NH",
          ]);
          names.set(pid, result.stdout.match(/^"([^"]+)"/)?.[1] ?? "unknown");
        } catch {
          names.set(pid, "unknown");
        }
      }),
    );

    return found.map((listener) => ({
      ...listener,
      command: names.get(listener.pid) ?? "unknown",
    }));
  }

  try {
    const { stdout } = await execFileAsync("lsof", [
      "-nP",
      "-iTCP",
      "-sTCP:LISTEN",
      "-Fpcn",
    ]);
    return parseLsof(stdout);
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string };
    const code = failure.code;
    if (code === "ENOENT") {
      throw new Error(
        "Could not inspect ports because `lsof` is not installed.",
      );
    }
    // lsof exits 1 (without output) when its search simply has no matches.
    if (failure.stdout === "") return [];
    throw error;
  }
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
  ${color.bold("pnpm ports")} — stop processes listening on local TCP ports

  Select one or more ports with ${color.bold("space")}, then press ${color.bold("enter")}.
`);
    return;
  }

  p.intro(color.bgRed(color.black(" MangaKai · kill ports ")));

  const listeners = [
    ...new Map(
      (await findListeners())
        .filter(({ pid }) => pid !== process.pid)
        .map((listener) => [`${listener.pid}:${listener.port}`, listener]),
    ).values(),
  ].sort((a, b) => a.port - b.port || a.pid - b.pid);

  if (listeners.length === 0) {
    p.outro("No active TCP ports found.");
    return;
  }

  const chosen = await p.multiselect<string>({
    message: "Which ports should be stopped?",
    options: listeners.map((listener) => ({
      value: `${listener.pid}:${listener.port}`,
      label: String(listener.port),
      hint: `${listener.command} · pid ${listener.pid} · ${listener.address}`,
    })),
    required: true,
  });

  if (p.isCancel(chosen)) {
    p.cancel("Cancelled. Nothing was stopped.");
    return;
  }

  const selected = listeners.filter((listener) =>
    chosen.includes(`${listener.pid}:${listener.port}`),
  );
  const processes = [
    ...new Map(selected.map((item) => [item.pid, item])).values(),
  ];

  p.note(
    selected
      .map(
        ({ port, command, pid }) =>
          `${color.bold(String(port).padEnd(6))}${command} ${color.dim(`pid ${pid}`)}`,
      )
      .join("\n"),
    "Will stop",
  );

  const confirmed = await p.confirm({
    message: `Stop ${processes.length} process${processes.length === 1 ? "" : "es"}?`,
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Cancelled. Nothing was stopped.");
    return;
  }

  const failures: string[] = [];
  for (const { pid, command } of processes) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      failures.push(`${command} (pid ${pid}): ${(error as Error).message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Some processes could not be stopped:\n${failures.join("\n")}`,
    );
  }

  p.outro(
    `Stopped ${processes.length} process${processes.length === 1 ? "" : "es"} on ${selected.length} port${selected.length === 1 ? "" : "s"}.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n  ${color.red("✖")} ${message}\n`);
  process.exitCode = 1;
});
