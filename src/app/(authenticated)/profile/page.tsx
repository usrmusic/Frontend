"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useUpdateProfile, useGetUserById, useVerifyEmail, useRequestVerifyEmail } from "@/src/api/usersApi";
import { toast } from "react-toastify";
import Button from "@/src/components/Button";
import Avatar from "@/src/components/common/Avatar";
import Input from "@/src/components/Input";

const getImageSrc = (p?: string) => {
  if (!p) return undefined;
  if (/^(data:|https?:\/\/|\/\/)/i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return `/${p}`;
};

export default function ProfilePage() {
  const { data: user, isLoading } = useAuth();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type ExtendedUser = {
    id?: number;
    name?: string;
    email?: string;
    contact_number?: string;
    address?: string;
    profile_photo?: string;
  };
  const u = (user as unknown) as ExtendedUser | undefined;

  const detailed = useGetUserById(u?.id);
  const verifyMutation = useVerifyEmail();
  const requestVerify = useRequestVerifyEmail();
  const isVerified = !!detailed.data?.is_email_send;

  const initializedRef = useRef(false);
  useEffect(() => {
    const src = (detailed.data as ExtendedUser | undefined) || u;
    if (src && !initializedRef.current) {
      // defer state updates to avoid synchronous setState within effect
      setTimeout(() => {
        setName(src.name || "");
        setEmail(src.email || "");
        const sno = src as unknown as { contact_number?: string; address?: string };
        setContactNumber(sno.contact_number || "");
        setAddress(sno.address || "");
        initializedRef.current = true;
      }, 0);
    }
  }, [u, detailed.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return;
    if (updateProfile.isPending) return;
    const form = new FormData();
    form.append("name", name);
    // email should not be editable by user from UI, but include it for safety
    form.append("email", email);
    form.append("contact_number", contactNumber || "");
    form.append("address", address || "");
    if (file) form.append("profile_photo", file);

    updateProfile.mutate({ id: user.id, form }, {
      onSuccess: () => {
        toast.success("Profile updated");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        detailed.refetch();
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="p-6">
      <h2 className="themeH1 mb-6">Profile Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <Input
              label="Name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isVerified}
            />
            <div className="text-sm mt-1">
              {isVerified ? (
                <span className="text-green-600">Email verified — cannot be changed.</span>
              ) : (
                <>
                  <span className="text-red-600">Email not verified.</span>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      disabled={requestVerify.isPending}
                      onClick={async () => {
                        // send verification email/token
                        try {
                          const res = await requestVerify.mutateAsync();
                          if (res && res.emailSent) {
                            toast.success("Verification email sent");
                          } else if (res && res.verificationToken) {
                            // email sending failed on server side — show token so user can paste it
                            window.alert("Verification token: " + res.verificationToken);
                          } else {
                            toast.info("Request processed");
                          }
                        } catch {
                          toast.error("Failed to send verification email");
                        }
                      }}
                      className="text-blue-600 underline"
                    >
                      Send verification email
                    </button>

                    <button
                      type="button"
                      disabled={verifyMutation.isPending}
                      onClick={async () => {
                        const token = window.prompt("Enter verification token (from email):");
                        if (!token) return;
                        try {
                          await verifyMutation.mutateAsync(token);
                          toast.success("Email verified");
                          detailed.refetch();
                        } catch {
                          toast.error("Verification failed");
                        }
                      }}
                      className="ml-3 text-blue-600 underline"
                    >
                      Verify email
                    </button>
                  </div>
                </>
              )}
            </div>
            <Input
              label="Contact Number"
              value={contactNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactNumber(e.target.value)}
            />
            <Input
              label="Address"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            />

            {/* Profile photo upload moved to preview column */}

            <div className="mt-6 flex items-center gap-3">
              <Button htmlType="submit" type="primary" showShadow loading={updateProfile.isPending} disabled={updateProfile.isPending}>
                Save
              </Button>
              <Button
                type="default"
                onClick={() => {
                  if (user) {
                    setName(u?.name || "");
                    setEmail(u?.email || "");
                    setContactNumber(u?.contact_number || "");
                    setAddress(u?.address || "");
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>

        {/* Right: large avatar preview */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center gap-4 p-6">
            <Avatar
              src={getImageSrc((file ? URL.createObjectURL(file) : u?.profile_photo) as string | undefined)}
              size={200}
              initials={user?.name ? user.name.split(" ").map(n => n[0]).slice(0,2).join("") : "U"}
            />
            <div>
              {/* hidden input lives here now */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (!f) {
                    setFile(null);
                    return;
                  }
                  const maxBytes = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES) || 10 * 1024 * 1024;
                  if (f.size > maxBytes) {
                    toast.error(`File too large. Max ${Math.round(maxBytes / 1024 / 1024)}MB.`);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setFile(null);
                    return;
                  }
                  setFile(f);
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <Button onClick={() => fileInputRef.current?.click()} type="default">Upload Image</Button>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              Upload a square JPG/PNG for best results.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
