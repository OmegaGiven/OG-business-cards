import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const port = Number(process.env.OG_BRIDGE_PORT ?? 8787);
const host = process.env.OG_BRIDGE_HOST ?? "0.0.0.0";
const workRoot = resolve(process.env.OG_BRIDGE_WORK_DIR ?? join(tmpdir(), "og-modeler-bridge"));
const slicerCommand = process.env.OG_SLICER_COMMAND;
const printCommand = process.env.OG_PRINT_COMMAND;
const slicedOutputTemplate = process.env.OG_SLICED_OUTPUT;
const maxBodyBytes = Number(process.env.OG_BRIDGE_MAX_BODY_BYTES ?? 25 * 1024 * 1024);

await mkdir(workRoot, { recursive: true });

const server = createServer(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && request.url === "/health") {
      json(response, 200, {
        ok: true,
        slicerConfigured: Boolean(slicerCommand),
        printConfigured: Boolean(printCommand),
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/slice") {
      await handleSlice(request, response);
      return;
    }

    json(response, 404, { error: "Not found" });
  } catch (error) {
    json(response, 500, { error: error instanceof Error ? error.message : "Bridge error" });
  }
});

server.listen(port, host, () => {
  console.log(`OG-Modeler bridge listening on http://${host}:${port}`);
  console.log(slicerCommand ? "Slicer command configured." : "Slicer command missing. Set OG_SLICER_COMMAND.");
  console.log(printCommand ? "Print command configured." : "Print command missing. Slice requests will return sliced files.");
});

async function handleSlice(request, response) {
  if (!slicerCommand) {
    json(response, 501, {
      error: "Slicer is not configured. Set OG_SLICER_COMMAND before using the bridge.",
    });
    return;
  }

  const body = await readJsonBody(request);
  const filename = safeFilename(body.filename ?? "model.stl");
  const action = body.action === "print" ? "print" : "slice";
  const modelBuffer = Buffer.from(String(body.fileBase64 ?? ""), "base64");
  if (!modelBuffer.length) {
    json(response, 400, { error: "Missing fileBase64 model data." });
    return;
  }

  const jobDir = await mkdtemp(join(workRoot, "job-"));
  const inputPath = join(jobDir, filename);
  const outputPath = join(jobDir, `${filename.replace(/\.[^.]+$/, "")}.gcode.3mf`);
  await writeFile(inputPath, modelBuffer);

  const resolvedOutput = slicedOutputTemplate
    ? fillTemplate(slicedOutputTemplate, { input: inputPath, output: outputPath, outputDir: jobDir })
    : outputPath;
  await runCommand(slicerCommand, { input: inputPath, output: resolvedOutput, outputDir: jobDir });

  if (!existsSync(resolvedOutput)) {
    json(response, 502, {
      error: "Slicer completed but did not create the expected output file.",
      expectedOutput: resolvedOutput,
    });
    return;
  }

  let printed = false;
  let printMessage = "Printer command is not configured; returning sliced file.";
  if (action === "print" && printCommand) {
    await runCommand(printCommand, { input: inputPath, output: resolvedOutput, outputDir: jobDir });
    printed = true;
    printMessage = "Print command completed.";
  }

  const slicedBuffer = await readFile(resolvedOutput);
  json(response, 200, {
    ok: true,
    printed,
    message: printMessage,
    filename: basename(resolvedOutput),
    contentType: contentTypeFor(resolvedOutput),
    fileBase64: slicedBuffer.toString("base64"),
  });
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error(`Request body is larger than ${maxBodyBytes} bytes.`);
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function runCommand(command, paths) {
  const resolved = fillTemplate(command, paths);
  const { stderr } = await execAsync(resolved, {
    cwd: paths.outputDir,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (stderr) {
    console.warn(stderr);
  }
}

function fillTemplate(template, paths) {
  return template
    .replaceAll("{input}", shellQuote(paths.input))
    .replaceAll("{output}", shellQuote(paths.output))
    .replaceAll("{outputDir}", shellQuote(paths.outputDir));
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function safeFilename(value) {
  const extension = extname(value) || ".stl";
  const stem = basename(value, extension).replace(/[^a-z0-9._-]+/gi, "-") || "model";
  return `${stem}${extension}`;
}

function contentTypeFor(path) {
  if (path.endsWith(".3mf")) {
    return "model/3mf";
  }
  if (path.endsWith(".gcode")) {
    return "text/x-gcode";
  }
  return "application/octet-stream";
}

function setCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
