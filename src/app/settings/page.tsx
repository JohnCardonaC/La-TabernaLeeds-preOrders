"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

type PreorderSettings = {
  id: string;
  min_large_table_size: number;
  created_at: string;
  updated_at: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<PreorderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minLargeTableSize, setMinLargeTableSize] = useState<number>(6);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('preorders_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } else if (data) {
      setSettings(data);
      setMinLargeTableSize(data.min_large_table_size);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('preorders_settings')
      .update({ min_large_table_size: minLargeTableSize })
      .eq('id', settings.id);

    if (error) {
      console.error('Error updating settings:', error);
      toast.error('Error saving settings');
    } else {
      toast.success('Settings saved successfully');
      fetchSettings(); // Refresh to get updated timestamp
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout currentPage="settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
          <p className="text-stone-600 mt-2">
            Configure system settings for the pre-order system.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pre-Order Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="minLargeTableSize">
                Minimum People for Large Tables
              </Label>
              <p className="text-sm text-stone-600">
                Bookings with this number of people or more will receive pre-order email invitations.
              </p>
              <Input
                id="minLargeTableSize"
                type="number"
                min="1"
                value={minLargeTableSize}
                onChange={(e) => setMinLargeTableSize(parseInt(e.target.value) || 1)}
                className="w-full max-w-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-stone-600">
                {settings && (
                  <span>
                    Last updated: {new Date(settings.updated_at).toLocaleString()}
                  </span>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || minLargeTableSize < 1}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-stone-600">
                  Minimum Large Table Size
                </Label>
                <p className="text-2xl font-bold text-stone-800">
                  {minLargeTableSize}+ people
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-stone-600">
                  Affected Bookings
                </Label>
                <p className="text-sm text-stone-600">
                  Bookings with {minLargeTableSize} or more people will receive pre-order invitations via email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}