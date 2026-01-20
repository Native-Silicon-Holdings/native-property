import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError } from '../utils/response.util';

/**
 * Get financial overview
 */
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get transactions
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const netIncome = income - expenses;

    // Get utility income from payments
    const utilityPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: start,
          lte: end
        },
        status: 'CLEARED'
      }
    });

    const utilityIncome = utilityPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Payment totals
    const allPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: start,
          lte: end
        }
      }
    });

    const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const clearedPayments = allPayments
      .filter(p => p.status === 'CLEARED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPayments = allPayments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Get budget lines for current year
    const currentYear = new Date().getFullYear();
    const budgetLines = await prisma.budgetLine.findMany({
      where: {
        fiscalYear: currentYear
      },
      orderBy: {
        category: 'asc'
      }
    });

    sendSuccess(res, 'Financial overview retrieved successfully', {
      overview: {
        income,
        expenses,
        netIncome,
        utilityIncome,
        payments: {
          total: totalPayments,
          cleared: clearedPayments,
          pending: pendingPayments
        }
      },
      budget: {
        total: budgetLines.reduce((sum, b) => sum + Number(b.budgetedAmount), 0),
        lines: budgetLines
      },
      transactions: transactions.map(t => ({
        ...t,
        amount: t.amount.toString()
      }))
    });
  } catch (error: any) {
    console.error('Get financial overview error:', error);
    sendError(res, 'Failed to get financial overview', error.message, 500);
  }
};

/**
 * Create financial transaction
 */
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, type, category, description, amount, reference, accountingPeriod, attachmentUrl } = req.body;

    // Default accounting period if not provided
    let period = accountingPeriod;
    if (!period) {
      const transactionDate = new Date(date);
      const year = transactionDate.getFullYear();
      const quarter = Math.floor(transactionDate.getMonth() / 3) + 1;
      period = `${year}-Q${quarter}`;
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        date: new Date(date),
        type,
        category,
        description,
        amount: Number(amount),
        reference,
        accountingPeriod: period,
        attachmentUrl
      }
    });

    sendSuccess(res, 'Transaction created successfully', transaction, 201);
  } catch (error: any) {
    console.error('Create transaction error:', error);
    sendError(res, 'Failed to create transaction', error.message, 500);
  }
};

/**
 * Get budget lines
 */
export const getBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fiscalYear } = req.query;
    const year = fiscalYear ? parseInt(fiscalYear as string) : new Date().getFullYear();

    const budgetLines = await prisma.budgetLine.findMany({
      where: {
        fiscalYear: year
      },
      orderBy: {
        category: 'asc'
      }
    });

    sendSuccess(res, 'Budget lines retrieved successfully', { budgetLines });
  } catch (error: any) {
    console.error('Get budget error:', error);
    sendError(res, 'Failed to get budget lines', error.message, 500);
  }
};

/**
 * Create budget line
 */
export const createBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fiscalYear, category, budgetedAmount } = req.body;

    const budgetLine = await prisma.budgetLine.create({
      data: {
        fiscalYear: parseInt(fiscalYear),
        category,
        budgetedAmount: Number(budgetedAmount),
        spentAmount: 0,
        variance: Number(budgetedAmount)
      }
    });

    sendSuccess(res, 'Budget line created successfully', budgetLine, 201);
  } catch (error: any) {
    console.error('Create budget error:', error);
    sendError(res, 'Failed to create budget line', error.message, 500);
  }
};

/**
 * Update budget line
 */
export const updateBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { budgetedAmount, spentAmount } = req.body;

    const updateData: any = {};
    if (budgetedAmount !== undefined) {
      updateData.budgetedAmount = Number(budgetedAmount);
    }
    if (spentAmount !== undefined) {
      updateData.spentAmount = Number(spentAmount);
    }

    // Recalculate variance
    const current = await prisma.budgetLine.findUnique({
      where: { id }
    });

    if (!current) {
      sendError(res, 'Budget line not found', null, 404);
      return;
    }

    const finalBudgeted = updateData.budgetedAmount !== undefined ? updateData.budgetedAmount : current.budgetedAmount;
    const finalSpent = updateData.spentAmount !== undefined ? updateData.spentAmount : current.spentAmount;
    updateData.variance = finalBudgeted - finalSpent;

    const budgetLine = await prisma.budgetLine.update({
      where: { id },
      data: updateData
    });

    sendSuccess(res, 'Budget line updated successfully', budgetLine);
  } catch (error: any) {
    console.error('Update budget error:', error);
    sendError(res, 'Failed to update budget line', error.message, 500);
  }
};





