"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [profileName, setProfileName] = useState(user?.name || "");
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  async function handleProfileSave() {
    setIsSavingProfile(true);
    try {
      const res = await api.patch("/users/profile", { name: profileName });
      updateUser(res.data.user);
      toast({ title: "Profile updated." });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave() {
    if (passwords.newPass !== passwords.confirm) {
      toast({ title: "Passwords don&apos;t match", variant: "destructive" });
      return;
    }
    if (passwords.newPass.length < 8) {
      toast({ title: "Password must be 8+ characters", variant: "destructive" });
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.patch("/users/password", {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setPasswords({ current: "", newPass: "", confirm: "" });
      toast({ title: "Password changed successfully." });
    } catch (err: any) {
      toast({ title: err.response?.data?.error || "Failed", variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="mt-1.5 max-w-xs"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="mt-1.5 max-w-xs bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
          </div>
          <Button onClick={handleProfileSave} disabled={isSavingProfile} size="sm">
            {isSavingProfile && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
            <Save className="w-3 h-3 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              className="mt-1.5 max-w-xs"
            />
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={passwords.newPass}
              onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
              className="mt-1.5 max-w-xs"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className="mt-1.5 max-w-xs"
            />
          </div>
          <Button onClick={handlePasswordSave} disabled={isSavingPassword} size="sm">
            {isSavingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
