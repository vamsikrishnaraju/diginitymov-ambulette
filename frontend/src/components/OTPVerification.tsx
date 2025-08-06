import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface OTPVerificationProps {
  phone: string
  onVerified: () => void
  className?: string
}

export default function OTPVerification({ phone, onVerified, className = '' }: OTPVerificationProps) {
  const [otp, setOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [sendCooldown, setSendCooldown] = useState(0)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timeLeft])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (sendCooldown > 0) {
      interval = setInterval(() => {
        setSendCooldown(time => time - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sendOTP = async () => {
    if (!phone) {
      toast.error('Please enter a phone number first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsOtpSent(true)
        setTimeLeft(300) // 5 minutes
        setSendCooldown(60) // 1 minute cooldown
        toast.success('OTP sent successfully!')
        console.log('OTP for testing:', data.message)
      } else {
        toast.error('Failed to send OTP')
      }
    } catch (error) {
      toast.error('Error sending OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      })

      if (response.ok) {
        setIsVerified(true)
        toast.success('Phone number verified successfully!')
        onVerified()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Invalid OTP')
      }
    } catch (error) {
      toast.error('Error verifying OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = () => {
    setOtp('')
    setIsOtpSent(false)
    setTimeLeft(0)
    setSendCooldown(0)
    sendOTP()
  }

  if (isVerified) {
    return (
      <div className={`flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-800">Phone number verified</span>
      </div>
    )
  }

  if (!isOtpSent) {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          onClick={sendOTP}
          disabled={isLoading || !phone || sendCooldown > 0}
          className="w-full"
        >
          {isLoading ? 'Sending...' : sendCooldown > 0 ? `Wait ${sendCooldown}s` : 'Send OTP'}
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="otp" className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          Enter OTP
        </Label>
        <Input
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          className="text-center text-lg tracking-widest"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Clock className="h-3 w-3" />
          <span>
            {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP expired'}
          </span>
        </div>
        
        {timeLeft === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resendOTP}
            disabled={isLoading}
          >
            Resend OTP
          </Button>
        )}
      </div>
      
      <Button
        type="button"
        onClick={verifyOTP}
        disabled={isLoading || !otp || timeLeft === 0}
        className="w-full"
      >
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </Button>
    </div>
  )
}
