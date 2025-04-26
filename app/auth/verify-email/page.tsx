"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, RefreshCw, ArrowRight } from "lucide-react"
import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { useToast } from "../../../components/ui/use-toast"
import { Icons } from "../../../components/icons"

// Move the main component logic into a separate component
function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isVerifying, setIsVerifying] = React.useState(true)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  
  // Verify the email token on component mount
  React.useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setIsVerifying(false)
        setErrorMessage("Invalid verification link. Missing token or email.")
        return
      }
      
      try {
        // In production, make a real API call to verify the token
        // const response = await fetch("/api/auth/verify", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ token, email }),
        // })
        
        // For demo purposes, simulate API verification with a delay
        await new Promise((resolve) => setTimeout(resolve, 1500))
        
        // Demo: consider token valid if it's at least 6 characters
        const isValidToken = token.length >= 6
        
        if (isValidToken) {
          setIsSuccess(true)
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified.",
          })
        } else {
          setErrorMessage("Invalid or expired verification link. Please request a new one.")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setErrorMessage("An error occurred during verification. Please try again.")
      } finally {
        setIsVerifying(false)
      }
    }
    
    verifyEmail()
  }, [token, email, toast])
  
  const handleResendVerification = async () => {
    setIsVerifying(true)
    
    try {
      // In production, make a real API call to resend verification
      // const response = await fetch("/api/auth/resend-verification", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // })
      
      // For demo purposes, simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast({
        title: "Verification email sent",
        description: `A new verification link has been sent to ${email}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend verification email",
        description: "Please try again later.",
      })
    } finally {
      setIsVerifying(false)
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {isVerifying 
              ? "Verifying your email address..." 
              : isSuccess 
                ? "Your email has been verified successfully!"
                : "Verify your email address to complete your account setup"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {isVerifying ? (
            <div className="flex flex-col items-center space-y-4 py-6">
              <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">This may take a moment...</p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4 py-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">
                Thank you for verifying your email address. You can now access all features of your account.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-6">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center text-destructive font-medium">{errorMessage}</p>
              <p className="text-center text-sm text-muted-foreground">
                If you're having trouble verifying your email, you can request a new verification link.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {isSuccess ? (
            <Button 
              className="w-full"
              onClick={() => router.push("/auth/signin")}
            >
              Continue to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : !isVerifying && (
            <>
              <Button 
                className="w-full" 
                onClick={handleResendVerification} 
                disabled={isVerifying || !email}
              >
                {isVerifying ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resend Verification Email
              </Button>
              <div className="text-center mt-4">
                <Link 
                  href="/auth/signin" 
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Main component with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 