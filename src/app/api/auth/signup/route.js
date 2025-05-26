// src/app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToMongoDB from '../../../../lib/mongodb';
import { User } from '../../../../models';

// Simple email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple input sanitization
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}

// Validation helper
function validateSignupData(name, email, password) {
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } 

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export async function POST(request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON data',
          field: 'general'
        },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Validate input data
    const validation = validateSignupData(name, email, password);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await connectToMongoDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    try {
      const existingUser = await User.findOne({ email: normalizedEmail });
      
      if (existingUser) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'An account with this email already exists',
            field: 'email'
          },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    // Hash password securely
    let hashedPassword;
    try {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password processing failed. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    // Create new user
    try {
      const user = new User({
        name: sanitizeInput(name),
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date(),
        isVerified: false // Add email verification if needed
      });

      const savedUser = await user.save();

      // Return success response (exclude password)
      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          createdAt: savedUser.createdAt
        }
      }, { status: 201 });

    } catch (error) {
      console.error('User creation error:', error);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'An account with this email already exists',
            field: 'email'
          },
          { status: 409 }
        );
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        Object.keys(error.errors).forEach(key => {
          errors[key] = error.errors[key].message;
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            errors
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Account creation failed. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected signup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.',
        field: 'general'
      },
      { status: 500 }
    );
  }
}