import { readFile, writeFile, copyFile, mkdir, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseArgs } from "node:util";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { manifestSchema, normalize } from "./normalize";

async function main() {
  const { values } = parseArgs({
    options: {
      file: { type: "string" },
      manifest: { type: "string" },
      encoding: { type: "string", default: "utf-8" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  if (!values.file || !values.manifest)
    throw new Error(
      "사용법: npm run data:import -- --file 원본.csv --manifest 검토.json [--encoding euc-kr] [--dry-run]",
    );
  const manifest = manifestSchema.parse(JSON.parse(await readFile(values.manifest, "utf8")));
  const bytes = await readFile(values.file);
  const hash = createHash("sha256").update(bytes).digest("hex");
  let rows: Record<string, unknown>[];
  if (path.extname(values.file).toLowerCase() === ".xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(values.file);
    const sheet = manifest.sheet ? workbook.getWorksheet(manifest.sheet) : workbook.worksheets[0];
    if (!sheet) throw new Error("엑셀 시트를 찾을 수 없습니다.");
    const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
    if (new Set(headers).size !== headers.length) throw new Error("중복 컬럼");
    rows = [];
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const record: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        const cell = row.getCell(i + 1);
        if (cell.type === ExcelJS.ValueType.Formula)
          throw new Error("수식 셀은 값으로 내보낸 뒤 등록하세요.");
        record[header] = cell.value;
      });
      rows.push(record);
    });
  } else if (path.extname(values.file).toLowerCase() === ".csv") {
    const text = new TextDecoder(values.encoding, { fatal: true }).decode(bytes);
    rows = parse(text, {
      bom: true,
      columns: (headers: string[]) => {
        const clean = headers.map((h) => h.trim());
        if (new Set(clean).size !== clean.length) throw new Error("중복 컬럼");
        return clean;
      },
      skip_empty_lines: true,
      trim: true,
    });
  } else throw new Error("CSV 또는 XLSX만 지원합니다. XLS는 XLSX로 변환하세요.");
  const data = normalize(rows, manifest, hash);
  const output = path.join(process.cwd(), "data", "processed", `${manifest.kind}.json`);
  let comparison = "첫 등록";
  try {
    const old = JSON.parse(await readFile(output, "utf8"));
    comparison = `이전 상태 ${old.status}, 귀속연도 ${old.metadata.taxYear ?? "미확인"} → ${data.metadata.taxYear}`;
    if (old.status === "verified" && old.metadata.taxYear > data.metadata.taxYear!)
      throw new Error("기존 자료보다 오래된 귀속연도로 교체할 수 없습니다.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  console.log(
    `${comparison}\n검증 통과: ${manifest.kind}, ${manifest.expectedTotalPeople.toLocaleString()}명\nSHA-256: ${hash}`,
  );
  if (values["dry-run"]) return;
  const rawDir = path.join(process.cwd(), "data", "raw");
  await mkdir(rawDir, { recursive: true });
  await copyFile(
    values.file,
    path.join(
      rawDir,
      `${manifest.kind}-${data.metadata.taxYear}-${hash.slice(0, 12)}${path.extname(values.file)}`,
    ),
  );
  await copyFile(
    values.manifest,
    path.join(rawDir, `${manifest.kind}-${hash.slice(0, 12)}.manifest.json`),
  );
  await writeFile(`${output}.tmp`, JSON.stringify(data, null, 2) + "\n");
  await rename(`${output}.tmp`, output);
  console.log("등록 완료. npm run check 및 E2E 검증 후 배포하세요.");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "등록 실패");
  process.exitCode = 1;
});
