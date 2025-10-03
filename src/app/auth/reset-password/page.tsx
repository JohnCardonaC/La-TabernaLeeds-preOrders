'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Verificar que tenemos los parámetros necesarios
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (tokenHash && type === 'recovery') {
      setValidToken(true);
    } else {
      setValidToken(false);
      toast.error('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Error updating password:', error.message);
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Password updated successfully!');
      router.push('/login');
    }
  };

  if (validToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">Validating reset token...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="space-y-8">
          <Image
            src="https://res.cloudinary.com/dycdigital/image/upload/v1758807509/logo-black_fgjop4.png"
            alt="La Taberna"
            width={120}
            height={120}
            className="mx-auto"
          />
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => router.push('/forgot-password')}
              >
                Request New Reset Link
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="space-y-8">
        <Image
          src="https://res.cloudinary.com/dycdigital/image/upload/v1758807509/logo-black_fgjop4.png"
          alt="La Taberna"
          width={120}
          height={120}
          className="mx-auto"
        />
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/login')}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}