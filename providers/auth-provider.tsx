"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
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
  updateProfile: (data: Partial<User>) => Promise<boolean>
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  
  React.useEffect(() => {
    const checkSession = async () => {
      try {
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
  
  React.useEffect(() => {
    if (state.isLoading) return
    
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
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (email.includes("@") && password.length >= 6) {
        const user: User = {
          id: "user_" + Math.random().toString(36).substring(2),
          name: email.split("@")[0],
          email,
          role: "customer",
        }
        
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
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (email.includes("@") && password.length >= 6 && name.length >= 2) {
        const user: User = {
          id: "user_" + Math.random().toString(36).substring(2),
          name,
          email,
          role,
        }
        
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
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
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
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      setState(prev => ({ ...prev, isLoading: false }))

      if (error) {
        console.error("Forgot password error:", error.message);
        toast({
          title: "Error Sending Reset Email",
          description: error.message || "Could not send password reset link.",
          variant: "destructive",
        })
        return false;
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a link to reset your password.",
      })
      return true;

    } catch (error: any) {
      console.error("Forgot password unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      setState(prev => ({ ...prev, isLoading: false }))
      return false;
    }
  }
  
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!state.user) return false
      
      setState(prev => ({ ...prev, isLoading: true }))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedUser = {
        ...state.user,
        ...data,
      }
      
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
  
  return <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, forgotPassword, updateProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  
  return context
} 