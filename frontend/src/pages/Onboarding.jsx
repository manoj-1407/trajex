import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('trajex-onboarding-complete')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const finish = () => {
    localStorage.setItem('trajex-onboarding-complete', 'true');
    navigate('/dashboard');
  };

  const handleExit = () => {
    if (window.confirm('Skip onboarding and go to dashboard?')) finish();
  };

  const Step1 = () => (
    <div className="fade-in-up" style={{ textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <Sparkles size={40} />
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Welcome to Trajex</h1>
      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Here's a quick setup to get your first delivery running.</p>
      
      <div style={{ textAlign: 'left', background: 'var(--bg-elevated)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
        <div style={{ fontWeight: 600, marginBottom: '16px' }}>What you'll do:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Users size={20} color="var(--accent)" /> Add your first rider to the fleet</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Package size={20} color="var(--accent)" /> Create your first test order</div>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={() => setStep(2)}>Let's go →</Button>
    </div>
  );

  const Step2 = () => {
    const [form, setForm] = useState({ name: '', phone: '', email: '', vehicleType: 'bike' });
    
    const onSubmit = async (e) => {
      e.preventDefault();
      if (!form.name || !form.phone) return toast.error('Name and phone required');
      setLoading(true);
      try {
        const phone = form.phone.startsWith('+') ? form.phone : `+1${form.phone}`;
        await api.post('/riders', { ...form, phone });
        toast.success('Rider added!');
        setStep(3);
      } catch (err) {
        toast.error('Failed to add rider');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Add your first rider</h2>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <Input label="Rider Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={loading} autoFocus />
          <Input label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} disabled={loading} />
          <Input label="Email Address (Optional)" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={loading} />
          <Button type="submit" size="lg" loading={loading} fullWidth>Add Rider →</Button>
        </form>
        
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}>
            Skip for now
          </button>
        </div>
      </div>
    );
  };

  const Step3 = () => {
    const [form, setForm] = useState({ customerName: '', customerPhone: '', deliveryAddress: '', notes: '' });
    
    const onSubmit = async (e) => {
      e.preventDefault();
      if (!form.customerName || !form.deliveryAddress) return toast.error('Name and address required');
      setLoading(true);
      try {
        const phone = form.customerPhone.startsWith('+') ? form.customerPhone : `+1${form.customerPhone}`;
        await api.post('/orders', { 
          customerName: form.customerName,
          customerPhone: phone,
          dropAddress: form.deliveryAddress,
          pickupLat: 40.7128,  // NYC Base
          pickupLng: -74.0060,
          dropLat: 40.7200,
          dropLng: -74.0100
        });
        toast.success('Order created!');
        finish();
      } catch (err) {
        toast.error('Failed to create order');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Create your first order</h2>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <Input label="Customer Name" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} disabled={loading} autoFocus />
          <Input label="Delivery Address" value={form.deliveryAddress} onChange={e => setForm({...form, deliveryAddress: e.target.value})} disabled={loading} />
          <Input label="Customer Phone" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} disabled={loading} />
          <Button type="submit" size="lg" loading={loading} fullWidth>Create order & Finish</Button>
        </form>
        
        <div style={{ textAlign: 'center' }}>
          <button onClick={finish} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}>
            Skip for now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <button 
        onClick={handleExit}
        style={{ position: 'fixed', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
      >
        <X size={24} />
      </button>

      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
        <div style={{ background: 'var(--bg-elevated)', height: '4px', width: '100%' }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 300ms ease' }} />
        </div>
        
        <div style={{ padding: '48px 32px' }}>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </div>
      </div>
    </div>
  );
}
