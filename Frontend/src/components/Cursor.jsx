import { useState, useEffect, createContext, useContext } from 'react'
import { motion } from 'framer-motion'

const CursorContext = createContext(null)

export const useCursor = () => {
  const context = useContext(CursorContext)
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider')
  }
  return context
}

const GlobalCursor = () => {
  const { cursorText, mousePosition, isVisible } = useCursor()

  if (!cursorText || !isVisible) return null

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: mousePosition.x + 15,
        top: mousePosition.y - 35,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div
        style={{
          background: 'white',
          color: '#333',
          padding: '8px 14px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {cursorText}
      </div>
    </motion.div>
  )
}

export const CursorProvider = ({ children, global = false }) => {
  const [cursorText, setCursorText] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let animationFrameId

    const updateMousePosition = (e) => {
      // Use requestAnimationFrame for smooth performance
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      })
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => {
      setIsVisible(false)
      setCursorText('') // Clear text when leaving
    }

    if (global) {
      window.addEventListener('mousemove', updateMousePosition)
      document.addEventListener('mouseenter', handleMouseEnter)
      document.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (global) {
        window.removeEventListener('mousemove', updateMousePosition)
        document.removeEventListener('mouseenter', handleMouseEnter)
        document.removeEventListener('mouseleave', handleMouseLeave)
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [global])

  const contextValue = {
    cursorText,
    setCursorText,
    mousePosition,
    isVisible,
  }

  return (
    <CursorContext.Provider value={contextValue}>
      {children}
      {global && <GlobalCursor />}
    </CursorContext.Provider>
  )
}

export const Cursor = ({ text, children, ...props }) => {
  const { setCursorText } = useCursor()

  const handleMouseEnter = () => {
    if (text) {
      setCursorText(text)
    }
  }

  const handleMouseLeave = () => {
    setCursorText('') // Always clear on leave
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </div>
  )
}

// Remove CursorFollow - not needed
export const CursorFollow = ({ children }) => null
