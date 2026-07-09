import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSV, getCSVHeaders, batchRecords } from '../services/csvService';
import { extractCRMRecords } from '../services/aiService';
import { CRMRecord, SkippedRecord, ProcessingResult } from '../types';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.csv') ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const headers = getCSVHeaders(csvContent);
    const records = parseCSV(csvContent);

    if (records.length === 0) {
      res.status(400).json({ error: 'CSV file is empty or has no valid data rows' });
      return;
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      headers,
      records,
      totalRows: records.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process CSV file',
    });
  }
});

router.post('/process', async (req: Request, res: Response): Promise<void> => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'No records provided for processing' });
      return;
    }

    const wantStreaming = req.headers.accept === 'text/event-stream';

    if (wantStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const BATCH_SIZE = 10;
      const batches = batchRecords(records, BATCH_SIZE);
      const allCRMRecords: CRMRecord[] = [];
      const allSkippedRecords: SkippedRecord[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const startIndex = i * BATCH_SIZE;

        res.write(
          `data: ${JSON.stringify({
            type: 'progress',
            currentBatch: i + 1,
            totalBatches: batches.length,
            processedRecords: startIndex,
            totalRecords: records.length,
            message: `Processing batch ${i + 1} of ${batches.length}...`,
          })}\n\n`
        );

        try {
          const result = await extractCRMRecords(batch, startIndex);
          allCRMRecords.push(...result.records);
          allSkippedRecords.push(
            ...result.skipped.map((s) => ({
              rowIndex: s.rowIndex,
              reason: s.reason,
              originalData: s.originalData,
            }))
          );
        } catch (error) {
          res.write(
            `data: ${JSON.stringify({
              type: 'batch_error',
              batch: i + 1,
              message: `Batch ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })}\n\n`
          );
        }
      }

      const finalResult: ProcessingResult = {
        success: true,
        records: allCRMRecords,
        skippedRecords: allSkippedRecords,
        totalImported: allCRMRecords.length,
        totalSkipped: allSkippedRecords.length,
        totalProcessed: records.length,
      };

      res.write(`data: ${JSON.stringify({ type: 'complete', result: finalResult })}\n\n`);
      res.end();
    } else {
      const BATCH_SIZE = 10;
      const batches = batchRecords(records, BATCH_SIZE);
      const allCRMRecords: CRMRecord[] = [];
      const allSkippedRecords: SkippedRecord[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const startIndex = i * BATCH_SIZE;

        try {
          const result = await extractCRMRecords(batch, startIndex);
          allCRMRecords.push(...result.records);
          allSkippedRecords.push(
            ...result.skipped.map((s) => ({
              rowIndex: s.rowIndex,
              reason: s.reason,
              originalData: s.originalData,
            }))
          );
        } catch (error) {
          console.error(`Batch ${i + 1} failed:`, error);
        }
      }

      const result: ProcessingResult = {
        success: true,
        records: allCRMRecords,
        skippedRecords: allSkippedRecords,
        totalImported: allCRMRecords.length,
        totalSkipped: allSkippedRecords.length,
        totalProcessed: records.length,
      };

      res.json(result);
    }
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process records',
    });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

export default router;
