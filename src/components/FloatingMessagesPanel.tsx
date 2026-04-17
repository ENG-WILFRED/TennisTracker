"use client"

import { useState, useEffect, useRef, useCallback, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from './ToastProvider'

interface BugReport {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  pageUrl: string
  userAgent: string
  username: string
  email: string
  timestamp: string
}

type BugReportForm = {
  title: string
  description: string
  severity: BugReport['severity']
}

export default function FloatingMessagesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const touchTimerRef = useRef<number | null>(null)
  const touchStartPoint = useRef({ x: 0, y: 0 })
  const ignoreClickRef = useRef(false)
  const [bugReport, setBugReport] = useState<BugReportForm>({
    title: '',
    description: '',
    severity: 'medium'
  })
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [pageContext, setPageContext] = useState({ pageUrl: '', userAgent: '', timestamp: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, isLoggedIn } = useAuth()
  const { showToast } = useToast()

  const handleMouseDown = (e: ReactMouseEvent<HTMLElement>) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleTouchStart = (e: ReactTouchEvent<Element>) => {
    const touch = e.touches[0]
    touchStartPoint.current = { x: touch.clientX, y: touch.clientY }
    const rect = e.currentTarget.getBoundingClientRect()

    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    })

    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current)
    }

    touchTimerRef.current = window.setTimeout(() => {
      setIsDragging(true)
      ignoreClickRef.current = true
    }, 250)
  }

  const cancelTouchDrag = () => {
    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }
  }

  const handleTouchMove = useCallback((e: ReactTouchEvent<Element>) => {
    const touch = e.touches[0]
    const moveDist = Math.hypot(touch.clientX - touchStartPoint.current.x, touch.clientY - touchStartPoint.current.y)

    if (!isDragging && moveDist > 8) {
      cancelTouchDrag()
    }

    if (!isDragging) return

    e.preventDefault()
    const newX = touch.clientX - dragOffset.x
    const newY = touch.clientY - dragOffset.y

    // Keep draggable element within viewport bounds
    const maxX = window.innerWidth - 80
    const maxY = window.innerHeight - 80

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }, [isDragging, dragOffset])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    // Keep draggable element within viewport bounds
    const maxX = window.innerWidth - 80
    const maxY = window.innerHeight - 80

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }, [isDragging, dragOffset])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchEnd = useCallback(() => {
    cancelTouchDrag()
    if (isDragging) {
      setIsDragging(false)
      window.setTimeout(() => {
        ignoreClickRef.current = false
      }, 100)
    }
  }, [isDragging])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove as unknown as EventListener, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove as unknown as EventListener)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleTouchMove, handleTouchEnd, handleMouseMove])

  useEffect(() => {
    const updateMobileViewport = () => setIsMobileViewport(window.innerWidth <= 768)
    updateMobileViewport()
    window.addEventListener('resize', updateMobileViewport)
    return () => window.removeEventListener('resize', updateMobileViewport)
  }, [])

  useEffect(() => {
    setPosition({
      x: window.innerWidth - 80 - 24,
      y: window.innerHeight - 80 - 24
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const panelWidth = isMobileViewport ? Math.min(window.innerWidth - 32, 320) : 320
    const panelHeight = Math.min(520, window.innerHeight - 32)
    const margin = 16

    const defaultX = isMobileViewport ? Math.max(margin, (window.innerWidth - panelWidth) / 2) : position.x
    const defaultY = isMobileViewport ? margin : position.y

    const maxX = window.innerWidth - panelWidth - margin
    const maxY = window.innerHeight - panelHeight - margin

    setPanelPosition({
      x: Math.max(margin, Math.min(defaultX, maxX)),
      y: Math.max(margin, Math.min(defaultY, maxY))
    })
  }, [isOpen, position, isMobileViewport])

  useEffect(() => {
    setPageContext({
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toLocaleString(),
    })
  }, [])

  const handleSubmitBug = async (e: FormEvent) => {
    e.preventDefault()

    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      showToast('Please provide your name and email before submitting a bug.', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const bugData: BugReport = {
        title: bugReport.title,
        description: bugReport.description,
        severity: bugReport.severity,
        pageUrl: pageContext.pageUrl || window.location.href,
        userAgent: pageContext.userAgent || navigator.userAgent,
        username: user?.username || guestName || 'Guest',
        email: user?.email || guestEmail || 'guest@vico.app',
        timestamp: pageContext.timestamp || new Date().toISOString()
      }

      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bugData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit bug report')
      }

      setBugReport({ title: '', description: '', severity: 'medium' })
      setGuestName('')
      setGuestEmail('')
      setIsOpen(false)

      showToast('Bug report submitted successfully! Thank you for helping us improve.', 'success')
    } catch (error) {
      console.error('Error submitting bug report:', error)
      showToast('Failed to submit bug report. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Draggable Floating Button */}
      <div
        onMouseDown={handleMouseDown}
        className="fixed z-40"
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <button
          onClick={(e) => {
            if (ignoreClickRef.current || isDragging) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            setIsOpen(!isOpen)
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 hover:from-red-700 hover:to-orange-700"
          title="Report a Bug"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {/* Antennae */}
          <path d="M9 3l-2 4M15 3l2 4" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Body */}
          <ellipse cx="12" cy="13" rx="4" ry="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Left legs */}
          <path d="M8 10l-4-2M8 12l-5 0M8 14l-4 2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Right legs */}
          <path d="M16 10l4-2M16 12l5 0M16 14l4 2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Head circle */}
          <circle cx="12" cy="7" r="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      </div>

      {/* Floating Panel */}
      {isOpen && (
        <>
          {/* Overlay to close */}
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed z-40 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{
              left: panelPosition.x,
              top: panelPosition.y,
              width: isMobileViewport ? 'calc(100vw - 32px)' : 320,
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 32px)',
              right: 'auto',
              bottom: 'auto',
              cursor: isDragging ? 'grabbing' : 'default',
              overflowY: 'auto'
            }}
          >
            {/* Draggable Header */}
            <div
              className="bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            >
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {/* Antennae */}
                  <path d="M9 3l-2 4M15 3l2 4" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Body */}
                  <ellipse cx="12" cy="13" rx="4" ry="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Left legs */}
                  <path d="M8 10l-4-2M8 12l-5 0M8 14l-4 2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Right legs */}
                  <path d="M16 10l4-2M16 12l5 0M16 14l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Head circle */}
                  <circle cx="12" cy="7" r="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Report Bug
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-md transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bug Report Form */}
            <form onSubmit={handleSubmitBug} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bug Title *
                </label>
                <input
                  type="text"
                  required
                  value={bugReport.title}
                  onChange={(e) => setBugReport(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={bugReport.severity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBugReport(prev => ({ ...prev, severity: e.target.value as BugReport['severity'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Affects functionality</option>
                  <option value="high">High - Major feature broken</option>
                  <option value="critical">Critical - App unusable</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={bugReport.description}
                  onChange={(e) => setBugReport(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="Please describe the bug in detail. What were you doing? What happened? What should have happened?"
                />
              </div>

              {!isLoggedIn && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your email"
                    />
                  </div>
                </div>
              )}

              {/* Page Info */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Page Information</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>URL:</strong> {pageContext.pageUrl || 'Loading...'}</div>
                  <div><strong>Browser:</strong> {pageContext.userAgent ? pageContext.userAgent.split(' ').pop() : 'Loading...'}</div>
                  <div><strong>Time:</strong> {pageContext.timestamp || 'Loading...'}</div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 px-4 rounded-md hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  )
}


