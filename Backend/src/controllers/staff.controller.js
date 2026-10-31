// Backend/src/controllers/staff.controller.js
import * as staffService from '../services/staff.service.js';

export const getDashboardSummary = async (req, res, next) => {
  try { res.json(await staffService.getDashboardStats()); } catch (err) { next(err); }
};

export const getCustomers = async (req, res, next) => {
  try { res.json(await staffService.getAllCustomers()); } catch (err) { next(err); }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const cust = await staffService.getCustomer(req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    res.json(cust);
  } catch (err) { next(err); }
};

export const createCustomer = async (req, res, next) => {
  try { res.status(201).json(await staffService.createCustomer(req.body)); } catch (err) { next(err); }
};

export const getInvoices = async (req, res, next) => {
  try { res.json(await staffService.getAllInvoices()); } catch (err) { next(err); }
};

export const confirmInvoice = async (req, res, next) => {
  try {
    const updated = await staffService.confirmDraftInvoice(req.params.id);
    if (!updated) return res.status(400).json({ error: "Invoice not found or not in DRAFT status" });
    res.json(updated);
  } catch (err) { next(err); }
};

export const recordPayment = async (req, res, next) => {
  try { res.status(201).json(await staffService.recordPayment(req.body)); } catch (err) { next(err); }
};

export const getOverdueInvoices = async (req, res, next) => {
  try { res.json(await staffService.getOverdueInvoices()); } catch (err) { next(err); }
};

export const createQuotation = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    res.status(201).json(await staffService.createQuotation(data));
  } catch (err) { next(err); }
};

export const confirmSubscription = async (req, res, next) => {
  try {
    const updated = await staffService.confirmQuotation(req.params.id);
    if (!updated) return res.status(400).json({ error: "Subscription not found or not pending payment" });
    res.json(updated);
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await staffService.updateStaffProfile(req.user.id, req.body);
    res.json({ message: "Profile updated", user });
  } catch (err) { next(err); }
};