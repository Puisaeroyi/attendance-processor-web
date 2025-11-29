'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/app/actions/auth'
import { Eye, EyeOff, User } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setServerError('')

      const result = await login(data.username, data.password)

      if (result.error) {
        setServerError(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-8 lg:p-12 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Attendance Pro</span>
        </div>

        {/* Form Container */}
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8">
            <p className="text-gray-500 text-sm mb-2">Welcome back</p>
            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">Sign in to your account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Server Error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="relative">
              <label 
                htmlFor="username" 
                className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-blue-500"
              >
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-10 border-2 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.username ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Enter your username"
                autoComplete="username"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <label 
                htmlFor="password" 
                className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-blue-500"
              >
                Password
              </label>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-10 border-2 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Available Users</span>
              </div>
            </div>

            {/* User Credentials */}
            <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 transition-colors cursor-pointer" title="admin">
                <span className="font-medium">admin</span>
                <p className="text-gray-400 text-[10px]">ADMIN</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 transition-colors cursor-pointer" title="thomas">
                <span className="font-medium">thomas</span>
                <p className="text-gray-400 text-[10px]">MANAGER</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 transition-colors cursor-pointer" title="silver">
                <span className="font-medium">silver</span>
                <p className="text-gray-400 text-[10px]">USER</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">Password: TempPassword123!</p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Attendance Pro. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Simple Pastel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-4xl font-semibold text-gray-800 mb-4">Welcome to</h2>
          <h1 className="text-5xl font-bold text-blue-600 mb-6">Attendance Pro</h1>
          <p className="text-gray-500 max-w-sm mx-auto">
            Manage your attendance, process data, and handle leave requests all in one place.
          </p>
        </div>
      </div>
    </div>
  )
}
