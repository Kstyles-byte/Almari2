"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "../components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: "customer" | "vendor" | "agent" | "admin"
  avatar?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string, role: User["role"]) => Promise<boolean>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
  updateProfile: (data: Partial<User>) => Promise<boolean>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  
  const [state, setState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })
  
  // Check for existing session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        // In production, you would fetch user session data from your API
        // const response = await fetch("/api/auth/session")
        // const data = await response.json()
        
        // For now, check localStorage for a mock session
        const storedUser = localStorage.getItem("user")
        
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error("Failed to fetch session:", error)
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }
    
    checkSession()
  }, [])
  
  // Monitor route changes to redirect unauthenticated users
  React.useEffect(() => {
    // Skip during initial loading
    if (state.isLoading) return
    
    // Check if current path requires authentication
    const protectedPaths = [
      '/customer',
      '/vendor',
      '/agent',
      '/admin',
      '/checkout',
    ]
    
    const isProtectedPath = protectedPaths.some(path => 
      pathname?.startsWith(path)
    )
    
    if (isProtectedPath && !state.isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page",
        variant: "destructive",
      })
      
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`)
    }
  }, [pathname, state.isAuthenticated, state.isLoading, router, toast])
  
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // In production, you'd make a real API call
      // const response = await fetch("/api/auth/signin", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // })
      // const data = await response.json()
      
      // For demo purposes, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simple validation for demo
      if (email.includes("@") && password.length >= 6) {
        const user: User = {
          id: "user_" + Math.random().toString(36).substring(2),
          name: email.split("@")[0],
          email,
          role: "customer",
        }
        
        // Store in localStorage for demo purposes
        localStorage.setItem("user", JSON.stringify(user))
        
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
        
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        })
        
        return true
      } else {
        toast({
          title: "Authentication failed",
          description: "Invalid email or password",
          variant: "destructive",
        })
        
        setState(prev => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast({
        title: "Authentication failed",
        description: "An error occurred during sign in",
        variant: "destructive",
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }
  
  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: User["role"]
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // In production, you'd make a real API call
      // const response = await fetch("/api/auth/signup", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password, name, role }),
      // })
      // const data = await response.json()
      
      // For demo purposes, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (email.includes("@") && password.length >= 6 && name.length >= 2) {
        // In production, you would typically redirect to verify email
        // For demo, just create the account
        
        const user: User = {
          id: "user_" + Math.random().toString(36).substring(2),
          name,
          email,
          role,
        }
        
        // Store in localStorage for demo purposes
        localStorage.setItem("user", JSON.stringify(user))
        
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
        
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        })
        
        return true
      } else {
        toast({
          title: "Registration failed",
          description: "Please check your information and try again",
          variant: "destructive",
        })
        
        setState(prev => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      console.error("Sign up error:", error)
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }
  
  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // In production, you'd make a real API call
      // await fetch("/api/auth/signout", { method: "POST" })
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove from localStorage
      localStorage.removeItem("user")
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
      
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "An error occurred during sign out",
        variant: "destructive",
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }
  
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // In production, you'd make a real API call
      // const response = await fetch("/api/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // })
      // const data = await response.json()
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setState(prev => ({ ...prev, isLoading: false }))
      
      return true
    } catch (error) {
      console.error("Forgot password error:", error)
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }
  
  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // In production, you'd make a real API call
      // const response = await fetch("/api/auth/reset-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ token, password }),
      // })
      // const data = await response.json()
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setState(prev => ({ ...prev, isLoading: false }))
      
      return true
    } catch (error) {
      console.error("Reset password error:", error)
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }
  
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!state.user) return false
      
      setState(prev => ({ ...prev, isLoading: true }))
      
      // In production, you'd make a real API call
      // const response = await fetch("/api/auth/profile", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // })
      // const responseData = await response.json()
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedUser = {
        ...state.user,
        ...data,
      }
      
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser))
      
      setState({
        user: updatedUser,
        isLoading: false,
        isAuthenticated: true,
      })
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      
      return true
    } catch (error) {
      console.error("Update profile error:", error)
      toast({
        title: "Update failed",
        description: "An error occurred while updating your profile",
        variant: "destructive",
      })
      
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }
  
  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  
  return context
} 