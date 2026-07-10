"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Shield,
  Calendar,
} from "lucide-react";

export function AccountSettings() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!user) return null;

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await user!.delete();
      toast({ title: "Account deleted", description: "Your account has been permanently removed." });
      signOut();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
          <CardDescription>Details about your HomeOS account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Email</p>
              <p className="text-sm text-[hsl(var(--foreground))]">
                {user.primaryEmailAddress?.emailAddress ?? "No email"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">User ID</p>
              <p className="font-mono text-sm text-[hsl(var(--foreground))]">{user.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Member since</p>
                <p className="text-sm text-[hsl(var(--foreground))]">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) : "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Two-factor auth</p>
                <p className="text-sm text-[hsl(var(--foreground))]">
                  {user.twoFactorEnabled ? "Enabled" : "Not enabled"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Management</CardTitle>
          <CardDescription>
            Manage your security settings, connected accounts, and sessions through Clerk.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("https://accounts.clerk.dev/user/security", "_blank", "noopener,noreferrer");
              }
            }}
          >
            <Shield className="h-4 w-4" />
            Security Settings
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("https://accounts.clerk.dev/user", "_blank", "noopener,noreferrer");
              }
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Full Account Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[hsl(var(--destructive))]/30">
        <CardHeader>
          <CardTitle className="text-lg text-[hsl(var(--destructive))]">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--destructive))]/30 p-4">
            <div>
              <p className="font-medium text-[hsl(var(--foreground))]">Delete account</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(true);
                setDeleteConfirm("");
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--destructive))]">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your homes, rooms, items, and data
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            <p className="font-medium">This will permanently:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Delete all your homes and inventory data</li>
              <li>Remove all rooms, items, and photos</li>
              <li>Cancel any active subscriptions</li>
              <li>Delete your account from our system</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm">
              Type <span className="font-mono font-semibold">delete my account</span> to confirm
            </Label>
            <Input
              id="delete-account-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete my account"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "delete my account" || deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
