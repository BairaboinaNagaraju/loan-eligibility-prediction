import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import { Response } from 'express';

const router = Router();

const documentStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(process.cwd(), config.UPLOAD_DIR, 'documents')),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uuidv4()}${ext}`);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, PDF, and WebP files are allowed'));
  },
});

router.use(authenticate);

router.post('/upload/:applicationId', documentUpload.single('file'), async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const { type } = req.body;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const application = await prisma.loanApplication.findUnique({ where: { id: applicationId } });
  if (!application) throw new AppError('Application not found', 404);
  if (application.userId !== req.user!.id) throw new AppError('Access denied', 403);

  const doc = await prisma.document.create({
    data: {
      applicationId,
      userId: req.user!.id,
      type: type || 'OTHER',
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: `/uploads/documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });

  res.json({ success: true, message: 'Document uploaded', data: { document: doc } });
});

router.get('/:applicationId', async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const documents = await prisma.document.findMany({ where: { applicationId } });
  res.json({ success: true, data: { documents } });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) throw new AppError('Document not found', 404);
  if (doc.userId !== req.user!.id) throw new AppError('Access denied', 403);

  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Document deleted' });
});

export default router;
