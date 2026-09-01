"use client";
import { useResetPasswordWithToken } from "@/src/api/authApi";
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";
import { useFormik } from "formik";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

const ResetPasswordPage = () => {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const resetMutation = useResetPasswordWithToken();

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    onSubmit: (values) => {
      if (values.password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
      if (values.password !== values.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      resetMutation.mutate(
        { email, token: params.token, password: values.password },
        {
          onSuccess: () => {
            toast.success("Password updated — please sign in.");
            router.push("/login");
          },
          onError: () => {
            toast.error(
              "This reset link is invalid or has expired. Please request a new one.",
            );
          },
        },
      );
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        className="max-w-sm w-full mx-auto space-y-6 my-16"
        onSubmit={formik.handleSubmit}
      >
        <div className="text-2xl font-semibold text-center mb-6">
          Set a new password
        </div>
        <Input
          label="New Password"
          type="password"
          showToggle
          name="password"
          placeholder="Enter a new password"
          autoComplete="new-password"
          required
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <Input
          label="Confirm Password"
          type="password"
          showToggle
          name="confirmPassword"
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          required
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <Button
          className="w-full"
          type="primary"
          htmlType="submit"
          loading={resetMutation.isPending}
          disabled={resetMutation.isPending}
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
