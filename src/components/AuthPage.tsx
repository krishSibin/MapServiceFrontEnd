"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, X, ArrowRight, Loader2 } from "lucide-react"
import "./AuthPage.css"

/* ─── Hardcoded Admin Credentials ───────────────────────────────── */
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "nexira@2024"

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.96.95-2.18 1.78-3.4 1.72-1.32-.07-1.74-.88-3.23-.88-1.5 0-2 .86-3.25.9-.94.03-2.31-.83-3.26-1.77-2.13-2.14-3.32-6.42-1.22-9.69 1.05-1.63 2.76-2.67 4.54-2.67 1.35 0 2.56.9 3.36.9.79 0 2.05-.9 3.38-.9 1.76 0 3.46 1.04 4.5 2.57-3.6 1.83-3 6.5.6 8.3-1.08 1.62-2.43 3.53-3.5 4.52zM12.04 7.25c.03-2.64 2.22-4.14 2.3-4.22-.04-.04-2.14-.14-3.8 1.4-1.25 1.15-1.66 2.84-1.56 4.04.1.1 2.5.34 3.06-1.22z" />
    </svg>
)

const AuthPage: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
    const [view, setView] = useState<'login' | 'signup'>('login')
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // Give it a professional beat
        await new Promise(r => setTimeout(r, 1000))

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            onAuth()
        } else {
            setError("Incorrect credentials. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page-root">
            {/* Background Mesh */}
            <div className="auth-bg-vibrant" />

            <div className="auth-container">
                <motion.div
                    className="auth-brand-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="auth-brand-main">NEXIRA</div>
                    <div className="auth-brand-sub">SPATIAL</div>
                </motion.div>

                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <button className="auth-close-btn" onClick={() => window.location.reload()}>
                        <X size={18} />
                    </button>

                    <div className="auth-header">
                        <div className="auth-tabs">
                            <div
                                className={`auth-tab ${view === 'signup' ? 'active' : ''}`}
                                onClick={() => setView('signup')}
                            >
                                Sign up
                            </div>
                            <div
                                className={`auth-tab ${view === 'login' ? 'active' : ''}`}
                                onClick={() => setView('login')}
                            >
                                Sign in
                            </div>
                        </div>

                        <h1 className="auth-title">
                            {view === 'login' ? 'Welcome back' : 'Create an account'}
                        </h1>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {view === 'signup' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="auth-input-group">
                                    <input className="auth-input" style={{ paddingLeft: '16px' }} placeholder="First name" required />
                                </div>
                                <div className="auth-input-group">
                                    <input className="auth-input" style={{ paddingLeft: '16px' }} placeholder="Last name" required />
                                </div>
                            </div>
                        )}

                        <div className="auth-input-group">
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Enter your email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                            <Mail className="auth-input-icon" size={18} />
                        </div>

                        <div className="auth-input-group">
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <Lock className="auth-input-icon" size={18} />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <span>{view === 'login' ? 'Sign in' : 'Create an account'}</span>
                            )}
                        </button>
                    </form>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="auth-error-box"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="auth-divider">
                        <div className="auth-divider-line" />
                        <span>OR SIGN IN WITH</span>
                        <div className="auth-divider-line" />
                    </div>

                    <div className="auth-oauth-row">
                        <div className="auth-oauth-btn"><GoogleIcon /></div>
                        <div className="auth-oauth-btn"><AppleIcon /></div>
                    </div>

                    <p className="auth-footer-text">
                        By creating an account, you agree to our Terms & Service
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

export default AuthPage
