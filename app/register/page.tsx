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
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Password do not match.');
    }

    setError('');

    router.push('/dashboard');
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
              <form>
                <div className='grid gap-6'>
                  <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
                    <span className='relative z-10 bg-background px-2 text-muted-foreground'>
                      Register with
                    </span>
                  </div>
                  <div className='grid gap-6'>
                    <div className='grid gap-2'>
                      <Label htmlFor='username'>Username</Label>
                      <Input
                        id='username'
                        type='text'
                        placeholder='example'
                        required
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='mail@example.com'
                        required
                      />
                    </div>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='password'>Password</Label>
                      </div>
                      <Input id='password' type='password' required />
                    </div>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='confirmPassword'>
                          Password Confirmation
                        </Label>
                      </div>
                      <Input id='confirmPassword' type='password' required />
                    </div>
                    <Button type='submit' className='w-full'>
                      Register
                    </Button>
                  </div>
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
              </form>
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
