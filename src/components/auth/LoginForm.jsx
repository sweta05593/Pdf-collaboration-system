// src/components/auth/CustomLoginForm.js
// Alternative login form that uses custom signin API instead of NextAuth
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/loadingSpinner';


export default function CustomLoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage or context
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Success - redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        // Handle API errors
        setErrors({
          general: data.message || 'Login failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'An unexpected error occurred. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Sign In
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General error message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <Input
            type="email"
            name="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
            autoComplete="current-password"
            required
          />
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" color="white" />
                <span className="ml-2">Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a 
              href="/auth/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}