'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
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
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">Invalid or expired reset token</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-96">
        <CardContent className="pt-6">
          <div className="text-center">Reset token validated successfully!</div>
          <p className="text-sm text-gray-600 mt-2">You can now close this page and use your new password to log in.</p>
        </CardContent>
      </Card>
    </div>
  );
}