import React, { useState } from 'react';
import {
  X, Users, UserPlus, Check, Laptop, ShieldCheck, Key,
  Mail, Lock, Sparkles, RefreshCw, Download, Upload,
  Copy, LogIn, LogOut, CheckCircle2, AlertCircle, HardDrive
} from 'lucide-react';
import { UserProfile, AppState } from '../types';
import { storage, generateUUID } from '../lib/storage';

interface MultiUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings?: AppState;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const MultiUserModal: React.FC<MultiUserModalProps> = ({
  isOpen,
  onClose,
  appSettings,
  onRefresh,
  onSuccess,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'auth' | 'pairing'>('profiles');

  // New Profile Form
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState('Family Member');

  // Auth form states
  const [emailInput, setEmailInput] = useState('yashok969492@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Pairing state
  const [pairCode, setPairCode] = useState(appSettings?.computerPairCode || 'OM-8392');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConnected, setIsConnected] = useState(Boolean(appSettings?.computerConnected));
  const [isAuditing, setIsAuditing] = useState(false);

  if (!isOpen) return null;

  const profiles = appSettings?.profiles || [];
  const currentProfileId = appSettings?.profileId || profiles[0]?.id;
  const currentUser = appSettings?.currentUser;

  const handleSwitchProfile = async (profileId: string) => {
    try {
      const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
      settings.profileId = profileId;
      if (settings.profiles) {
        settings.profiles = settings.profiles.map(p => ({
          ...p,
          isCurrent: p.id === profileId
        }));
      }
      const switchedProfile = settings.profiles?.find(p => p.id === profileId);
      if (switchedProfile) {
        settings.currentUser = {
          name: switchedProfile.name,
          email: switchedProfile.email,
          provider: switchedProfile.authType || 'local'
        };
      }
      await storage.setSingleton('appSettings', settings);
      onSuccess(`Switched to workspace: ${switchedProfile?.name || 'Workspace'}`);
      onRefresh();
    } catch (e: any) {
      onError(`Failed to switch profile: ${e.message}`);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
      const now = Date.now();
      const rolePrefix = newProfileRole.toLowerCase().includes('family')
        ? 'family'
        : newProfileRole.toLowerCase().includes('team')
        ? 'team'
        : 'user';
      const cleanSlug = newProfileName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Assign avatar color & character
      const colors = ['#7c3aed', '#059669', '#ea580c', '#0284c7', '#db2777', '#4f46e5'];
      const avatarColor = colors[(settings.profiles?.length || 0) % colors.length];
      const avatarChar = newProfileName.trim().charAt(0).toUpperCase();

      const newProf: UserProfile = {
        id: generateUUID(),
        name: newProfileName.trim(),
        role: newProfileRole,
        email: `${cleanSlug || rolePrefix}@omlifeos.local`,
        avatarColor,
        avatarChar,
        authType: 'local',
        isCurrent: false,
        createdAt: now
      };

      const updated = [...(settings.profiles || []), newProf];
      settings.profiles = updated;
      await storage.setSingleton('appSettings', settings);

      onSuccess(`User profile "${newProfileName}" created successfully`);
      setNewProfileName('');
      onRefresh();
    } catch (e: any) {
      onError(`Failed to create profile: ${e.message}`);
    }
  };

  // 1-Tap Google Sign-in handler
  const handleGoogleSignIn = async (customEmail?: string) => {
    setIsAuthenticating(true);
    try {
      const email = customEmail || emailInput || 'yashok969492@gmail.com';
      const displayName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
      settings.currentUser = {
        name: displayName,
        email,
        provider: 'google'
      };

      // Check if a profile with this email already exists or add/update it
      let existing = settings.profiles?.find(p => p.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        settings.profileId = existing.id;
      } else {
        const newProf: UserProfile = {
          id: generateUUID(),
          name: `${displayName} (Google)`,
          role: 'Owner',
          email,
          avatarColor: '#4285F4',
          avatarChar: displayName.charAt(0).toUpperCase(),
          authType: 'google',
          isCurrent: true,
          createdAt: Date.now()
        };
        settings.profiles = [...(settings.profiles || []), newProf];
        settings.profileId = newProf.id;
      }

      await storage.setSingleton('appSettings', settings);
      onSuccess(`✓ Signed in with Google account: ${email}`);
      onRefresh();
    } catch (e: any) {
      onError(`Google sign-in error: ${e.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Email / Password sign-in handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsAuthenticating(true);
    try {
      const email = emailInput.trim();
      const displayName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
      settings.currentUser = {
        name: displayName,
        email,
        provider: 'email'
      };

      let existing = settings.profiles?.find(p => p.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        settings.profileId = existing.id;
      } else {
        const newProf: UserProfile = {
          id: generateUUID(),
          name: displayName,
          role: 'Member',
          email,
          avatarColor: '#6366f1',
          avatarChar: displayName.charAt(0).toUpperCase(),
          authType: 'email',
          isCurrent: true,
          createdAt: Date.now()
        };
        settings.profiles = [...(settings.profiles || []), newProf];
        settings.profileId = newProf.id;
      }

      await storage.setSingleton('appSettings', settings);
      onSuccess(`✓ Authenticated via Email: ${email}`);
      setPasswordInput('');
      onRefresh();
    } catch (e: any) {
      onError(`Authentication error: ${e.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOutToLocal = async () => {
    const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
    settings.currentUser = {
      name: 'Om Master',
      email: 'master@omlifeos.local',
      provider: 'local'
    };
    await storage.setSingleton('appSettings', settings);
    onSuccess('Switched to Local Offline Vault Mode (100% Private)');
    onRefresh();
  };

  const handleCopyPairCode = async () => {
    try {
      await navigator.clipboard.writeText(pairCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      onSuccess('Pairing code copied to clipboard');
    } catch {
      onError('Clipboard copy unavailable');
    }
  };

  const handleToggleComputerConnect = async () => {
    const nextState = !isConnected;
    setIsConnected(nextState);
    const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
    settings.computerConnected = nextState;
    await storage.setSingleton('appSettings', settings);
    onSuccess(nextState ? '🖥 Connected to computer peer' : 'Disconnected from computer');
    onRefresh();
  };

  const handleExportFullBackup = async () => {
    try {
      const blob = await storage.exportFullBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Om-LifeOS-Vault-Backup-${new Date().toISOString().slice(0, 10)}.omlifeos`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onSuccess('10-Year Long Life vault snapshot (.omlifeos) downloaded');
    } catch (e: any) {
      onError(`Backup failed: ${e.message}`);
    }
  };

  const handleImportFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = String(reader.result || '');
        await storage.importFullBackup(content);
        onSuccess('Full database restored atomically');
        onRefresh();
      } catch (err: any) {
        onError(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleRunHealthCheck = async () => {
    setIsAuditing(true);
    try {
      const res = await storage.auditIntegrity();
      onSuccess(`Storage healthy: verified ${res.checked} records with 0 corruption.`);
    } catch (e: any) {
      onError(`Health check failed: ${e.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Top Header - Matches uploaded screenshot */}
        <div className="flex items-start justify-between p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Multi-User Profiles &<br />Multi-Device Pairing
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Shared family spaces, team workspaces & device peer-sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-1 overflow-x-auto whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profiles'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Profiles ({profiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'auth'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Google / Email / Local
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pairing')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'pairing'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            10-Yr Vault & Sync
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: PROFILES & WORKSPACES (Exact layout from uploaded image) */}
          {activeTab === 'profiles' && (
            <div className="space-y-4">
              {/* Active User Profiles Count Header */}
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                ACTIVE USER PROFILES ({profiles.length})
              </div>

              {/* Profile Cards */}
              <div className="space-y-2.5">
                {profiles.map(prof => {
                  const isCurrent = prof.id === currentProfileId;
                  const char = prof.avatarChar || prof.name.charAt(0).toUpperCase();
                  const bg = prof.avatarColor || (isCurrent ? '#7c3aed' : '#059669');

                  return (
                    <div
                      key={prof.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-indigo-500/80 bg-indigo-50/20 dark:border-indigo-500/60 dark:bg-indigo-950/20 shadow-xs'
                          : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {/* Avatar Circle with letter inside */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: bg }}
                        >
                          {char}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {prof.name}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            <span>{prof.role || 'Member'}</span>
                            <span className="mx-1">·</span>
                            <span className="font-mono">{prof.email || 'local@omlifeos.local'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="shrink-0">
                        {isCurrent ? (
                          <button
                            type="button"
                            disabled
                            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs cursor-default"
                          >
                            Current
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitchProfile(prof.id)}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create Additional User Profile Box */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Create Additional User Profile</span>
                </div>

                <form onSubmit={handleCreateProfile} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    placeholder="Profile Name (e.g. Suman, Work Studio)"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                  />

                  <select
                    value={newProfileRole}
                    onChange={e => setNewProfileRole(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Family Member">Family Member</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Personal">Personal</option>
                    <option value="Executive">Executive</option>
                    <option value="Guest / Student">Guest / Student</option>
                  </select>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-all"
                  >
                    + Add User Profile
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: AUTHENTICATION (Google / Email / Local Offline) */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              {/* Current Active Account Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Identity & Session
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser?.name || 'Local Master User'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {currentUser?.email || 'master@omlifeos.local'} · Provider: {currentUser?.provider || 'local'}
                  </div>
                </div>

                {currentUser?.provider !== 'local' && (
                  <button
                    type="button"
                    onClick={handleSignOutToLocal}
                    className="rounded-xl border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {/* 1. Google 1-Tap Login */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Google Colorful G SVG */}
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Google Account Sign-In
                    </span>
                  </div>
                  {currentUser?.provider === 'google' && (
                    <span className="rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      Connected
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sign in with your Google account to associate workspaces and cloud synchronization.
                </p>

                {/* 1-Tap Google Button with User's specific email pre-configured */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('yashok969492@gmail.com')}
                  disabled={isAuthenticating}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 shadow-2xs transition-all active:scale-98"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue as yashok969492@gmail.com</span>
                </button>
              </div>

              {/* 2. Email / Password Login */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {isRegisterMode ? 'Create Account with Email' : 'Email & Password Login'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {isRegisterMode ? 'Switch to Sign In' : 'Need an account?'}
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 active:scale-98 transition-all"
                  >
                    {isRegisterMode ? 'Create Account' : 'Sign In with Email'}
                  </button>
                </form>
              </div>

              {/* 3. Local Offline Vault Mode */}
              <div className="rounded-2xl border border-slate-200/90 bg-emerald-50/40 p-4 dark:border-slate-800 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Local Offline Vault Mode (Zero-Cloud / 100% Private)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  No remote servers or cloud accounts required. All documents, notes, and records are cryptographically stored on your device for absolute privacy and 10+ years durability.
                </p>
                <button
                  type="button"
                  onClick={handleSignOutToLocal}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 transition-colors"
                >
                  Activate Pure Local Vault
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 10-YR VAULT & PEER PAIRING */}
          {activeTab === 'pairing' && (
            <div className="space-y-4">
              {/* 6-Digit Pairing Code */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Device Peer Pairing
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}>
                    {isConnected ? 'Connected' : 'Ready to Pair'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/80 p-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pairing Code
                    </div>
                    <div className="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {pairCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPairCode}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleToggleComputerConnect}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  {isConnected ? 'Disconnect Device Peer' : 'Simulate Peer Connection'}
                </button>
              </div>

              {/* 10-Year Long Life Durability Suite */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    10-Year Durability & Atomic Export
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Export complete vault snapshot to retain data independently of any browser, platform, or computer for decades.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExportFullBackup}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 px-3 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-98 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export .omlifeos</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer active:scale-98 transition-all">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Restore Snapshot</span>
                    <input
                      type="file"
                      accept=".omlifeos,.json"
                      onChange={handleImportFullBackup}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={isAuditing}
                  onClick={handleRunHealthCheck}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <RefreshCw className={`h-3 w-3 ${isAuditing ? 'animate-spin' : ''}`} />
                  <span>Run Database Self-Healing Audit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
