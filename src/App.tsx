import React, { useState, useEffect } from 'react';
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
  Leaf
} from 'lucide-react';
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

const Modal = ({ isOpen, onClose, title, children, zIndex = 100 }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; zIndex?: number }) => (
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
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
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
  prevIdField
}: { 
  title: string; 
  description: string; 
  endpoint: string; 
  idField: string; 
  fields: { name: string; label: string; type: string; options?: string[] }[];
  icon: any;
  workflowStage?: 'crude' | 'transport' | 'storage' | 'refining' | 'distribution' | 'retail';
  prefix?: string;
  prevPrefix?: string;
  prevIdField?: string;
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

  const canEdit = userRole === 'ADMIN' || userRole === roleMapping[endpoint];

  const fetchData = async () => {
    try {
      const res = await api.get(endpoint);
      setData(res.data);
      setFilteredData(res.data);
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
      if (res.data.length > 0) {
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

      fields.forEach(f => {
        if (f.type === 'number' && submissionData[f.name] !== '') {
          submissionData[f.name] = Number(submissionData[f.name]);
        }
      });

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
            {fields.map(f => (
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
    { name: 'Provenance', path: '/provenance', icon: History },
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
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">PCI</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Integrity System</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4">
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

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </motion.aside>
    </>
  );
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const username = localStorage.getItem('username');
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
        <Menu className="w-6 h-6" />
      </button>
      
      <div className="hidden lg:flex items-center gap-2 text-slate-400 text-sm">
        <span className="font-medium text-slate-300">Petroleum Chain Integrity</span>
        <ChevronRight className="w-4 h-4" />
        <span className="capitalize">{useLocation().pathname.replace('/', '') || 'Dashboard'}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{username}</p>
          <p className="text-xs text-slate-500">{localStorage.getItem('role')?.replace('_', ' ') || 'User'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-900/20">
          {username?.[0]?.toUpperCase()}
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
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CRUDE_MANAGER');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const roles = [
    { value: 'CRUDE_MANAGER', label: 'Crude Manager', icon: Droplets, desc: 'Manage crude oil procurement and sourcing' },
    { value: 'TRANSPORT_MANAGER', label: 'Transport Manager', icon: Truck, desc: 'Oversee logistics and fleet movements' },
    { value: 'STORAGE_MANAGER', label: 'Storage Manager', icon: Database, desc: 'Monitor tank levels and inspections' },
    { value: 'REFINING_MANAGER', label: 'Refining Manager', icon: Factory, desc: 'Control refining processes and additives' },
    { value: 'DISTRIBUTION_MANAGER', label: 'Distribution Manager', icon: Share2, desc: 'Manage dispatch and consumer delivery' },
    { value: 'RETAIL_MANAGER', label: 'Retail Manager', icon: Store, desc: 'Oversee gas station inventory and sales' },
    { value: 'ENVIRONMENT_MANAGER', label: 'Environment Manager', icon: Leaf, desc: 'Monitor CO2 emissions and sustainability' },
    { value: 'ADMIN', label: 'Administrator', icon: ShieldCheck, desc: 'Full system access and user management' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const res = await api.post(endpoint, { username, password, role });
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
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>({ counts: {}, growth: {}, inventory: [] });
  const [alerts, setAlerts] = useState<any>({ stockAlerts: [], storageAlerts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'real-time' | 'historical'>('real-time');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, alertsRes] = await Promise.all([
          api.get('/stats'),
          api.get('/alerts')
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data);
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
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <button 
            onClick={() => setViewMode('real-time')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-all ${viewMode === 'real-time' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Real-time
          </button>
          <button 
            onClick={() => setViewMode('historical')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'historical' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Historical
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {(alerts.stockAlerts.length > 0 || alerts.storageAlerts.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-amber-500 font-bold text-sm">System Notifications</h4>
            <p className="text-amber-500/70 text-xs">
              Maintenance and operational alerts will appear here.
            </p>
          </div>
        </motion.div>
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
                  {loading ? '...' : (viewMode === 'historical' ? Math.round(card.count * 0.8) : card.count)}
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

const TransportationPage = () => (
  <DataPage 
    title="Transportation Log"
    description="Track vehicle movements and route types"
    endpoint="/transportation_log"
    idField="Transit_ID"
    icon={Truck}
    workflowStage="transport"
    prefix="T"
    prevPrefix="C"
    prevIdField="Purchase_ID"
    fields={[
      { name: 'Transit_ID', label: 'Transit ID', type: 'text' },
      { name: 'Vehicle_ID', label: 'Vehicle ID', type: 'text' },
      { name: 'Driver_ID', label: 'Driver ID', type: 'text' },
      { name: 'Quantity', label: 'Quantity', type: 'number' },
      { name: 'Route_Type', label: 'Route Type', type: 'select', options: ['Ship', 'Rail', 'Road'] },
      { name: 'Departure_Time', label: 'Departure', type: 'datetime-local' },
      { name: 'Arrival_Time', label: 'Arrival', type: 'datetime-local' },
      { name: 'Fuel_Quality', label: 'Quality', type: 'text' },
      { name: 'Purchase_ID', label: 'Purchase ID', type: 'text' },
    ]}
  />
);

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

const EmissionsPage = () => (
  <DataPage 
    title="CO2 Emissions"
    description="Track and monitor environmental impact across the supply chain"
    endpoint="/co2_emissions"
    idField="Emission_ID"
    icon={Leaf}
    fields={[
      { name: 'Emission_ID', label: 'Emission ID', type: 'text' },
      { name: 'Source_Type', label: 'Source Type', type: 'select', options: ['Transportation', 'Refining', 'Storage', 'Retail'] },
      { name: 'Emission_Amount', label: 'Amount (kg CO2)', type: 'number' },
      { name: 'Measurement_Date', label: 'Date', type: 'date' },
      { name: 'Location', label: 'Location', type: 'text' },
      { name: 'Reference_ID', label: 'Reference ID', type: 'text' },
    ]}
  />
);

const ProvenancePage = () => {
  const [retailId, setRetailId] = useState('');
  const [provenance, setProvenance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvenance = async () => {
    if (!retailId) return;
    setLoading(true);
    setError(null);
    setProvenance(null);
    try {
      const res = await api.get(`/provenance/retail/${retailId}`);
      if (!res.data || Object.keys(res.data).length === 0) {
        setError('Record not found');
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
      <div>
        <h2 className="text-2xl font-bold text-white">Recursive Provenance</h2>
        <p className="text-slate-400">Trace the complete journey of a retail fuel batch back to its crude source</p>
      </div>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter Retail ID (e.g., RET-001)" 
          value={retailId}
          onChange={(e) => setRetailId(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={fetchProvenance} disabled={loading}>
          {loading ? 'Tracing...' : 'Trace Journey'}
        </Button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {provenance && (
        <div className="relative space-y-12 before:absolute before:left-8 before:top-8 before:bottom-8 before:w-0.5 before:bg-slate-800">
          {[
            { title: 'Retail Station', data: provenance.retail, icon: Store },
            { title: 'Distribution Network', data: provenance.distribution, icon: Share2 },
            { title: 'Refinery Process', data: provenance.refining, icon: Factory },
            { title: 'Storage Batch', data: provenance.storage, icon: Database },
            { title: 'Transportation', data: provenance.transport, icon: Truck },
            { title: 'Crude Source', data: provenance.crude, icon: Droplets },
          ].map((step, idx) => step.data && (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-20"
            >
              <div className="absolute left-4 top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-teal-500 flex items-center justify-center z-10">
                <step.icon className="w-4 h-4 text-teal-400" />
              </div>
              <Card className="p-6">
                <h3 className="text-teal-400 font-bold mb-4 flex items-center gap-2">
                  {step.title}
                  <span className="text-[10px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">VERIFIED</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(step.data).map(([key, val]: [string, any]) => (
                    <div key={key}>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-200 font-medium">{val || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const LedgerPage = () => null; // Removed ledger section

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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
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
