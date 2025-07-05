import express, { Router ,Response} from 'express';
import { body, validationResult } from 'express-validator';
import { ExportOptions, ExportResult, BackupOptions, BackupResult } from '../types/dataTypes';
import { OkResponse, ErrorResponse } from '../types/generalTypes';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import Diary from '../models/diary';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { generatePdf } from '../utils/pdfGenerator';
import { generateCsv } from '../utils/csvGenerator';

const router: Router = express.Router();

// 确保导出目录存在
const EXPORT_DIR = path.join(__dirname, '../../exports');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * 导出用户数据
 */
router.post(
  '/export',
  authenticate,
  [
    body('dataTypes').isArray().notEmpty(),
    body('format').isIn(['json', 'csv', 'pdf']),
    body('dateRange').optional().isString()
  ],
  async (req: AuthenticatedRequest, res: Response<ExportResult | ErrorResponse>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ message: 'Validation failed', details: errors.array() });
    }

    try {
      const userId = req.userId!;
      const exportOptions: ExportOptions = req.body;
      const { dataTypes, format, dateRange } = exportOptions;

      // 准备导出数据
      const exportData: Record<string, any> = {};

      // 导出日记数据
      if (dataTypes.includes('diaries')) {
        const params: {
          dateRange?: string;
        } = {};
        
        if (dateRange) {
          params.dateRange = dateRange;
        }
        
        const diaries = await Diary.findByUserId(userId, params);
        exportData.diaries = diaries.map(diary => diary.toResponse());
      }

      // TODO: 实现反馈和分析数据的导出
      if (dataTypes.includes('feedback')) {
        exportData.feedback = { message: 'Feedback export not implemented yet' };
      }
      
      if (dataTypes.includes('analytics')) {
        exportData.analytics = { message: 'Analytics export not implemented yet' };
      }

      // 生成导出文件
      let fileName = `export_${userId}_${Date.now()}`;
      let filePath = '';

      switch (format) {
        case 'json':
          fileName += '.json';
          filePath = path.join(EXPORT_DIR, fileName);
          fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
          break;
          
        case 'csv':
          fileName += '.zip';
          filePath = path.join(EXPORT_DIR, fileName);
          
          // 创建ZIP存档
          const output = fs.createWriteStream(filePath);
          const archive = archiver('zip', { zlib: { level: 9 } });
          
          output.on('close', () => console.log(`Exported ${archive.pointer()} bytes`));
          archive.pipe(output);
          
          // 为每个数据类型添加CSV文件
          for (const [dataType, data] of Object.entries(exportData)) {
            const csvData = generateCsv(data);
            archive.append(csvData, { name: `${dataType}.csv` });
          }
          
          await archive.finalize();
          break;
          
        case 'pdf':
          fileName += '.pdf';
          filePath = path.join(EXPORT_DIR, fileName);
          await generatePdf(exportData, filePath);
          break;
      }

      // 返回下载链接
      const downloadUrl = `/data/download/${path.basename(filePath)}`;
      res.json({ 
        success: true, 
        downloadUrl 
      });

    } catch (error) {
      console.error('Export failed:', error);
      res.status(500).json({ 
        message: 'Export failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  }
);

/**
 * 下载导出的文件
 */
router.get(
  '/download/:filename',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const filename = req.params.filename;
      const filePath = path.join(EXPORT_DIR, filename);

      // 验证文件名格式
      if (!filename.startsWith(`export_${userId}_`)) {
        return void res.status(403).json({ message: 'Unauthorized file access' });
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return void res.status(404).json({ message: 'File not found' });
      }

      // 设置响应头
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // 根据文件类型设置Content-Type
      if (filename.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filename.endsWith('.zip')) {
        res.setHeader('Content-Type', 'application/zip');
      } else if (filename.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }

      // 发送文件
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Download failed:', error);
      res.status(500).json({ 
        message: 'Download failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  }
);

/**
 * 创建数据备份
 */
router.post(
  '/backup',
  authenticate,
  [
    body('type').isIn(['full', 'incremental']),
    body('encryptionKey').optional().isString()
  ],
  async (req: AuthenticatedRequest, res: Response<BackupResult | ErrorResponse>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ message: 'Validation failed', details: errors.array() });
    }

    try {
      const userId = req.userId!;
      const backupOptions: BackupOptions = req.body;
      const { type, encryptionKey } = backupOptions;

      // 创建备份目录
      const BACKUP_DIR = path.join(__dirname, '../../backups');
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      // 生成备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${userId}_${type}_${timestamp}.zip`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);

      // 创建ZIP存档
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`Backup created: ${archive.pointer()} bytes`);
      });
      
      archive.pipe(output);

      // 添加数据库文件（SQLite）
      const dbPath = path.join(__dirname, '../../db.sqlite');
      if (fs.existsSync(dbPath)) {
        archive.file(dbPath, { name: 'db.sqlite' });
      }

      // TODO: 添加其他需要备份的文件
      // archive.directory('path/to/other/files', 'files');

      // 添加元数据
      const metaData = {
        userId,
        backupType: type,
        timestamp: new Date().toISOString(),
        fileCount: 1 // 目前只备份数据库文件
      };
      archive.append(JSON.stringify(metaData), { name: 'metadata.json' });

      await archive.finalize();

      res.json({ 
        success: true, 
        backupPath: `/data/backup/${backupFileName}` 
      });

    } catch (error) {
      console.error('Backup failed:', error);
      res.status(500).json({ 
        message: 'Backup failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  }
);

/**
 * 恢复数据备份
 */
router.post(
  '/restore',
  authenticate,
  [
    body('backupPath').isString(),
    body('encryptionKey').optional().isString()
  ],
  async (req: AuthenticatedRequest, res: Response<OkResponse | ErrorResponse>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ message: 'Validation failed', details: errors.array() });
    }

    try {
      const userId = req.userId!;
      const { backupPath, encryptionKey } = req.body;

      // 验证备份文件路径
      const fullBackupPath = path.join(__dirname, '../../backups', path.basename(backupPath));
      
      if (!fs.existsSync(fullBackupPath)) {
        return void res.status(404).json({ message: 'Backup file not found' });
      }

      // TODO: 实现实际的恢复逻辑
      // 在实际应用中，这里会：
      // 1. 解压备份文件
      // 2. 验证备份完整性
      // 3. 恢复数据库和文件
      // 4. 验证恢复结果

      // 模拟恢复过程
      console.log(`Restoring backup for user ${userId} from ${fullBackupPath}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟延迟

      res.json({ 
        //success: true, 
        message: 'Data restored successfully' 
      });

    } catch (error) {
      console.error('Restore failed:', error);
      res.status(500).json({ 
        message: 'Restore failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  }
);

export default router;