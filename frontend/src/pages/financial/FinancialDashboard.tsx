import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { financialApi } from '../../services/api';
import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Transaction {
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
}

interface BudgetLine {
  category: string;
  budgeted_amount: number;
  spent_amount: number;
  variance: number;
}

const FinancialDashboard = () => {
  const { user } = useAuth();
  const { activeEstate } = useEstate();
  const [overview, setOverview] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check role access
  const canView = user?.isOrgStaff || user?.estateRole === 'DIRECTOR' || user?.estateRole === 'ACCOUNTANT';
  if (!user || !canView) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEstate?.id]);

  const fetchData = async () => {
    try {
      const estateId = activeEstate?.id;
      const [txResponse, budgetResponse] = await Promise.all([
        financialApi.getOverview({ estateId }),
        financialApi.getBudget({ estateId }),
      ]);

      if (!txResponse.error && txResponse.data) {
        const txns = txResponse.data as unknown as Transaction[];
        setTransactions(txns);

        const income = txns.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const expenses = txns.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        const utilityIncome = txns
          .filter((t) => t.type === 'INCOME' && t.category.toLowerCase().includes('utilit'))
          .reduce((sum, t) => sum + t.amount, 0);

        setOverview({ income, expenses, netIncome: income - expenses, utilityIncome });
      }

      if (!budgetResponse.error && budgetResponse.data) {
        setBudget({ lines: budgetResponse.data as unknown as BudgetLine[] });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl text-foreground">Financial Dashboard</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-success mt-1">R {overview?.income?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-destructive mt-1">R {overview?.expenses?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Income</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  (overview?.netIncome || 0) >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                R {overview?.netIncome?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Utility Income</p>
              <p className="text-2xl font-bold text-info mt-1">R {overview?.utilityIncome?.toFixed(2) || '0.00'}</p>
            </div>
            <FileText className="h-8 w-8 text-info" />
          </div>
        </div>
      </div>

      {/* Budget Lines */}
      {budget && (
        <div className="card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Budget Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Budgeted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Spent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {budget.lines?.map((line: BudgetLine, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{line.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">R {line.budgeted_amount?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">R {line.spent_amount?.toFixed(2)}</td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        line.variance >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      R {line.variance?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.slice(0, 10).map((transaction: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'INCOME' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{transaction.category}</td>
                  <td className="px-6 py-4 text-sm">{transaction.description}</td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      transaction.type === 'INCOME' ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}R {parseFloat(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
