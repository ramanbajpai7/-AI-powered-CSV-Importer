import { parse } from 'csv-parse/sync';

export function parseCSV(content: string): Record<string, string>[] {
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      bom: true,
    });
    return records;
  } catch (error) {
    throw new Error(
      `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getCSVHeaders(content: string): string[] {
  try {
    const records = parse(content, {
      columns: false,
      to: 1,
      trim: true,
      bom: true,
    });
    return records[0] || [];
  } catch (error) {
    throw new Error(
      `Failed to read CSV headers: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function batchRecords<T>(records: T[], batchSize: number = 10): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }
  return batches;
}
