import { GoogleGenerativeAI } from '@google/generative-ai';
import { CRMRecord, SkippedRecord } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are a CRM data extraction specialist. Your task is to map CSV records into GrowEasy CRM format.

## Output Format
Return a valid JSON object with exactly this structure:
{
  "records": [...],
  "skipped": [...]
}

## CRM Fields to Extract
For each record, extract these fields:
- created_at: Lead creation date (must be parseable by JavaScript's new Date()). Use ISO 8601 format like "2026-05-13T14:20:48". If no date found, use current timestamp.
- name: Lead's full name. Combine first name + last name if separate columns exist.
- email: Primary email address. If multiple emails exist, use the first one and append the rest to crm_note.
- country_code: Phone country code (e.g., "+91", "+1"). Extract from phone number if combined.
- mobile_without_country_code: Mobile number WITHOUT country code. If multiple numbers exist, use the first one and append rest to crm_note.
- company: Company or organization name.
- city: City name.
- state: State or province.
- country: Country name.
- lead_owner: Lead owner email or name.
- crm_status: MUST be one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE". Map intelligently from status/stage columns. If unclear, use "GOOD_LEAD_FOLLOW_UP" as default.
- crm_note: Notes, remarks, follow-up info, extra contacts. Consolidate any useful info here.
- data_source: MUST be one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots". If none match confidently, leave as empty string "".
- possession_time: Property possession timeline if applicable.
- description: Any additional description or details.

## Critical Rules
1. SKIP records that have NEITHER an email NOR a mobile number. Add them to the "skipped" array with a reason.
2. For crm_status, ONLY use the 4 allowed values. Map intelligently:
   - "interested", "hot lead", "follow up", "callback", "warm" → "GOOD_LEAD_FOLLOW_UP"
   - "no answer", "not reachable", "voicemail", "busy", "not connected" → "DID_NOT_CONNECT"
   - "not interested", "junk", "spam", "invalid", "wrong number", "bad" → "BAD_LEAD"
   - "converted", "sold", "closed", "won", "deal done", "purchased" → "SALE_DONE"
3. For data_source, ONLY use the 5 allowed values or empty string.
4. Multiple emails/phones: first goes in field, rest go in crm_note with label.
5. Each record must map to a single flat object. No nested objects or arrays.
6. Return ONLY valid JSON. No markdown, no explanation, no extra text.
7. If a field cannot be determined, use empty string "".
8. Clean phone numbers: remove spaces, dashes, parentheses. Separate country code from number.
9. For dates, try to parse any reasonable date format into ISO 8601.`;

interface AIExtractionResult {
  records: CRMRecord[];
  skipped: { rowIndex: number; reason: string; originalData: Record<string, string> }[];
}

export async function extractCRMRecords(
  rawRecords: Record<string, string>[],
  startIndex: number,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<AIExtractionResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const userPrompt = `Extract CRM records from these CSV rows. The row indices start at ${startIndex}.

CSV Records (as JSON):
${JSON.stringify(rawRecords, null, 2)}

Column names present: ${Object.keys(rawRecords[0] || {}).join(', ')}

Return a JSON object with "records" array (extracted CRM records) and "skipped" array (records with no email AND no mobile, each with "rowIndex", "reason", and "originalData").`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const responseText = result.response.text();
    let parsed: AIExtractionResult;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    const validatedRecords = (parsed.records || []).map((record: CRMRecord) =>
      sanitizeCRMRecord(record)
    );

    const skippedRecords = (parsed.skipped || []).map(
      (s: { rowIndex: number; reason: string; originalData: Record<string, string> }) => ({
        rowIndex: s.rowIndex ?? startIndex,
        reason: s.reason || 'Unknown reason',
        originalData: s.originalData || {},
      })
    );

    return { records: validatedRecords, skipped: skippedRecords };
  } catch (error) {
    if (retryCount < maxRetries) {
      console.log(
        `Retry ${retryCount + 1}/${maxRetries} for batch starting at index ${startIndex}`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
      return extractCRMRecords(rawRecords, startIndex, retryCount + 1, maxRetries);
    }
    throw new Error(
      `AI extraction failed after ${maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const VALID_STATUSES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
];

export const VALID_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

export function sanitizeCRMRecord(record: CRMRecord): CRMRecord {
  return {
    created_at: sanitizeDate(record.created_at),
    name: sanitizeString(record.name),
    email: sanitizeString(record.email),
    country_code: sanitizeString(record.country_code),
    mobile_without_country_code: sanitizeString(record.mobile_without_country_code),
    company: sanitizeString(record.company),
    city: sanitizeString(record.city),
    state: sanitizeString(record.state),
    country: sanitizeString(record.country),
    lead_owner: sanitizeString(record.lead_owner),
    crm_status: VALID_STATUSES.includes(record.crm_status)
      ? (record.crm_status as CRMRecord['crm_status'])
      : '',
    crm_note: sanitizeString(record.crm_note),
    data_source: VALID_SOURCES.includes(record.data_source)
      ? (record.data_source as CRMRecord['data_source'])
      : '',
    possession_time: sanitizeString(record.possession_time),
    description: sanitizeString(record.description),
  };
}

export function sanitizeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\n/g, '\\n').trim();
}

export function sanitizeDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  const str = String(value).trim();
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}
