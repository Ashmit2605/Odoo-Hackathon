import fs from 'fs';
import path from 'path';
import * as quotationService from '../services/quotation.service.js';
import {
  createQuotationSchema,
  acceptQuotationSchema,
  rejectQuotationSchema,
  requestInfoSchema,
  addMessageSchema,
} from '../validators/quotation.validator.js';
import { notFound, badRequest } from '../utils/http-error.js';

// ─────────────────────────────────────────────────────────────
// CUSTOMER CONTROLLERS
// ─────────────────────────────────────────────────────────────

export async function create(req, res, next) {
  try {
    const data = createQuotationSchema.parse(req.body);
    const result = await quotationService.createQuotation(req.user.id, data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyQuotations(req, res, next) {
  try {
    const list = await quotationService.getMyQuotations(req.user.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function getOneCustomer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const quotation = await quotationService.getQuotationForCustomer(id, req.user.id);
    res.json(quotation);
  } catch (err) {
    next(err);
  }
}

export async function addMessageCustomer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const data = addMessageSchema.parse(req.body);
    const message = await quotationService.addMessage(id, req.user.id, data.message);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

export async function downloadPdfCustomer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const pdfPath = await quotationService.getQuotationPdfPath(id, req.user.id, false);

    if (!fs.existsSync(pdfPath)) {
      return next(notFound('PDF file not found on server'));
    }

    const filename = path.basename(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────

export async function getAllAdmin(req, res, next) {
  try {
    const result = await quotationService.getAllQuotations(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOneAdmin(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const quotation = await quotationService.getQuotationForAdmin(id);
    res.json(quotation);
  } catch (err) {
    next(err);
  }
}

export async function acceptAdmin(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const data = acceptQuotationSchema.parse(req.body);
    const result = await quotationService.acceptQuotation(id, req.user.id, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function rejectAdmin(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const data = rejectQuotationSchema.parse(req.body);
    const result = await quotationService.rejectQuotation(id, req.user.id, data.rejectionReason);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function requestInfoAdmin(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const data = requestInfoSchema.parse(req.body);
    const result = await quotationService.requestInformation(id, req.user.id, data.message);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function downloadPdfAdmin(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next(badRequest('Invalid quotation ID'));
    const pdfPath = await quotationService.getQuotationPdfPath(id, req.user.id, true);

    if (!fs.existsSync(pdfPath)) {
      return next(notFound('PDF file not found on server'));
    }

    const filename = path.basename(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    next(err);
  }
}
