import * as fs from 'fs';
import * as path from 'path';
import {
  parseSpreadsheet,
  SpreadsheetParseError,
} from './spreadsheet.parser';

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../../../docs/specs/StatusReportBI_2026.xlsx',
);

describe('parseSpreadsheet (against real fixture)', () => {
  let buffer: Buffer;

  beforeAll(() => {
    if (!fs.existsSync(FIXTURE_PATH)) {
      throw new Error(`Fixture not found at ${FIXTURE_PATH}`);
    }
    buffer = fs.readFileSync(FIXTURE_PATH);
  });

  it('parses StatusReportBI_2026.xlsx with the expected portfolio', async () => {
    const result = await parseSpreadsheet(buffer, 2026);
    expect(result.acceptedRows).toHaveLength(50);
    expect(result.rejectedRows).toHaveLength(1);
    expect(result.rowsSkipped).toBe(1);
    const dist = result.acceptedRows.reduce<Record<string, number>>(
      (acc, row) => ({
        ...acc,
        [row.projectStatus]: (acc[row.projectStatus] ?? 0) + 1,
      }),
      {},
    );
    expect(dist).toEqual({
      ACTIVE: 28,
      ON_HOLD: 8,
      COMPLETED: 3,
      CANCELLED: 5,
      NOT_STARTED: 6,
    });
  });

  it('parses BI sheet as available', async () => {
    const result = await parseSpreadsheet(buffer, 2026);
    expect(result.biSanity.available).toBe(true);
  });

  it('accepts the StatusReport sheet regardless of the year suffix on its name', async () => {
    // The reference year is the value the user picked in the form; the suffix
    // on the sheet name is informational only and must not gate the import.
    const result = await parseSpreadsheet(buffer, 2024);
    expect(result.acceptedRows.length).toBeGreaterThan(0);
  });

  it('rejects when buffer is not a valid XLSX', async () => {
    await expect(
      parseSpreadsheet(Buffer.from('not an xlsx'), 2026),
    ).rejects.toBeInstanceOf(SpreadsheetParseError);
  });
});
