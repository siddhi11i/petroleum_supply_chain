import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Droplets, 
  Truck, 
  Database, 
  Factory, 
  Share2, 
  Store, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package,
  Clock,
  AlertTriangle,
  History,
  Download,
  Play,
  Leaf,
  Info,
  Maximize2,
  Flame,
  Target,
  FileText,
  Bell,
  CheckCircle2,
  Archive,
  RefreshCw,
  Star,
  Award,
  Grid3X3,
  User,
  Users,
  Ship,
  Train
} from 'lucide-react';

import { cn } from './lib/utils';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate,
  useNavigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import * as d3 from 'd3';

// --- Types ---

interface User {
  username: string;
  token: string;
}

// --- API Config ---
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-900/20',
      secondary: 'bg-slate-700 text-white hover:bg-slate-600',
      outline: 'border border-slate-700 text-slate-300 hover:bg-slate-800',
      ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return (
      <button
        ref={ref}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all ${className}`}
      {...props}
    />
  )
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm ${className}`} {...props}>
    {children}
  </div>
);

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  zIndex = 100,
  maxWidth = 'max-w-lg'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode; 
  zIndex?: number;
  maxWidth?: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full ${maxWidth} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  message, 
  loading = false,
  error = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  message: string; 
  loading?: boolean;
  error?: string;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action" zIndex={110}>
    <div className="space-y-6">
      <p className="text-slate-300">{message}</p>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : 'Confirm'}
        </Button>
      </div>
    </div>
  </Modal>
);

