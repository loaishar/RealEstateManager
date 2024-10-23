'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  DollarSign, 
  Home, 
  AlertCircle, 
  Search, 
  Download, 
  Plus,
  BarChart,
  Building,
  Upload,
  Trash2
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import Papa from 'papaparse'

type Payment = {
  milestone: string
  dueDate: string
  amount: number
  cumulative: number
  covered: boolean
  transferred?: number
  totalCovered?: number
  remaining?: number
}

type UnitData = {
  payments: Payment[]
}

type Units = {
  [key: string]: UnitData
}

const initialUnits: Units = {
  'Unit A': {
    payments: [
      { milestone: "Immediate", dueDate: "2024-06-10", amount: 333880, cumulative: 333880, covered: true, transferred: 417160, totalCovered: 403430, remaining: 13730 },
      { milestone: "Within 3 month(s)", dueDate: "2024-09-10", amount: 13910, cumulative: 347790, covered: true },
      { milestone: "Within 4 month(s)", dueDate: "2024-10-10", amount: 13910, cumulative: 361700, covered: false },
    ]
  },
  'Unit B': {
    payments: [
      { milestone: "Immediate", dueDate: "2024-07-10", amount: 300000, cumulative: 300000, covered: true, transferred: 300000, totalCovered: 300000, remaining: 0 },
      { milestone: "Within 3 month(s)", dueDate: "2024-10-10", amount: 15000, cumulative: 315000, covered: false },
    ]
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getPaymentStatus = (payment: Payment): string => {
  const today = new Date()
  const dueDate = new Date(payment.dueDate)
  
  if (payment.covered) return 'completed'
  if (dueDate < today) return 'overdue'
  if (dueDate <= new Date(today.setDate(today.getDate() + 30))) return 'upcoming'
  return 'scheduled'
}

const SummaryCard: React.FC<{ title: string; value: string; Icon: React.ElementType }> = ({ title, value, Icon }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </CardContent>
  </Card>
)

const PaymentRow: React.FC<{ 
  payment: Payment; 
  onViewDetails: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}> = ({ payment, onViewDetails, onEdit, onDelete }) => {
  const status = getPaymentStatus(payment)
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2">{payment.milestone}</td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {new Date(payment.dueDate).toLocaleDateString()}
        </div>
      </td>
      <td className="text-right p-2">{formatCurrency(payment.amount)}</td>
      <td className="text-right p-2">{formatCurrency(payment.cumulative)}</td>
      <td className="text-right p-2">{payment.transferred ? formatCurrency(payment.transferred) : '-'}</td>
      <td className="text-right p-2">{payment.totalCovered ? formatCurrency(payment.totalCovered) : '-'}</td>
      <td className="text-right p-2">{payment.remaining ? formatCurrency(payment.remaining) : '-'}</td>
      <td className="text-center p-2">
        <Badge 
          className={
            status === 'completed' ? 'bg-green-100 text-green-800' :
            status === 'overdue' ? 'bg-red-100 text-red-800' :
            status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </td>
      <td className="text-center p-2">
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(payment)}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(payment)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(payment)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}

const ColumnMappingModal: React.FC<{
  headers: string[];
  onConfirm: (mapping: { [key: string]: string }) => void;
  onCancel: () => void;
}> = ({ headers, onConfirm, onCancel }) => {
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});

  const handleMappingChange = (header: string, value: string) => {
    setMapping(prev => ({ ...prev, [header]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Map Columns</h2>
        {headers.map(header => (
          <div key={header} className="mb-4">
            <label className="block text-sm font-medium text-gray-700">{header}</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              onChange={(e) => handleMappingChange(header, e.target.value)}
              value={mapping[header] || ''}
            >
              <option value="">Select field</option>
              {['milestone', 'dueDate', 'amount', 'cumulative', 'covered', 'transferred', 'totalCovered', 'remaining'].map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(mapping)}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};

export default function RealEstateManager() {
  const [units, setUnits] = useState<Units>(initialUnits)
  const [activeUnit, setActiveUnit] = useState('Unit A')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false)
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({})
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [newPaymentOriginal, setNewPaymentOriginal] = useState<Payment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showMappingInterface, setShowMappingInterface] = useState(false)
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [uploadedHeaders, setUploadedHeaders] = useState<string[]>([])

  const activeUnitData = useMemo(() => {
    const payments = units[activeUnit]?.payments || [];
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const coveredAmount = payments
      .filter(payment => payment.covered)
      .reduce((sum, payment) => sum + payment.amount, 0);
    return {
      payments,
      totalAmount,
      coveredAmount,
    };
  }, [units, activeUnit]);

  const filteredPayments = useMemo(() => {
    return activeUnitData.payments.filter(payment => {
      const matchesSearch = payment.milestone.toLowerCase().includes(searchTerm.toLowerCase())
      const status = getPaymentStatus(payment)
      return matchesSearch && (filterStatus === 'all' || status === filterStatus)
    })
  }, [activeUnitData.payments, searchTerm, filterStatus])

  const analyticsData = useMemo(() => {
    return Object.entries(units).map(([unit, data]) => {
      const totalAmount = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const coveredAmount = data.payments
        .filter(payment => payment.covered)
        .reduce((sum, payment) => sum + payment.amount, 0);
      return {
        unit,
        totalAmount,
        coveredAmount,
        remainingAmount: totalAmount - coveredAmount,
        completionPercentage: totalAmount ? (coveredAmount / totalAmount) * 100 : 0
      };
    });
  }, [units])

  const exportToCSV = useCallback(() => {
    const headers = ['Milestone', 'Due Date', 'Amount', 'Cumulative', 'Covered', 'Transferred', 'Total Covered', 'Remaining'];
    const csvRows = [
      headers.join(','),
      ...activeUnitData.payments.map(payment => 
        headers.map(header => {
          const key = header.replace(' ', '').toLowerCase() as keyof Payment;
          return payment[key] !== undefined ? payment[key] : '';
        }).join(',')
      ),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_${activeUnit}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeUnitData.payments, activeUnit]);

  const downloadSampleCSV = useCallback(() => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Milestone,Due Date,Amount,Cumulative,Covered\n" +
      "Immediate,2024-06-10,333880,333880,true\n" +
      "Within 3 month(s),2024-09-10,13910,347790,true\n" +
      "Within 4 month(s),2024-10-10,13910,361700,false"
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sample_payments.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setUploadedHeaders(headers);
          setUploadedData(results.data as any[]);
          setShowMappingInterface(true);
        },
      });
    }
  }

  const handleColumnMapping = (mapping: { [key: string]: string }) => {
    const mappedData = uploadedData.map(row => {
      const mappedRow: Partial<Payment> = {};
      Object.entries(mapping).forEach(([header, field]) => {
        if (field === 'amount' || field === 'cumulative' || field === 'transferred' || field === 'totalCovered' || field === 'remaining') {
          mappedRow[field as keyof Payment] = parseFloat(row[header]);
        } else if (field === 'covered') {
          mappedRow[field] = row[header].toString().toLowerCase() === 'true';
        } else if (field === 'dueDate') {
          mappedRow[field] = new Date(row[header]).toISOString().split('T')[0];
        } else {
          mappedRow[field as keyof Payment] = row[header];
        }
      });
      return mappedRow as Payment;
    });

    // Recalculate cumulative amounts
    let cumulative = 0;
    const paymentsWithCumulative = mappedData.map(payment => {
      cumulative += payment.amount;
      return { ...payment, cumulative };
    });

    setUnits(prevUnits => ({
      ...prevUnits,
      [activeUnit]: {
        ...prevUnits[activeUnit],
        payments: [...prevUnits[activeUnit].payments, ...paymentsWithCumulative],
      },
    }));

    setShowMappingInterface(false);
  };

  const handleAddNewPayment = () => {
    if  (newPayment.milestone && newPayment.dueDate && newPayment.amount !== undefined) {
      let updatedPayments;
      if (isEditingPayment && newPaymentOriginal) {
        updatedPayments = activeUnitData.payments.map(payment =>
          payment === newPaymentOriginal ? { ...newPayment as Payment } : payment
        );
      } else {
        updatedPayments = [...activeUnitData.payments, {
          ...newPayment as Payment,
          covered: newPayment.covered || false
        }];
      }

      // Recalculate cumulative amounts
      let cumulative = 0;
      updatedPayments = updatedPayments.map(payment => {
        cumulative += payment.amount;
        return { ...payment, cumulative };
      });

      setUnits(prevUnits => ({
        ...prevUnits,
        [activeUnit]: {
          ...prevUnits[activeUnit],
          payments: updatedPayments,
        },
      }));
      setNewPayment({});
      setShowNewPaymentForm(false);
      setIsEditingPayment(false);
      setNewPaymentOriginal(null);
    }
  };

  const handleDeleteUnit = (unitName: string) => {
    if (confirm(`Are you sure you want to delete ${unitName}?`)) {
      setUnits(prevUnits => {
        const updatedUnits = { ...prevUnits };
        delete updatedUnits[unitName];
        return updatedUnits;
      });
      if (activeUnit === unitName) {
        const remainingUnits = Object.keys(units).filter(u => u !== unitName);
        setActiveUnit(remainingUnits[0] || '');
      }
    }
  };

  const handleDeletePayment = (paymentToDelete: Payment) => {
    if (confirm(`Are you sure you want to delete the payment "${paymentToDelete.milestone}"?`)) {
      const updatedPayments = activeUnitData.payments.filter(payment => payment !== paymentToDelete);
      // Recalculate cumulative amounts
      let cumulative = 0;
      const paymentsWithUpdatedCumulative = updatedPayments.map(payment => {
        cumulative += payment.amount;
        return { ...payment, cumulative };
      });
      setUnits(prevUnits => ({
        ...prevUnits,
        [activeUnit]: {
          ...prevUnits[activeUnit],
          payments: paymentsWithUpdatedCumulative,
        },
      }));
    }
  };

  const handleAddUnit = () => {
    const unitName = prompt('Enter the name of the new unit:');
    if (unitName && !units[unitName]) {
      setUnits(prevUnits => ({
        ...prevUnits,
        [unitName]: {
          payments: [],
        },
      }));
      setActiveUnit(unitName);
    } else if (units[unitName]) {
      alert('Unit already exists.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {Object.keys(units).map(unit => (
            <div key={unit} className="flex items-center gap-2">
              <Button
                variant={activeUnit === unit ? "default" : "outline"}
                onClick={() => setActiveUnit(unit)}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                {unit}
              </Button>
              {activeUnit !== unit && (
                <Button variant="ghost" onClick={() => handleDeleteUnit(unit)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" className="flex items-center gap-2" onClick={handleAddUnit}>
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={downloadSampleCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Sample CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Value" value={formatCurrency(activeUnitData.totalAmount)} Icon={DollarSign} />
        <SummaryCard title="Covered Amount" value={formatCurrency(activeUnitData.coveredAmount)} Icon={Home} />
        <SummaryCard title="Remaining Balance" value={formatCurrency(activeUnitData.totalAmount - activeUnitData.coveredAmount)} Icon={AlertCircle} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Progress</p>
                <span className="text-sm font-medium">
                  {activeUnitData.totalAmount ? ((activeUnitData.coveredAmount / activeUnitData.totalAmount) * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <Progress 
                value={activeUnitData.totalAmount ? (activeUnitData.coveredAmount / activeUnitData.totalAmount) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unit" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="completionPercentage" stroke="#8884d8" name="Completion %" />
                  <Line type="monotone" dataKey="coveredAmount" stroke="#82ca9d" name="Covered Amount" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                prefix={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'completed', 'upcoming', 'overdue', 'scheduled'].map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Milestone</th>
                  <th className="text-left p-2">Due Date</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-right p-2">Cumulative</th>
                  <th className="text-right p-2">Transferred Amount</th>
                  <th className="text-right p-2">Total Covered</th>
                  <th className="text-right p-2">Remaining</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <PaymentRow 
                    key={index} 
                    payment={payment} 
                    onViewDetails={setSelectedPayment}
                    onEdit={(payment) => {
                      setNewPayment(payment);
                      setNewPaymentOriginal(payment);
                      setIsEditingPayment(true);
                      setShowNewPaymentForm(true);
                    }}
                    onDelete={handleDeletePayment}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <Alert className="mt-4">
              <AlertDescription>
                No payments found matching your search criteria.
              </AlertDescription>
            </Alert>
          )}

          {showNewPaymentForm ? (
            <div className="mt-4 p-4 border rounded-md">
              <h3 className="text-lg font-semibold mb-4">
                {isEditingPayment ? 'Edit Payment' : 'Add New Payment'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Milestone"
                  value={newPayment.milestone || ''}
                  onChange={(e) => setNewPayment({...newPayment, milestone: e.target.value})}
                />
                <Input
                  type="date"
                  value={newPayment.dueDate || ''}
                  onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newPayment.amount !== undefined ? newPayment.amount : ''}
                  onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPayment.covered || false}
                    onChange={(e) => setNewPayment({ ...newPayment, covered: e.target.checked })}
                  />
                  <label>Covered</label>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddNewPayment}>
                    {isEditingPayment ? 'Update Payment' : 'Add Payment'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowNewPaymentForm(false);
                    setNewPayment({});
                    setIsEditingPayment(false);
                    setNewPaymentOriginal(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button className="mt-4" onClick={() => setShowNewPaymentForm(true)}>
              Add New Payment
            </Button>
          )}
        </CardContent>
      </Card>

      {showMappingInterface && (
        <ColumnMappingModal
          headers={uploadedHeaders}
          onConfirm={handleColumnMapping}
          onCancel={() => setShowMappingInterface(false)}
        />
      )}
    </div>
  )
}