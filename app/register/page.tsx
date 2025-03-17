'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderSpinner } from '@/components/ui/loader-spinner';

interface Errors {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const registerSchema = z
  .object({
    firstName: z.string().nonempty({ message: 'First name is required.' }),
    lastName: z.string().nonempty({ message: 'Last name is required.' }),
    username: z.string().nonempty({ message: 'Username is required.' }),
    password: z
      .string()
      .nonempty({ message: 'Password is required.' })
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter.',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
      .regex(/[\W_]/, {
        message: 'Password must contain at least one special character.',
      }),
    confirmPassword: z
      .string()
      .nonempty({ message: 'Confirm password is required.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrors({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
    });

    const formattedUsername = username.toLowerCase();

    const validationResult = registerSchema.safeParse({
      firstName,
      lastName,
      username: formattedUsername,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;

      setErrors({
        firstName: fieldErrors.firstName ? fieldErrors.firstName.join(' ') : '',
        lastName: fieldErrors.lastName ? fieldErrors.lastName.join(' ') : '',
        username: fieldErrors.username ? fieldErrors.username.join(' ') : '',
        password: fieldErrors.password ? fieldErrors.password.join(' ') : '',
        confirmPassword: fieldErrors.confirmPassword
          ? fieldErrors.confirmPassword.join(' ')
          : '',
      });

      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username: formattedUsername,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.user) {
        await handleLogin();
      } else {
        toast.error(data.error, {
          position: 'top-center',
        });
      }
    } catch (error: unknown) {
      console.error(error);

      toast.error('Something went wrong.', {
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);

        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Login failed.', {
          position: 'top-center',
        });
      }
    } catch (error: unknown) {
      console.error(error);

      toast.error('Something went wrong.');
    }
  };

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start'>
        <div className='flex flex-col w-100 gap-6'>
          <Card>
            <CardHeader className='text-center'>
              <CardTitle className='text-xl'>Register</CardTitle>
              <CardDescription>Subscriptions Management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6'>
                <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
                  <span className='relative z-10 bg-background px-2 text-muted-foreground'>
                    Register with
                  </span>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className='grid gap-6'>
                    <div className='flex gap-3'>
                      <div className='relative'>
                        <div className='grid gap-2'>
                          <Label htmlFor='username'>First Name</Label>
                          <Input
                            id='firstName'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder='Your first name'
                          />
                        </div>
                        {errors.firstName && (
                          <p className='text-sm text-red-500'>
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div className='relative'>
                        <div className='grid gap-2'>
                          <Label htmlFor='lastName'>Last Name</Label>
                          <Input
                            id='lastName'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder='Your last name'
                          />
                        </div>
                        {errors.lastName && (
                          <p className='text-sm text-red-500'>
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='relative'>
                      <div className='grid gap-2'>
                        <Label htmlFor='username'>Username</Label>
                        <Input
                          id='username'
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder='Your username'
                        />
                      </div>
                      {errors.username && (
                        <p className='text-sm text-red-500'>
                          {errors.username}
                        </p>
                      )}
                    </div>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='password'>Password</Label>
                      </div>
                      <div className='relative'>
                        <Input
                          id='password'
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder='Your password'
                          className='pr-13'
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword((prev) => !prev)}
                          className='absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-600'
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.password && (
                        <p className='-mt-2 text-sm text-red-500'>
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='confirmPassword'>
                          Password Confirmation
                        </Label>
                      </div>
                      <div className='relative'>
                        <Input
                          id='confirmPassword'
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder='Confirm your password'
                          className='pr-13'
                        />
                        <button
                          type='button'
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          className='absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-600'
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className='-mt-2 text-sm text-red-500'>
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                    <Button type='submit' className='w-full' disabled={loading}>
                      {loading ? (
                        <>
                          <LoaderSpinner className='text-center' />
                        </>
                      ) : (
                        'Register'
                      )}
                    </Button>
                  </div>
                </form>
                <div className='text-center text-sm'>
                  Have an account?{' '}
                  <Link
                    href={'/login'}
                    className='underline underline-offset-4'
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className='text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  '>
            Created by Refi Ahmad Fauzan,{' '}
            <Link href={'https://github.com/djebreds'}>Github</Link> |{' '}
            <Link href={'https://linkedin.com/in/refifauzan'}>LinkedIn</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
