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
import { LoaderSpinner } from '@/components/ui/loader-spinner';
import { login } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().nonempty({ message: 'Username is required.' }),
  password: z.string().nonempty({ message: 'Password is required.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('djebreds');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ username, password });

    if (!validation.success) {
      const fieldErrors: any = {};

      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
      });

      setErrors(fieldErrors);

      return;
    }

    try {
      setLoading(true);
      await login(username, password);

      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start'>
        <div className='flex flex-col w-100 gap-6'>
          <Card>
            <CardHeader className='text-center'>
              <CardTitle className='text-xl'>Welcome back</CardTitle>
              <CardDescription>Subscriptions Management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6'>
                <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
                  <span className='relative z-10 bg-background px-2 text-muted-foreground'>
                    Login with
                  </span>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className='grid gap-6'>
                    <div className='grid gap-2'>
                      <Label htmlFor='username'>Username</Label>
                      <div className='relative'>
                        <Input
                          id='username'
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder='Your username'
                          required
                        />
                      </div>
                      {errors.username && (
                        <p className='-mt-2 text-sm text-red-500'>
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
                          required
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
                    <Button type='submit' className='w-full' disabled={loading}>
                      {loading ? (
                        <>
                          <LoaderSpinner className='text-center' />
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </div>
                </form>
                <div className='text-center text-sm'>
                  Don&apos;t have an account?{' '}
                  <Link
                    href={'/register'}
                    className='underline underline-offset-4'
                  >
                    Sign up
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
