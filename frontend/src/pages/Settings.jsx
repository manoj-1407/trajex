import { useState, useEffect } from 'react';
import { User, Building, Users, Bell, Shield, Plug, AlertTriangle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { ProfileSection } from '../components/ProfileSection';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Settings() {
  const { user, setAuth, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const isOwner = user?.role === 'owner';

  // API State
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [businessForm, setBusinessForm] = useState({ name: '', timezone: 'UTC' });
  const [webhookForm, setWebhookForm] = useState({ webhookUrl: '', webhookSecret: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [team, setTeam] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    Promise.all([
      api.get('/settings').catch(() => null),
      isOwner ? api.get('/riders').catch(() => null) : Promise.resolve(null)
    ]).then(([settingsRes, ridersRes]) => {
      if (settingsRes?.data) {
        setBusinessForm({ name: settingsRes.data.name || '', timezone: settingsRes.data.timezone || 'UTC' });
        setWebhookForm({ webhookUrl: settingsRes.data.webhookUrl || '', webhookSecret: settingsRes.data.webhookSecret || '' });
      }
      if (ridersRes?.data?.riders) {
        setTeam(ridersRes.data.riders);
      }
      setLoading(false);
    });
  }, [isOwner]);

  const saveProfile = async () => {
    try {
      const res = await api.patch('/auth/profile', profileForm);
      setAuth(useAuthStore.getState().token, res.data);
      toast.success('Profile updated');
    } catch(e) { toast.error('Failed to update profile'); }
  };

  const saveBusiness = async () => {
    try { await api.patch('/settings', businessForm); toast.success('Business settings saved'); }
    catch(e) { toast.error('Failed to save business settings'); }
  };

  const saveIntegrations = async () => {
    try { await api.patch('/settings', webhookForm); toast.success('Webhook saved'); }
    catch(e) { toast.error('Failed to save webhook URL'); }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully. Please log in again.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => logout(), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, show: true },
    { id: 'business', label: 'Business', icon: Building, show: true },
    { id: 'team', label: 'Team', icon: Users, show: isOwner },
    { id: 'notifications', label: 'Notifications', icon: Bell, show: true },
    { id: 'security', label: 'Security', icon: Shield, show: true },
    { id: 'integrations', label: 'Integrations', icon: Plug, show: isOwner },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, show: isOwner, danger: true },
  ].filter(t => t.show);

  // Danger zone deletion check
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // IANA Timezones #33
  const timezoneOptions = [
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'Europe/London', label: 'London/Lisbon' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time' },
    { value: 'Singapore', label: 'Singapore Standard Time' }
  ];

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Settings</h1>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }} className="flex-col-mobile">
        {/* Left Nav */}
        <div className="glass-card" style={{ flex: '0 0 220px', position: 'sticky', top: '80px', padding: '12px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '12px 16px', background: activeTab === t.id ? 'var(--accent-dim)' : 'transparent',
                color: activeTab === t.id ? (t.danger ? 'var(--danger)' : 'var(--accent-text)') : (t.danger ? 'var(--danger)' : 'var(--text-secondary)'),
                border: 'none', borderLeft: activeTab === t.id ? `3px solid ${t.danger ? 'var(--danger)' : 'var(--accent)'}` : '3px solid transparent',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                textAlign: 'left', fontSize: '14px', fontWeight: 500, transition: 'var(--transition-fast)'
              }}
              onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.color = 'var(--text-primary)'}}
              onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.color = (t.danger ? 'var(--danger)' : 'var(--text-secondary)')}}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minHeight: '400px' }}>
          
          {activeTab === 'profile' && (
            <div className="fade-in-up">
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Profile Settings</h2>
              <ProfileSection />
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                 <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                 <Button onClick={saveProfile}>Save Profile</Button>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="fade-in-up">
               <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Business Information</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                 <Input label="Business Name" value={businessForm.name} onChange={e => setBusinessForm({...businessForm, name: e.target.value})} disabled={loading} />
                 <Select label="Timezone" options={timezoneOptions} value={businessForm.timezone} onChange={v => setBusinessForm({...businessForm, timezone: v})} disabled={loading} />
                 
                 <Button onClick={saveBusiness} style={{ marginTop: '16px' }} loading={loading}>Save Information</Button>
               </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="fade-in-up">
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Team Members & Riders</h2>
                 <Button onClick={() => toast.success('Invite links copied to clipboard!')}>Invite Member</Button>
               </div>
               
               <div className="glass-card" style={{ overflow: 'hidden' }}>
                 <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                   <thead>
                     <tr style={{ borderBottom: '1px solid var(--border)' }}>
                       <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Member</th>
                       <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Role</th>
                       <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Joined</th>
                       <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{user?.name?.[0]?.toUpperCase()}</div>
                            <div>
                               <div style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name} (You)</div>
                               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}><Badge status="Owner" size="sm" /></td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Just now</td>
                        <td style={{ padding: '16px' }}></td>
                     </tr>
                     {team.map(r => (
                       <tr key={r.id}>
                         <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{r.name?.[0]?.toUpperCase()}</div>
                            <div>
                               <div style={{ fontSize: '14px', fontWeight: 500 }}>{r.name}</div>
                               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rider Account</div>
                            </div>
                          </div>
                         </td>
                         <td style={{ padding: '16px' }}><Badge status={r.status} size="sm" type="rider" /></td>
                         <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>-</td>
                         <td style={{ padding: '16px' }}><Button variant="danger" size="sm" onClick={() => toast.error('Action disabled')}>Remove</Button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="fade-in-up">
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Notification Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { title: 'Order status changes', subtitle: 'Get notified when an order moves to different stages' },
                  { title: 'SLA breach alerts', subtitle: 'Warnings when an order is running late' },
                  { title: 'Rider offline with active orders', subtitle: 'Alerts if an active rider disconnects' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.subtitle}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><input type="checkbox" defaultChecked /> Push</label>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><input type="checkbox" defaultChecked /> Email</label>
                    </div>
                  </div>
                ))}
              </div>
              <Button style={{ marginTop: '24px' }} onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="fade-in-up">
               <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Security</h2>
               <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                 <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Change Password</h3>
                 <Input 
                   label="Current Password" type="password" 
                   value={passwordForm.currentPassword} 
                   onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                 />
                 <Input 
                   label="New Password" type="password" 
                   value={passwordForm.newPassword} 
                   onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                 />
                 <Input 
                   label="Confirm New Password" type="password" 
                   value={passwordForm.confirmPassword} 
                   onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                 />
                 <Button onClick={handlePasswordChange} loading={submitting}>Update Password</Button>
               </div>

               <div className="glass-card flex-center" style={{ padding: '32px', textAlign: 'center', borderStyle: 'dashed' }}>
                  <Shield size={32} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>Two-factor authentication — Coming soon</div>
               </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="fade-in-up">
               <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Integrations</h2>
               <div className="glass-card" style={{ padding: '24px' }}>
                 <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Webhooks</h3>
                 <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   Subscribe to real-time events natively hosted on your dispatch backend.
                 </p>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
                   <Input 
                     label="Webhook URL" 
                     placeholder="https://..." 
                     value={webhookForm.webhookUrl || ''} 
                     onChange={e => setWebhookForm({...webhookForm, webhookUrl: e.target.value})} 
                   />
                   <Input 
                     label="Secret Key (Optional)" 
                     placeholder="secret" 
                     type="password"
                     value={webhookForm.webhookSecret || ''} 
                     onChange={e => setWebhookForm({...webhookForm, webhookSecret: e.target.value})} 
                   />
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked disabled /> order.created</label>
                      <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" defaultChecked disabled /> order.updated</label>
                   </div>
                   <div><Button onClick={saveIntegrations}>Save Webhook</Button></div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="fade-in-up">
               <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--danger)' }}>Danger Zone</h2>
               
               <div className="glass-card" style={{ border: '1px solid var(--danger)', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Workspace</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Once you delete a workspace, there is no going back. Please be certain. All orders, riders, and settings will be permanently erased.
                  </p>

                  <div style={{ maxWidth: '400px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>Type highly specific confirmation: <strong>TRAJEX-DELETE</strong></p>
                    <Input 
                      value={deleteConfirm} 
                      onChange={e => setDeleteConfirm(e.target.value)} 
                      placeholder="TRAJEX-DELETE"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px' }}>
                       <Button variant="danger" disabled={deleteConfirm !== 'TRAJEX-DELETE'} onClick={() => toast.error('Self-service deletion is disabled. Please contact support@trajex.com')}>
                         Delete Workspace
                       </Button>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