const DataPage = ({ 
  title, 
  description, 
  endpoint, 
  idField, 
  fields, 
  icon: Icon,
  workflowStage,
  prefix,
  prevPrefix,
  prevIdField,
  readOnly = false,
  renderExtra
}: { 
  title: string; 
  description: string; 
  endpoint: string; 
  idField: string; 
  fields: { name: string; label: string; type: string; options?: string[]; readOnly?: boolean; prefix?: string }[];
  icon: any;
  workflowStage?: 'crude' | 'transport' | 'storage' | 'refining' | 'distribution' | 'retail';
  prefix?: string;
  prevPrefix?: string;
  prevIdField?: string;
  readOnly?: boolean;
  renderExtra?: (data: any[]) => React.ReactNode;
}) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableIds, setAvailableIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>(
    fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === 'number' ? '' : (f.options ? f.options[0] : '') }), { signature: '' })
  );

  const userRole = localStorage.getItem('role');
  const roleMapping: Record<string, string> = {
    '/crude_purchase': 'CRUDE_MANAGER',
    '/transportation_log': 'TRANSPORT_MANAGER',
    '/storage_batch': 'STORAGE_MANAGER',
    '/refining_process': 'REFINING_MANAGER',
    '/distribution': 'DISTRIBUTION_MANAGER',
    '/retail': 'RETAIL_MANAGER',
    '/co2_emissions': 'ENVIRONMENT_MANAGER'
  };

  const canEdit = !readOnly && (userRole === 'ADMIN' || userRole === roleMapping[endpoint]);

  const fetchData = async () => {
    try {
      const res = await api.get(endpoint);
      setData(Array.isArray(res.data) ? res.data : []);
      setFilteredData(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error(err);
      setFetchError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableIds = async () => {
    if (!workflowStage || workflowStage === 'crude') return;
    try {
      const res = await api.get(`/workflow/available-ids/${workflowStage}`);
      setAvailableIds(res.data);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const firstId = res.data[0];
        setFormData((prev: any) => {
          const newData = { ...prev, [idField]: firstId };
          if (prevIdField && prevPrefix) {
            newData[prevIdField] = `${prevPrefix}${firstId}`;
          }
          return newData;
        });
      }
    } catch (err) {
      console.error('Failed to fetch available IDs:', err);
    }
  };

  useEffect(() => {
    if (showModal && workflowStage && workflowStage !== 'crude') {
      fetchAvailableIds();
    }
  }, [showModal, workflowStage]);

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  useEffect(() => {
    const filtered = data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchQuery, data]);

  const handleExport = () => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/ /g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionError('');
    try {
      // Ensure number fields are sent as numbers
      const submissionData = { ...formData };
      
      // Handle Workflow ID Prefixing
      if (workflowStage && prefix) {
        submissionData[idField] = `${prefix}${formData[idField]}`;
      }

      // Handle Field-level Prefixing
      fields.forEach(f => {
        if (f.prefix && formData[f.name]) {
          submissionData[f.name] = `${f.prefix}${formData[f.name]}`;
        }
      });

      // Filter out readOnly fields that shouldn't be inputted
      fields.forEach(f => {
        if (f.readOnly) {
          delete submissionData[f.name];
        } else if (f.type === 'number' && submissionData[f.name] !== '') {
          submissionData[f.name] = Number(submissionData[f.name]);
        }
      });

      // Negative value validation
      const numericFields = fields.filter(f => f.type === 'number');
      for (const f of numericFields) {
        if (submissionData[f.name] !== undefined && Number(submissionData[f.name]) < 0) {
          throw new Error(`${f.label} cannot be negative.`);
        }
      }

      await api.post(endpoint, submissionData);
      setShowConfirm(false);
      setShowModal(false);
      setFormData(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === 'number' ? '' : (f.options ? f.options[0] : '') }), { signature: '' }));
      fetchData();
    } catch (err: any) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add record. Please check your data and try again.';
      setSubmissionError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon className="w-8 h-8 text-teal-400" />
            {title}
          </h2>
          <p className="text-slate-400">{description}</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" />
            <span>Add New Record</span>
          </Button>
        )}
      </div>

      {renderExtra && renderExtra(data)}

      {fetchError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {fetchError}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/30">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              className="pl-10 py-1.5 text-sm" 
              placeholder="Search records..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="py-1.5 text-sm" onClick={() => setSearchQuery('')}>
              <Filter className="w-4 h-4" />
              Clear
            </Button>
            <Button variant="outline" className="py-1.5 text-sm" onClick={handleExport}>Export CSV</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                {fields.map(f => (
                  <th key={f.name} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{f.label}</th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={fields.length + 1} className="px-6 py-12 text-center text-slate-500">Loading records...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={fields.length + 1} className="px-6 py-12 text-center text-slate-500">No records found.</td></tr>
              ) : filteredData.map((row, idx) => (
                <tr key={row[idField] || idx} className="hover:bg-slate-800/30 transition-colors group">
                  {fields.map(f => (
                    <td key={f.name} className={`px-6 py-4 text-sm ${f.name === idField ? 'font-bold text-teal-400' : 'text-slate-300'}`}>
                      {row[f.name]}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`New ${title}`}>
        <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.filter(f => !f.readOnly).map(f => (
              <div key={f.name} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{f.label}</label>
                {f.name === idField && workflowStage ? (
                  <div className="flex gap-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-teal-400 font-bold min-w-[3rem] flex items-center justify-center">
                      {prefix}
                    </div>
                    {workflowStage === 'crude' ? (
                      <Input 
                        type="number"
                        placeholder="Numeric ID (e.g. 1234)"
                        value={formData[f.name]}
                        onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                        required
                        className="flex-1"
                      />
                    ) : (
                      <select 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-teal-500/50"
                        value={formData[f.name]}
                        onChange={e => {
                          const val = e.target.value;
                          const newData = { ...formData, [f.name]: val };
                          if (prevIdField && prevPrefix) {
                            newData[prevIdField] = `${prevPrefix}${val}`;
                          }
                          setFormData(newData);
                        }}
                        required
                      >
                        {availableIds.length === 0 ? (
                          <option value="">No available IDs from previous stage</option>
                        ) : (
                          availableIds.map(id => <option key={id} value={id}>{id}</option>)
                        )}
                      </select>
                    )}
                  </div>
                ) : f.name === prevIdField && workflowStage && workflowStage !== 'crude' ? (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 font-mono text-sm">
                    {formData[f.name] || 'Select numeric ID first'}
                  </div>
                ) : f.options ? (
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-teal-500/50"
                    value={formData[f.name]}
                    onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                  >
                    {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : f.prefix ? (
                  <div className="flex gap-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-teal-400 font-bold min-w-[3rem] flex items-center justify-center">
                      {f.prefix}
                    </div>
                    <Input 
                      type={f.type}
                      placeholder={f.label}
                      value={formData[f.name]}
                      onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                      required
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <Input 
                    type={f.type}
                    placeholder={f.label}
                    value={formData[f.name]}
                    onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                    required
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="space-y-1 bg-teal-500/5 p-3 rounded-lg border border-teal-500/20">
            <label className="text-xs font-bold text-teal-400 uppercase flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Digital Signature
            </label>
            <Input 
              placeholder="Enter cryptographic signature" 
              value={formData.signature}
              onChange={e => setFormData({...formData, signature: e.target.value})}
              required
              className="bg-slate-950 border-teal-500/30 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Submit Transaction</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog 
        isOpen={showConfirm} 
        onClose={() => { setShowConfirm(false); setSubmissionError(''); }} 
        onConfirm={handleSubmit}
        loading={submitting}
        error={submissionError}
        message="Are you sure you want to submit this transaction? This will create an immutable record in the ledger."
      />
    </div>
  );
};

// --- Layout ---

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop, ensure sidebar is "open" (visible)
      if (!mobile) {
        setIsOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsOpen]);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Crude Purchase', path: '/crude', icon: Droplets },
    { name: 'Transportation', path: '/transport', icon: Truck },
    { name: 'Storage', path: '/storage', icon: Database },
    { name: 'Refining', path: '/refining', icon: Factory },
    { name: 'Distribution', path: '/distribution', icon: Share2 },
    { name: 'Retail', path: '/retail', icon: Store },
    { name: 'CO2 Emissions', path: '/emissions', icon: Leaf },
    { name: 'Correction Logs', path: '/snapshots', icon: Activity },
    { name: 'Trust Scores', path: '/scores', icon: Award },
    { name: 'Provenance', path: '/provenance', icon: History },
    { name: 'Alert History', path: '/alerts/history', icon: Archive },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isMobile ? (isOpen ? 0 : -300) : 0,
          opacity: 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 shadow-2xl lg:shadow-none flex flex-col`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">PCI</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Integrity System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-teal-600/10 text-teal-400 border border-teal-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'group-hover:text-slate-200'}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </motion.aside>
    </>
  );
};

const Header = ({ onMenuClick, alerts, onAcknowledge }: { onMenuClick: () => void, alerts: any, onAcknowledge: (id: number) => void }) => {
  const username = localStorage.getItem('username');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState<number | null>(null);
  
  const allAlerts = [...(alerts?.stockAlerts || []), ...(alerts?.storageAlerts || [])];
  const alertCount = allAlerts.length;

  const handleAcknowledge = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAcknowledging(id);
    await onAcknowledge(id);
    setIsAcknowledging(null);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden lg:flex items-center gap-2 text-slate-400 text-sm">
          <span className="font-medium text-slate-300">Petroleum Chain Integrity</span>
          <ChevronRight className="w-4 h-4" />
          <span className="capitalize">{useLocation().pathname.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`p-2 rounded-lg transition-colors relative ${isAlertsOpen ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                {alertCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isAlertsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Active System Alerts</h4>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{alertCount} Nodes Alerted</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {allAlerts.length > 0 ? (
                      <div className="divide-y divide-slate-800">
                        {alerts.stockAlerts?.map((a: any) => (
                          <div key={a.Alert_ID} className="p-4 hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 p-1.5 rounded-lg bg-red-500/10 text-red-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium mb-1 line-clamp-2">{a.Message}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Critical Stock</span>
                                  <span className="text-[8px] text-slate-500 font-mono">#{a.Alert_ID}</span>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => handleAcknowledge(e, a.Alert_ID)}
                                disabled={isAcknowledging === a.Alert_ID}
                                className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                title="Acknowledge & Archive"
                              >
                                {isAcknowledging === a.Alert_ID ? (
                                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                        {alerts.storageAlerts?.map((a: any) => (
                          <div key={a.Alert_ID} className="p-4 hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                <Activity className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium mb-1 line-clamp-2">{a.Message}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Auto Reorder</span>
                                  <span className="text-[8px] text-slate-500 font-mono">#{a.Alert_ID}</span>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => handleAcknowledge(e, a.Alert_ID)}
                                disabled={isAcknowledging === a.Alert_ID}
                                className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                title="Acknowledge & Archive"
                              >
                                {isAcknowledging === a.Alert_ID ? (
                                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 italic">
                        <ShieldCheck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-xs">No active alerts found.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-800/30 border-t border-slate-800 grid grid-cols-2 gap-2">
                    <Link to="/alerts/history" onClick={() => setIsAlertsOpen(false)} className="col-span-2">
                      <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Archive className="w-3 h-3" />
                        View Alerts History
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{username}</p>
            <p className="text-xs text-slate-500">{localStorage.getItem('role')?.replace('_', ' ') || 'User'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-900/20">
            {username?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Pages ---

const LoginPage = () => {
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Login/Register
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CRUDE_MANAGER');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & Reset
  const [forgotMsg, setForgotMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const navigate = useNavigate();

  const roles = [
    { value: 'CRUDE_MANAGER', label: 'Crude Manager', icon: Droplets, desc: 'Manage crude oil procurement and sourcing' },
    { value: 'TRANSPORT_MANAGER', label: 'Transport Manager', icon: Truck, desc: 'Oversee logistics and fleet movements' },
    { value: 'STORAGE_MANAGER', label: 'Storage Manager', icon: Database, desc: 'Monitor tank levels and inspections' },
    { value: 'REFINING_MANAGER', label: 'Refining Manager', icon: Factory, desc: 'Control refining processes and additives' },
    { value: 'DISTRIBUTION_MANAGER', label: 'Distribution Manager', icon: Share2, desc: 'Manage dispatch and consumer delivery' },
    { value: 'RETAIL_MANAGER', label: 'Retail Manager', icon: Store, desc: 'Oversee gas station inventory and sales' },
    { value: 'ENVIRONMENT_MANAGER', label: 'Environment Manager', icon: Leaf, desc: 'Audit lifecycle emissions and compliance' },
    { value: 'ADMIN', label: 'Administrator', icon: ShieldCheck, desc: 'Full system access and user management' },
  ];

  const handleSendOtp = async () => {
    setError('');
    setForgotMsg('');
    try {
      const res = await api.post('/forgot-password/send-otp', { email: forgotEmail });
      setForgotMsg(res.data.message);
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
      } else {
        setDevOtp('');
      }
      setForgotStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      await api.post('/forgot-password/verify-otp', { 
        email: forgotEmail, 
        otp: forgotOtp, 
        new_password: newPassword 
      });
      alert('Password reset successful! Please login.');
      setShowForgotModal(false);
      setIsLogin(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin 
        ? { username, password } 
        : { username, email, password, role };
      
      const res = await api.post(endpoint, payload);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('role', res.data.role);
        navigate('/');
      } else {
        setIsLogin(true);
        alert('Registration successful! Please login.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Authentication failed';
      const details = err.response?.data?.details ? ` (${err.response.data.details})` : '';
      setError(`${errorMessage}${details}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-900/40">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Petroleum Chain</h1>
          <p className="text-slate-400">Secure Supply Chain Management System</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white">Select Your Professional Role</h2>
                <p className="text-slate-500 text-sm">Choose the module you are authorized to manage</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { setRole(r.value); setStep(2); }}
                    className={`p-6 rounded-2xl border text-left transition-all duration-300 group ${
                      role === r.value 
                        ? 'bg-teal-600/20 border-teal-500 shadow-lg shadow-teal-500/10' 
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      role === r.value ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-teal-400'
                    }`}>
                      <r.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white mb-1">{r.label}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <Card className="p-8 border-slate-800 bg-slate-900/80">
                <div className="mb-6 flex items-center gap-4 p-4 bg-teal-500/5 rounded-xl border border-teal-500/10">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400">
                    {roles.find(r => r.value === role)?.icon && React.createElement(roles.find(r => r.value === role)!.icon, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Selected Role</p>
                    <p className="text-sm text-white font-medium">{roles.find(r => r.value === role)?.label}</p>
                  </div>
                  <button 
                    onClick={() => setStep(1)}
                    className="ml-auto text-xs text-teal-500 hover:text-teal-400 font-bold"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Username</label>
                    <Input 
                      type="text" 
                      placeholder="Enter your username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Official Email</label>
                      <Input 
                        type="email" 
                        placeholder="manager@petro.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {isLogin && (
                    <div className="text-right">
                      <button 
                        type="button"
                        onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotEmail(''); setError(''); setForgotMsg(''); }}
                        className="text-xs text-slate-500 hover:text-teal-400 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button type="submit" className="w-full py-3">
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Forgot Password Modal */}
      <Modal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)}
        title="Reset Password"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          {forgotStep === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Official Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter your registered email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button className="w-full" onClick={handleSendOtp}>Send OTP</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">{forgotMsg}</p>
                {devOtp && (
                  <div className="mt-2 p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-center">
                    <p className="text-xs text-emerald-500 font-medium">Development Mode OTP:</p>
                    <p className="text-lg font-bold text-white tracking-[0.5em]">{devOtp}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Enter OTP</label>
                <Input 
                  type="text" 
                  placeholder="6-digit code" 
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">New Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button className="w-full" onClick={handleVerifyOtp}>Reset Password</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>({ counts: {}, growth: {}, inventory: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsRes = await api.get('/stats');
        setStats(statsRes.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Crude Purchases', count: stats.counts?.Crude_Purchase || 0, growth: stats.growth?.Crude_Purchase || 0, icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-400/10', path: '/crude' },
    { title: 'In Transit', count: stats.counts?.Transportation_Log || 0, growth: stats.growth?.Transportation_Log || 0, icon: Truck, color: 'text-amber-400', bg: 'bg-amber-400/10', path: '/transport' },
    { title: 'Storage Batches', count: stats.counts?.Storage_Batch || 0, growth: stats.growth?.Storage_Batch || 0, icon: Database, color: 'text-teal-400', bg: 'bg-teal-400/10', path: '/storage' },
    { title: 'Refining Processes', count: stats.counts?.Refining_Process || 0, growth: stats.growth?.Refining_Process || 0, icon: Factory, color: 'text-purple-400', bg: 'bg-purple-400/10', path: '/refining' },
    { title: 'Distribution', count: stats.counts?.Distribution || 0, growth: stats.growth?.Distribution || 0, icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', path: '/distribution' },
    { title: 'Retail Points', count: stats.counts?.Retail || 0, growth: stats.growth?.Retail || 0, icon: Store, color: 'text-pink-400', bg: 'bg-pink-400/10', path: '/retail' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System Overview</h2>
          <p className="text-slate-400">Real-time status of the petroleum supply chain</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 group hover:border-teal-500/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.growth >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {card.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{card.growth >= 0 ? '+' : ''}{card.growth}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold text-white">
                  {loading ? '...' : card.count}
                </h3>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity className="w-3 h-3" />
                  <span>Active node</span>
                </div>
                <Link to={card.path}>
                  <Button variant="ghost" className="text-xs py-1 px-2 h-auto">
                    Manage <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Inventory Status
            </h3>
            <span className="text-xs text-slate-500">Updated 5m ago</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {loading ? (
              <p className="text-slate-500 text-center py-8 col-span-2">Loading inventory...</p>
            ) : (
              (stats.inventory || []).map((item: any) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <span className="text-white font-bold">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const CrudePurchasePage = () => (
  <DataPage 
    title="Crude Purchase"
    description="Track and verify incoming crude oil shipments"
    endpoint="/crude_purchase"
    idField="Purchase_ID"
    icon={Droplets}
    workflowStage="crude"
    prefix="C"
    fields={[
      { name: 'Purchase_ID', label: 'Purchase ID', type: 'text' },
      { name: 'Volume', label: 'Volume (BBL)', type: 'number' },
      { name: 'Price', label: 'Price ($)', type: 'number' },
      { name: 'Grade', label: 'Grade', type: 'select', options: ['A', 'B', 'C'] },
      { name: 'Purchased_Date', label: 'Date', type: 'date' },
    ]}
  />
);

const TransportationPage = () => {
  const renderStats = (data: any[]) => {
    const roadCount = data.filter(item => item.Route_Type === 'Road').length;
    const railCount = data.filter(item => item.Route_Type === 'Rail').length;
    const shipCount = data.filter(item => item.Route_Type === 'Ship').length;

    const stats = [
      { label: 'Road Logistics', count: roadCount, icon: Truck, color: 'text-amber-400', bg: 'bg-amber-400/10' },
      { label: 'Rail Freight', count: railCount, icon: Train, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      { label: 'Ocean Vessel', count: shipCount, icon: Ship, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.count} <span className="text-xs text-slate-500 font-normal ml-1">Batches</span></h3>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <DataPage 
      title="Transportation Log"
      description="Track vehicle movements and route types Across the Global Supply Chain"
      endpoint="/transportation_log"
      idField="Transit_ID"
      icon={Truck}
      workflowStage="transport"
      prefix="T"
      prevPrefix="C"
      prevIdField="Purchase_ID"
      renderExtra={renderStats}
      fields={[
        { name: 'Transit_ID', label: 'Transit ID', type: 'text' },
        { name: 'Vehicle_ID', label: 'Vehicle ID', type: 'text', prefix: 'V' },
        { name: 'Driver_ID', label: 'Driver ID', type: 'text', prefix: 'D' },
        { name: 'Quantity', label: 'Quantity', type: 'number' },
        { name: 'Route_Type', label: 'Route Type', type: 'select', options: ['Ship', 'Rail', 'Road'] },
        { name: 'Departure_Time', label: 'Departure', type: 'datetime-local' },
        { name: 'Arrival_Time', label: 'Arrival', type: 'datetime-local' },
        { name: 'Fuel_Quality', label: 'Fuel Quality', type: 'select', options: ['Premium-100', 'Standard-95', 'Regular-91', 'Diesel-D1', 'Eco-Fuel'] },
        { name: 'Purchase_ID', label: 'Purchase ID', type: 'text' },
      ]}
    />
  );
};

const StoragePage = () => (
  <DataPage 
    title="Storage Batches"
    description="Manage crude oil inventory and tank capacities"
    endpoint="/storage_batch"
    idField="Batch_ID"
    icon={Database}
    workflowStage="storage"
    prefix="S"
    prevPrefix="T"
    prevIdField="Transit_ID"
    fields={[
      { name: 'Batch_ID', label: 'Batch ID', type: 'text' },
      { name: 'Tank_Number', label: 'Tank No.', type: 'number' },
      { name: 'Current_Capacity', label: 'Current Capacity', type: 'number' },
      { name: 'Threshold', label: 'Reorder Threshold', type: 'number', readOnly: true },
      { name: 'Last_Inspection_Date', label: 'Last Insp.', type: 'date' },
      { name: 'Transit_ID', label: 'Transit ID', type: 'text' },
    ]}
  />
);

const RefiningPage = () => (
  <DataPage 
    title="Refining Processes"
    description="Monitor crude-to-petrol conversion metrics"
    endpoint="/refining_process"
    idField="Refine_ID"
    icon={Factory}
    workflowStage="refining"
    prefix="R"
    prevPrefix="S"
    prevIdField="Batch_ID"
    fields={[
      { name: 'Refine_ID', label: 'Refine ID', type: 'text' },
      { name: 'Input_Volume', label: 'Input Vol', type: 'number' },
      { name: 'Output_Volume', label: 'Output Vol', type: 'number' },
      { name: 'Refining_Date', label: 'Date', type: 'date' },
      { name: 'Additive_Chemical_Fingerprint', label: 'Additive Chemical Fingerprint', type: 'text' },
      { name: 'Batch_ID', label: 'Batch ID', type: 'text' },
    ]}
  />
);

const DistributionPage = () => (
  <DataPage 
    title="Distribution"
    description="Manage dispatch volumes and quality metrics"
    endpoint="/distribution"
    idField="Distribution_ID"
    icon={Share2}
    workflowStage="distribution"
    prefix="D"
    prevPrefix="R"
    prevIdField="Refine_ID"
    fields={[
      { name: 'Distribution_ID', label: 'Dist. ID', type: 'text' },
      { name: 'Dispatch_Volume', label: 'Dispatch Vol', type: 'number' },
      { name: 'Delivery_Status', label: 'Status', type: 'select', options: ['P(Pending)', 'D(Departed)', 'T(Transit)', 'C(Completed)'] },
      { name: 'Adulteration_Test_Result', label: 'Test Result', type: 'text' },
      { name: 'Final_Consumer_Hash', label: 'Consumer Hash', type: 'text' },
      { name: 'Refine_ID', label: 'Refine ID', type: 'text' },
    ]}
  />
);

const RetailPage = () => (
  <DataPage 
    title="Retail Management"
    description="Monitor station inventory and delivery status"
    endpoint="/retail"
    idField="Retail_ID"
    icon={Store}
    workflowStage="retail"
    prefix="RT"
    prevPrefix="D"
    prevIdField="Distribution_ID"
    fields={[
      { name: 'Retail_ID', label: 'Retail ID', type: 'text' },
      { name: 'Station_ID', label: 'Station ID', type: 'text' },
      { name: 'Receive_Volume', label: 'Receive Vol', type: 'number' },
      { name: 'Storage_Tank_Condition', label: 'Tank Cond.', type: 'select', options: ['1(Poor)', '2(Fair)', '3(Good)', '4(Very Good)', '5(Excellent)'] },
      { name: 'Distribution_ID', label: 'Dist. ID', type: 'text' },
    ]}
  />
);

const EmissionsPage = () => {
  const [batchId, setBatchId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStage, setSelectedStage] = useState<any>(null);

  const fetchReport = async () => {
    if (!batchId) return;
    setLoading(true);
    setError('');
    setSelectedStage(null);
    try {
      const res = await api.get(`/compliance/${batchId.toUpperCase()}`);
      setReport(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'LCA calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stageName: string) => {
    switch (stageName) {
      case 'Crude Purchase': return Droplets;
      case 'Transportation': return Truck;
      case 'Storage': return Database;
      case 'Refining': return Factory;
      case 'Distribution': return Share2;
      case 'Retail Point': return Store;
      default: return Activity;
    }
  };

  const stageToKey: Record<string, string> = {
    'Crude Purchase': 'crude',
    'Transportation': 'transport',
    'Storage': 'storage',
    'Refining': 'refining',
    'Distribution': 'distribution',
    'Retail Point': 'retail'
  };

  const handleExportLCA = () => {
    if (!report) return;
    const headers = ['Stage', 'Calculation Formula', 'Emission Value (kg)', 'Percentage (%)', 'Inputs Verified'];
    
    const formulaMap: Record<string, string> = {
      'Crude Purchase': 'Volume * 1.5 (Extraction Factor)',
      'Transportation': '(Distance * Weight * 0.1) / 1000 (Freight Factor)',
      'Storage': 'Volume * Days * 0.02 (Utility Factor)',
      'Refining': 'Throughput * 2.5 (Processing Factor)',
      'Distribution': 'Radius * 0.5 (Logistics Factor)',
      'Retail Point': 'Volume * 0.1 (Retail Factor)'
    };

    const rows = report.breakdown.map((s: any) => {
      const stageKey = stageToKey[s.stage];
      const inputs = report.stages[stageKey] 
        ? Object.entries(report.stages[stageKey]).map(([k, v]) => `${k}:${v}`).join(' | ') 
        : 'N/A';
      return [
        s.stage, 
        `"${formulaMap[s.stage] || 'Custom Process'}"`,
        (s.value || 0).toFixed(2), 
        (s.percentage || 0).toFixed(2), 
        `"${inputs}"`
      ].join(',');
    });
    
    // Add Metadata & Protocols
    const finalRows = [
      'LCA AUDIT REPORT & METHODOLOGY',
      `ID,${batchId || 'N/A'}`,
      `Date,${new Date().toISOString()}`,
      '',
      headers.join(','),
      ...rows,
      '',
      'SUMMARY ANALYSIS',
      `Total Lifecycle Emissions,${(report.totalEmissions || 0).toFixed(2)},kg CO2 eq`,
      `Carbon Intensity,${(report.carbonIntensity || 0).toFixed(4)},kg CO2 per Volume`,
      `Critical Hotspot,${report.hotspot.stage},Impact: ${(report.hotspot.percentage || 0).toFixed(2)}%`,
      '',
      'METHODOLOGY & PROTOCOLS REFERENCED',
      'Protocol Standard,"ISO 14064-1:2018 (Inventory Quantification)"',
      'Computation Methodology,"IPCC 2006 Guidelines for National Greenhouse Gas Inventories"',
      'LCA Framework,"Cradle-to-Retail Point Process Analysis"',
      'Uncretainty Level,±5% (Based on verified inputs)',
      'Verification Status,System Validated'
    ];
    
    const csvContent = `data:text/csv;charset=utf-8,${finalRows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LCA_Audit_${batchId || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Leaf className="w-8 h-8 text-teal-400" />
            CO2 Emissions & LCA Audit
          </h2>
          <p className="text-slate-400">Lifecycle emission calculations and process-based analysis</p>
        </div>
      </div>

      <Card className="p-8 bg-slate-900 border-slate-800">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Enter Record ID for LCA Calculation</label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input 
              placeholder="Enter ID (e.g., C101, T2001, S1001, RT5001)" 
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              className="pl-12 h-14 text-lg font-mono tracking-wider bg-slate-950 border-slate-800"
            />
          </div>
          <Button 
            onClick={fetchReport} 
            disabled={loading} 
            className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white font-bold"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Calculate Emissions'}
          </Button>
        </div>
      </Card>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className="p-8 border-slate-800">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-xl font-bold text-white">Supply Chain Lifecycle Visualization</h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> <span className="text-[10px] uppercase font-bold text-slate-500">Emission Hotspot</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500" /> <span className="text-[10px] uppercase font-bold text-slate-500">Live Stage</span></div>
                </div>
              </div>

              <div className="relative py-12 px-8">
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-[24px] hidden md:block" />
                <div className="grid grid-cols-2 md:flex md:justify-between items-center relative z-10 gap-x-4 gap-y-12">
                  {report.breakdown.map((s: any, idx: number) => {
                    const Icon = getStageIcon(s.stage);
                    const isHotspot = s.stage === report.hotspot.stage;
                    const isSelected = selectedStage?.stage === s.stage;
                    
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedStage(s)}
                        className="flex flex-col items-center gap-4 cursor-pointer group"
                      >
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 transition-all duration-300
                          ${isHotspot ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-slate-800 bg-slate-900'}
                          ${isSelected ? 'border-teal-400 bg-teal-500/10 scale-110' : 'hover:border-slate-600'}
                        `}>
                          <Icon className={`w-9 h-9 ${isHotspot ? 'text-red-400' : isSelected ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{s.stage}</p>
                          <p className={`text-xs font-bold ${isHotspot ? 'text-red-400' : 'text-teal-500'}`}>
                            {(s.value || 0).toFixed(1)} <span className="text-[10px] font-normal opacity-60">kg</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedStage ? (
                  <motion.div
                    key={selectedStage.stage}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-12 overflow-hidden"
                  >
                    <div className="p-8 bg-slate-950/50 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl bg-teal-500/10 text-teal-400`}>
                            {React.createElement(getStageIcon(selectedStage.stage), { className: 'w-6 h-6' })}
                          </div>
                          <h4 className="text-xl font-bold text-white tracking-tight">{selectedStage.stage}</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Audit trail analysis for this node calculates emissions using the process-blueprints and verified input metrics.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stage Impact</p>
                          <p className="text-xl font-black text-white">{(selectedStage.value || 0).toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg CO2</span></p>
                        </div>
                        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contribution</p>
                          <p className="text-xl font-black text-teal-500">{(selectedStage.percentage || 0).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-3">Inventory Verification</p>
                        <div className="space-y-2">
                           {report.stages[stageToKey[selectedStage.stage]] ? (
                             Object.entries(report.stages[stageToKey[selectedStage.stage]]).slice(0, 4).map(([k, v]: [string, any]) => (
                               <div key={k} className="flex justify-between text-[10px]">
                                 <span className="text-slate-500 uppercase tracking-tight">{k.replace(/_/g, ' ')}</span>
                                 <span className="text-slate-300 font-mono font-bold">{v || '---'}</span>
                               </div>
                             ))
                           ) : <p className="text-[9px] text-slate-600 italic">No inventory markers present.</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="mt-12 text-center py-10 border border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Select a lifecycle stage to view data</p>
                  </div>
                )}
              </AnimatePresence>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="p-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-wider">
                    <Flame className="w-5 h-5 text-red-500" />
                    Critical Hotspot
                  </h3>
                  <div className="flex items-center gap-6 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
                    <div className="p-4 bg-red-500/20 rounded-2xl text-red-500">
                      <Target className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{report.hotspot.stage}</h4>
                      <p className="text-xs text-slate-500 mt-1">This node contributes {(report?.hotspot?.percentage || 0).toFixed(1)}% of the total carbon debt.</p>
                    </div>
                  </div>
               </Card>

               <Card className="p-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-wider">
                    <Target className="w-5 h-5 text-teal-500" />
                    Carbon Intensity
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-black text-white">{(report?.carbonIntensity || 0).toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">kg CO2 per Volume Unit</p>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${report.complianceStatus === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {report.complianceStatus}
                      </div>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full border border-slate-700 overflow-hidden p-1">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${(report?.carbonIntensity || 0) < 1.0 ? 'bg-emerald-500' : (report?.carbonIntensity || 0) < 2.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(((report?.carbonIntensity || 0) / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
               </Card>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-950 border-teal-500/20">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 border-b border-slate-800 pb-4">Audit Summary</h4>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total CO2 Depth</p>
                  <p className="text-3xl font-black text-white">{(report?.totalEmissions || 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Assessment Type</p>
                  <p className="text-sm font-bold text-slate-300">Simplified Process-based LCA</p>
                  <p className="text-[10px] text-slate-600 mt-1 tracking-tighter">{report.lcaReport.methodology}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">System Boundary</p>
                  <p className="text-sm font-bold text-slate-300">Cradle-to-Retail Point</p>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-[10px] font-black uppercase tracking-widest border-slate-800 hover:bg-slate-800"
                    onClick={handleExportLCA}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download LCA.csv
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-8 space-y-6 bg-slate-900/50">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">Protocol Check</h4>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-teal-500" />
                    <span>ISO 14064-1 Audited</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-teal-500" />
                    <span>Calculated via Verified Formulae</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-teal-500" />
                    <span>Blockchain Ledger Verified</span>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const ProvenancePage = () => {
  const [searchId, setSearchId] = useState('');
  const [provenance, setProvenance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const userRole = localStorage.getItem('role') || 'USER';

  const stages = [
    { value: 'crude', label: 'Crude Source', prefix: 'C', icon: Droplets, color: 'from-blue-500 to-blue-600' },
    { value: 'transport', label: 'Transportation', prefix: 'T', icon: Truck, color: 'from-amber-500 to-amber-600' },
    { value: 'storage', label: 'Storage Batch', prefix: 'S', icon: Database, color: 'from-teal-500 to-teal-600' },
    { value: 'refining', label: 'Refining Process', prefix: 'R', icon: Factory, color: 'from-purple-500 to-purple-600' },
    { value: 'distribution', label: 'Distribution', prefix: 'D', icon: Share2, color: 'from-emerald-500 to-emerald-600' },
    { value: 'retail', label: 'Retail Point', prefix: 'RT', icon: Store, color: 'from-pink-500 to-pink-600' },
  ];

  const roleStageLimit: Record<string, number> = {
    'CRUDE_MANAGER': 0,
    'TRANSPORT_MANAGER': 1,
    'STORAGE_MANAGER': 2,
    'REFINING_MANAGER': 3,
    'DISTRIBUTION_MANAGER': 4,
    'RETAIL_MANAGER': 5,
    'ENVIRONMENT_MANAGER': 5,
    'ADMIN': 5
  };

  const roleToStage: Record<string, string> = {
    'CRUDE_MANAGER': 'crude',
    'TRANSPORT_MANAGER': 'transport',
    'STORAGE_MANAGER': 'storage',
    'REFINING_MANAGER': 'refining',
    'DISTRIBUTION_MANAGER': 'distribution',
    'RETAIL_MANAGER': 'retail'
  };

  const resolveTypeFromId = (id: string) => {
    const ucId = id.toUpperCase();
    if (ucId.startsWith('RT')) return 'retail';
    if (ucId.startsWith('C')) return 'crude';
    if (ucId.startsWith('T')) return 'transport';
    if (ucId.startsWith('S')) return 'storage';
    if (ucId.startsWith('R')) return 'refining';
    if (ucId.startsWith('D')) return 'distribution';
    return 'retail';
  };

  const fetchProvenance = async () => {
    if (!searchId) return;
    setLoading(true);
    setError(null);
    setProvenance(null);
    setSelectedStage(null);
    try {
      const stageType = resolveTypeFromId(searchId);
      const res = await api.get(`/provenance/${stageType}/${searchId.toUpperCase()}`);
      if (!res.data || Object.values(res.data).every(v => v === null)) {
        setError('No journey data found for this ID');
      } else {
        setProvenance(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Record not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Global Provenance</h2>
          <p className="text-slate-400 mt-1">Unified blockchain ledger for verifying petroleum life-cycles</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">End-to-End Tracing</span>
        </div>
      </div>

      <div className="bg-slate-900/40 p-1 border border-slate-800 rounded-2xl flex max-w-2xl">
        <div className="flex-1 flex items-center px-4 gap-3">
          <Search className="w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Enter Record ID (e.g., C1001, RT5001)..." 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProvenance()}
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 py-4 font-mono text-sm"
          />
        </div>
        <Button 
          onClick={fetchProvenance} 
          disabled={loading} 
          className="bg-teal-600 hover:bg-teal-500 text-white px-8 rounded-xl h-auto"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Tracing...</span>
            </div>
          ) : 'Verify Chain'}
        </Button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 max-w-2xl"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      {provenance && (
        <div className="space-y-12">
          {/* Improved Pipeline Visualisation */}
          <div className="relative bg-slate-950 p-12 lg:p-16 rounded-[3rem] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-x-auto">
            <div className="min-w-[1000px] relative flex justify-between items-center px-16">
              {/* Technical Grid Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(circle, #2dd4bf 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

              {/* Pipeline Tube - EVEN THINNER */}
              <div className="absolute left-16 right-16 h-[2px] bg-slate-800 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
                {/* Main Progress Flow */}
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(stages.filter((_, idx) => (roleStageLimit[userRole] ?? -1) >= idx).length / stages.length) * 100}%` }}
                   transition={{ duration: 2, ease: "circOut" }}
                   className="h-full bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,1)]"
                />
              </div>

              {stages.filter((_, idx) => {
                const limit = roleStageLimit[userRole] ?? -1;
                return idx <= limit;
              }).map((step, idx) => {
                const isManagerStage = roleToStage[userRole] === step.value;
                const hasData = !!provenance[step.value];
                const isCurrentType = resolveTypeFromId(searchId) === step.value;
                
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200 }}
                    className="relative z-10 flex flex-col items-center group/node"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (hasData) {
                          setSelectedStage(selectedStage === step.value ? null : step.value);
                          setTimeout(() => {
                            const el = document.getElementById(`details-${step.value}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                          }, 100);
                        }
                      }}
                      className={cn(
                        "relative w-14 h-14 rounded-full flex flex-col items-center justify-center border transition-all duration-300 cursor-pointer shadow-2xl overflow-visible",
                        hasData ? "bg-slate-900 border-teal-500/50 hover:border-teal-300" : "bg-slate-950 border-slate-800 opacity-20 grayscale",
                        selectedStage === step.value && "border-teal-200 ring-4 ring-teal-400/20 shadow-[0_0_40px_rgba(45,212,191,0.5)]",
                        isCurrentType && "border-blue-400"
                      )}
                    >
                      {/* Industrial Glow Effect */}
                      {hasData && (
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-teal-400/20 opacity-0 group-hover/node:opacity-100 transition-opacity blur-xl shadow-[0_0_20px_rgba(45,212,191,0.4)]"
                        />
                      )}
                      
                      <step.icon className={cn(
                        "w-5 h-5 transition-colors relative z-10",
                        selectedStage === step.value ? "text-teal-200" : hasData ? "text-teal-400 group-hover/node:text-teal-200" : "text-slate-600"
                      )} />

                      {/* Status Radar Search */}
                      {isCurrentType && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-ping" />
                      )}
                    </motion.div>

                    <div className="absolute -bottom-16 text-center w-32 pointer-events-none">
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                        selectedStage === step.value ? "text-teal-300 translate-y-1 scale-110" : hasData ? "text-slate-400 group-hover/node:text-teal-400" : "text-slate-700"
                      )}>
                         {step.label}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Technical Details Grid - Conditional Rendering */}
          <AnimatePresence mode="wait">
            {selectedStage && provenance[selectedStage] && (
              <motion.div 
                key={selectedStage}
                id={`details-${selectedStage}`}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="max-w-3xl mx-auto w-full"
              >
                {(() => {
                  const step = stages.find(s => s.value === selectedStage)!;
                  return (
                    <Card className="group relative overflow-hidden h-full border-teal-500/30 bg-slate-900/60 backdrop-blur-xl transition-all duration-500 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                      <div className="p-10">
                        <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-800">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(13,148,136,0.4)]">
                              <step.icon className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-[10px] font-mono text-teal-500 font-black uppercase tracking-[0.3em] mb-2">Verified Module Chain</p>
                              <h3 className="font-black text-white text-3xl tracking-tighter uppercase">{step.label}</h3>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedStage(null)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          {Object.entries(provenance[selectedStage]).map(([key, val]: [string, any]) => {
                            if (key.includes('Token') || key.includes('Hash')) return null;
                            return (
                              <div key={key} className="space-y-2">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                                  <ChevronRight className="w-3 h-3 text-teal-500" />
                                  {key.replace(/_/g, ' ')}
                                </p>
                                <div className="px-5 py-4 bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-teal-500/20 transition-colors">
                                  <p className={cn(
                                    "text-sm text-slate-200 font-medium",
                                    (typeof val === 'string' && val.match(/^[A-Z0-9_\-]+$/)) && "font-mono text-teal-400 text-xs"
                                  )}>
                                    {val || '---'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-12 p-6 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <ShieldCheck className="w-6 h-6 text-teal-400" />
                            <div>
                              <p className="text-xs text-white font-bold">Cryptographically Verified</p>
                              <p className="text-[10px] text-slate-500">This node has been validated by both Sender and Receiver signatures.</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-mono text-slate-600">BLOCK_HEIGHT_882</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const CorrectionSnapshotsPage = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [fetchingRecord, setFetchingRecord] = useState(false);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const res = await api.get('/snapshots');
        let data = Array.isArray(res.data) ? res.data : [];
        
        // Filter: Admin sees all, Managers see only their own snapshots
        const userRole = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        
        if (userRole !== 'ADMIN') {
          data = data.filter((s: any) => s.Triggered_By_Username === username);
        }
        
        setSnapshots(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshots();
  }, []);

  const handleSelectSnapshot = async (s: any) => {
    setSelectedSnapshot(s);
    setFetchingRecord(true);
    setCurrentRecord(null);
    try {
      // Use the new generic record getter
      const res = await api.get(`/record/${s.Table_Name}/${s.Record_ID}`);
      setCurrentRecord(res.data);
    } catch (err) {
      console.error('Failed to fetch existing record:', err);
    } finally {
      setFetchingRecord(false);
    }
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-800/50 pb-6">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">
          JSON Error Snapshots ({snapshots.length})
        </h2>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading system snapshots...</div>
        ) : snapshots.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic">No system integrity errors found.</div>
        ) : snapshots.map((s: any) => (
          <motion.div
            key={s.Snapshot_ID}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative bg-[#0B0F1A] border border-slate-800/50 rounded-lg overflow-hidden hover:bg-[#0E1424] transition-all"
          >
            {/* Red Accent Border */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
            
            <div className="p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {s.Table_Name} - <span className="text-slate-400 font-mono">{s.Record_ID}</span>
                </h3>
                
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-500 uppercase tracking-wide">
                    INSERT_ERROR: <span className="text-slate-400 font-normal lowercase ml-1">{s.Error_Description}</span>
                  </p>
                  
                  <button 
                    onClick={() => handleSelectSnapshot(s)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group/link"
                  >
                    <Play className="w-3 h-3 text-slate-500 fill-slate-500 group-hover/link:text-white group-hover/link:fill-white transition-all transform group-hover/link:translate-x-0.5" />
                    <span className="text-sm font-medium underline underline-offset-4 decoration-slate-800 hover:decoration-white">Compare with Database State</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 max-w-sm hidden md:block border-l border-slate-800 pl-6">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 text-left">Triggered By</p>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-100">{s.Triggered_By_Username || 'Unknown'}</p>
                    <p className="text-[10px] text-teal-500/80 font-mono uppercase tracking-tighter leading-none">{s.Triggered_By_Role || 'System'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-l border-slate-800 pl-6 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-slate-200 uppercase font-black tracking-widest leading-tight">
                    Audit Hashed
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    ID: {String(s.Snapshot_ID).slice(0, 8)}...
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {new Date(s.Timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedSnapshot && (
          <Modal 
            isOpen={!!selectedSnapshot} 
            onClose={() => setSelectedSnapshot(null)} 
            title={`Integrity Audit: ${selectedSnapshot.Record_ID}`}
            maxWidth="max-w-6xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Audit Actor</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="text-sm text-white font-bold leading-tight">{selectedSnapshot.Triggered_By_Username || 'System'}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">{selectedSnapshot.Triggered_By_Role || 'Process'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Source Table</p>
                  <p className="text-sm text-white font-bold">{selectedSnapshot.Table_Name}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Snapshot Trace</p>
                  <p className="text-sm text-white font-bold">{new Date(selectedSnapshot.Timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Constraint Violation</p>
                  <p className="text-sm text-slate-300 italic">{selectedSnapshot.Error_Description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Database State */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Database Record</p>
                    {fetchingRecord ? (
                       <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
                    ) : currentRecord ? (
                       <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                       <X className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 min-h-[300px] flex flex-col">
                    {fetchingRecord ? (
                      <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm">Querying database...</div>
                    ) : currentRecord ? (
                      <div className="space-y-4">
                        {Object.entries(currentRecord).map(([key, value]: any) => (
                          <div key={key} className="flex justify-between border-b border-slate-900 pb-2">
                            <span className="text-[11px] text-slate-500 font-mono">{key}</span>
                            <span className="text-[11px] text-emerald-400 font-bold font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <Archive className="w-10 h-10 text-slate-800" />
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500 font-medium">Record Not Found</p>
                          <p className="text-[10px] text-slate-600 italic">This ID does not exist in the {selectedSnapshot.Table_Name} table.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Wrong Input Data */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Wrong Data Inputted (Snapshot)</p>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-red-500/10 min-h-[300px]">
                    <div className="space-y-4">
                      {(() => {
                        try {
                          const wrongData = JSON.parse(selectedSnapshot.JSON_Snapshot);
                          return Object.entries(wrongData).map(([key, value]: any) => {
                            const isDifferent = currentRecord && currentRecord[key] !== value;
                            return (
                              <div key={key} className={cn(
                                "flex justify-between border-b border-slate-900 pb-2",
                                isDifferent && "bg-red-500/5 -mx-2 px-2 border-red-500/20"
                              )}>
                                <span className={cn("text-[11px] font-mono", isDifferent ? "text-red-400" : "text-slate-500")}>{key}</span>
                                <span className={cn("text-[11px] font-bold font-mono", isDifferent ? "text-red-400" : "text-slate-300")}>{String(value)}</span>
                              </div>
                            );
                          });
                        } catch (e) {
                          return <div className="text-red-400 text-xs italic">JSON Parsing Error</div>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const TrustScoresPage = () => {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('ALL');

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get('/trust-scores');
        setScores(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const roles = [
    { value: 'ALL', label: 'All Stakeholders' },
    { value: 'CRUDE_MANAGER', label: 'Crude Managers' },
    { value: 'TRANSPORT_MANAGER', label: 'Transport Managers' },
    { value: 'STORAGE_MANAGER', label: 'Storage Managers' },
    { value: 'REFINING_MANAGER', label: 'Refining Managers' },
    { value: 'DISTRIBUTION_MANAGER', label: 'Distribution Managers' },
    { value: 'RETAIL_MANAGER', label: 'Retail Managers' },
    { value: 'ENVIRONMENT_MANAGER', label: 'Environment Managers' },
    { value: 'ADMIN', label: 'Administrators' },
  ];

  const filteredScores = selectedRole === 'ALL' 
    ? scores 
    : scores.filter(s => s.role === selectedRole);

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-6">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-teal-400" />
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Trust Score Index</h2>
            <p className="text-slate-400 text-sm">Integrity metrics based on historical transaction reliability.</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-slate-500" />
          </div>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 pr-4 py-2.5 outline-none transition-all hover:bg-slate-800"
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 italic">Calculating system intelligence...</div>
        ) : filteredScores.length === 0 ? (
          <div className="col-span-full py-24 text-center">
            <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800">
              <Users className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-slate-500 italic">No stakeholders found for this category.</p>
          </div>
        ) : filteredScores.map((s: any) => (
          <Card key={s.username} className="p-6 border-slate-800 bg-[#0B0F1A] relative overflow-hidden group">
            {/* Background Glow */}
            <div className={cn(
              "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] transition-all duration-500 opacity-20",
              s.score >= 90 ? "bg-emerald-500" : s.score >= 70 ? "bg-yellow-500" : "bg-red-500"
            )} />
            
            <div className="relative space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold shadow-2xl">
                    {s.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{s.username}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{s.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest leading-none",
                  s.score >= 90 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : s.score >= 70 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                  {s.score >= 90 ? 'High Trust' : s.score >= 70 ? 'Warning' : 'Critical'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Reputation Score</span>
                  <span className="text-xl font-bold text-white">{s.score}%</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      s.score >= 90 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : s.score >= 70 ? "bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Valid Blocks</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">{s.success}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Poisoned Data</p>
                  <p className="text-base font-bold text-red-400 font-mono">{s.failed}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AlertHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Archive className="w-8 h-8 text-teal-400" />
            Alert History
          </h2>
          <p className="text-slate-400">Audit trail of acknowledged and resolved system warnings</p>
        </div>
        <Button variant="outline" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Message</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Occurred At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No alert history found.</td></tr>
            ) : history.map((a: any) => (
              <tr key={a.Alert_ID} className="hover:bg-slate-900/40 group">
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                    a.Type === 'CRITICAL_STOCK' 
                      ? 'text-red-400 border-red-500/20 bg-red-500/5' 
                      : 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                  }`}>
                    {a.Type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                  {a.Message}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-[10px] text-teal-400 font-bold uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    {a.Status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                  {new Date(a.Created_At).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const TrustScorePage = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get('/transporters/scores');
        setScores(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-yellow-400" />
          Transporter Trust Index
        </h2>
        <p className="text-slate-400">Decentralized performance scoring based on quality, integrity, and verified delivery chain</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center text-slate-500 py-12">Calculating trust scores...</p>
        ) : (Array.isArray(scores) ? scores : []).length === 0 ? (
          <p className="col-span-full text-center text-slate-500 py-12 italic">No transport data available for scoring yet.</p>
        ) : (Array.isArray(scores) ? scores : []).map((s: any) => (
          <motion.div key={s.id} whileHover={{ y: -5 }}>
            <Card className="p-6 h-full flex flex-col justify-between border-slate-800/80 hover:border-teal-500/30">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 shadow-inner">
                    <Truck className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Trust Score</p>
                    <p className="text-2xl font-black text-white">{s.rating}<span className="text-slate-600 text-sm ml-1">/100</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-lg font-mono">{s.id}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3 h-3 ${star <= (s.rating / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-700'}`} 
                      />
                    ))}
                    <span className="text-[10px] text-slate-500 font-bold ml-2">VERIFIED</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-500">Delivery Integrity</span>
                      <span className="text-teal-400">{s.integrity}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.integrity}%` }} className="h-full bg-teal-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-500">Fuel Quality Index</span>
                      <span className="text-blue-400">{s.quality}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.quality}%` }} className="h-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                  s.rating > 85 ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'
                }`}>
                  {s.rating > 85 ? 'Premium Node' : 'Verified Node'}
                </span>
                <Link to="/provenance">
                  <Button variant="ghost" className="p-0 hover:bg-transparent text-teal-400">
                    <Activity className="w-4 h-4 mr-2" />
                    Audit Logs
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<any>({ stockAlerts: [], storageAlerts: [] });

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll for alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.put(`/alerts/${id}/acknowledge`);
      // Update local state immediately for snappy UI
      setAlerts((prev: any) => ({
        stockAlerts: prev.stockAlerts.filter((a: any) => a.Alert_ID !== id),
        storageAlerts: prev.storageAlerts.filter((a: any) => a.Alert_ID !== id),
      }));
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={useLocation().pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="p-8 border-t border-slate-900 text-center text-slate-600 text-sm">
          &copy; 2026 Petroleum Chain Integrity System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/crude" element={
          <ProtectedRoute>
            <MainLayout><CrudePurchasePage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/transport" element={
          <ProtectedRoute>
            <MainLayout><TransportationPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/storage" element={
          <ProtectedRoute>
            <MainLayout><StoragePage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/refining" element={
          <ProtectedRoute>
            <MainLayout><RefiningPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/distribution" element={
          <ProtectedRoute>
            <MainLayout><DistributionPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/retail" element={
          <ProtectedRoute>
            <MainLayout><RetailPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/emissions" element={
          <ProtectedRoute>
            <MainLayout><EmissionsPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/provenance" element={
          <ProtectedRoute>
            <MainLayout><ProvenancePage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/snapshots" element={
          <ProtectedRoute>
            <MainLayout><CorrectionSnapshotsPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/alerts/history" element={
          <ProtectedRoute>
            <MainLayout><AlertHistoryPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/scores" element={
          <ProtectedRoute>
            <MainLayout><TrustScoresPage /></MainLayout>
          </ProtectedRoute>
        } />
        {/* Placeholder for other pages */}
        <Route path="*" element={
          <ProtectedRoute>
            <MainLayout>
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                  <Activity className="w-10 h-10 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Module Under Construction</h2>
                <p className="text-slate-400 mt-2">This supply chain stage is currently being integrated into the ledger.</p>
                <Link to="/" className="mt-6">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
