"use client";
import { useLogin } from "@/src/api/authApi";
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AxiosInstance from "@/src/lib/axios";
import { toast } from "react-toastify";

const LoginPage = () => {
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      loginMutation.mutate(
        {
          email: values.email,
          password: values.password,
        },
        {
          onSuccess: () => router.push("/dashboard"),
        },
      );
    },
  });
  const loginMutation = useLogin();
  const [forgotLoading, setForgotLoading] = useState(false);
  // secure mode: if true, always show a generic response to avoid revealing account existence
  const secureMode = process.env.NEXT_PUBLIC_FORGOT_SECURE !== "false";

  const handleForgot = async () => {
    const email = formik.values.email?.trim();
    if (!email) {
      toast.error("Please enter your email above to reset password.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await AxiosInstance.post("/user/forgot", { email });
      if (secureMode) {
        toast.success("If an account exists, a password reset email has been sent.");
      } else {
        toast.success(res.data?.message || "Password reset email sent if account exists.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const errCode = err?.response?.data?.error;
      if (secureMode) {
        // In secure mode don't reveal whether user exists; show generic success-like message
        toast.success("If an account exists, a password reset email has been sent.");
      } else {
        if (status === 404 || errCode === "user_not_found") {
          toast.error("No account found for that email.");
        } else {
          toast.error(err?.response?.data?.message || "Failed to send reset email.");
        }
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        className="max-w-sm w-full mx-auto space-y-6 my-16"
        onSubmit={formik.handleSubmit}
      >
        <div className="text-2xl font-semibold text-center mb-6">Login</div>
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <Input
          label="Password"
          type="password"
          showToggle
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={handleForgot}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Sending..." : "Forgot password?"}
          </button>
          <div />
        </div>
        <Button
          className="w-full"
          type="primary"
          htmlType="submit"
          loading={loginMutation.isPending}
          disabled={loginMutation.isPending}
        >
          Login
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
