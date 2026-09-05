import { useAddCompany, useEditCompany } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import SignaturePad, {
  type SignaturePadHandle,
} from "@/src/components/common/SignaturePad";
import { Modal } from "antd";
import { useFormik } from "formik";
import {
  Building2,
  FileInput,
  Globe,
  Landmark,
  Mail,
  NotebookTabs,
  Percent,
  Phone,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { BsInstagram } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa";
import { FaEnvelopesBulk } from "react-icons/fa6";
import { toast } from "react-toastify";

interface CompanyProps {
  modalOpen: boolean;
  handleCancel: () => void;
  initialValues: {
    id: string | number;
    name?: string;
    company_logo?: File | string | null;
    brochure?: File | string | null;
    contact_name?: string;
    telephone_number?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    address_name?: string;
    street?: string;
    city?: string;
    postal_code?: string;
    bank_name?: string;
    account_number?: string;
    sort_code?: string;
    vat?: string;
    vat_percentage?: string;
    admin_signature_url?: string | null;
  } | null;
}

const CompanyModal = ({
  modalOpen,
  handleCancel,
  initialValues,
}: CompanyProps) => {
  const isEditMode = !!initialValues;
  const addCompany = useAddCompany();
  const editCompany = useEditCompany();
  const loading = addCompany.isPending || editCompany.isPending;

  const padRef = useRef<SignaturePadHandle | null>(null);
  const [showPad, setShowPad] = useState(!(initialValues?.admin_signature_url));

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: initialValues?.name || "",
      company_logo: initialValues?.company_logo || null,
      brochure: initialValues?.brochure || null,
      contact_name: initialValues?.contact_name || "",
      telephone_number: initialValues?.telephone_number || "",
      email: initialValues?.email || "",
      website: initialValues?.website || "",
      instagram: initialValues?.instagram || "",
      facebook: initialValues?.facebook || "",
      address_name: initialValues?.address_name || "",
      street: initialValues?.street || "",
      city: initialValues?.city || "",
      postal_code: initialValues?.postal_code || "",
      bank_name: initialValues?.bank_name || "",
      account_number: initialValues?.account_number || "",
      sort_code: initialValues?.sort_code || "",
      vat: initialValues?.vat || "",
      vat_percentage: initialValues?.vat_percentage || "",
      admin_signature: null as string | null,
    },
    onSubmit: (values) => {
      // Create a new FormData object
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("contact_name", values.contact_name);
      formData.append("telephone_number", values.telephone_number);
      formData.append("email", values.email);
      formData.append("website", values.website);
      formData.append("instagram", values.instagram);
      formData.append("facebook", values.facebook);
      formData.append("address_name", values.address_name);
      formData.append("street", values.street);
      formData.append("city", values.city);
      formData.append("postal_code", values.postal_code);
      formData.append("bank_name", values.bank_name);
      formData.append("account_number", values.account_number);
      formData.append("sort_code", values.sort_code);
      formData.append("vat", values.vat);
      formData.append("vat_percentage", values.vat_percentage);
      if (values.admin_signature && values.admin_signature.startsWith("data:image/")) {
        formData.append("admin_signature", values.admin_signature);
      }
      if (values.company_logo instanceof File) {
        formData.append("company_logo", values.company_logo);
      }
      if (values.brochure instanceof File) {
        formData.append("brochure", values.brochure);
      }
      if (isEditMode) {
        editCompany.mutate(
          { id: initialValues.id, payload: formData },
          {
            onSuccess: () => {
              handleCancel();
              toast.success("Company updated successfully");
            },
          },
        );
      } else {
        addCompany.mutate(formData, {
          onSuccess: () => {
            handleCancel();
            toast.success("Company added successfully");
          },
        });
      }
    },
  });

  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      title={isEditMode ? "Edit Company" : "Add Company"}
      centered
      footer={false}
      width="min(1400px, 95vw)"
    >
      <form onSubmit={formik.handleSubmit}>
        {/* Four columns side-by-side instead of one long scrolling stack —
            everything visible at once on a wide screen, wraps to fewer
            columns as the viewport narrows. */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-6">
          {/* Column 1: Company Details + Files + Admin Signature */}
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="font-medium text-gray-900">Company Details</p>
              <Input
                label="Company Name"
                labelIcon={<Building2 size={14} />}
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
              />
            </div>
            <div className="space-y-3">
              <p className="font-medium text-gray-900">Files</p>
              <Input
                label="Company Logo"
                type="file"
                labelIcon={<FileInput size={14} />}
                name="company_logo"
                className="flex items-center file:mr-3 file:h-full file:border-0 file:bg-secondary-200 file:px-3 file:text-sm file:text-gray-700 file:cursor-pointer"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  formik.setFieldValue(
                    "company_logo",
                    e.currentTarget.files?.[0] || null,
                  );
                }}
              />
              <Input
                label="Brochure"
                type="file"
                labelIcon={<FileInput size={14} />}
                name="brochure"
                className="flex items-center file:mr-3 file:h-full file:border-0 file:bg-secondary-200 file:px-3 file:text-sm file:text-gray-700 file:cursor-pointer"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  formik.setFieldValue(
                    "brochure",
                    e.currentTarget.files?.[0] || null,
                  );
                }}
              />
            </div>
            <div className="space-y-3">
              <p className="font-medium text-gray-900">Admin Signature</p>
              {!showPad && initialValues?.admin_signature_url ? (
                <div className="flex flex-col items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={initialValues?.admin_signature_url as string}
                    alt="Admin signature"
                    className="border rounded p-2 max-h-24"
                  />
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => setShowPad(true)}
                  >
                    Replace signature
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <SignaturePad
                    ref={padRef}
                    width={280}
                    height={140}
                    onChange={(empty) => {
                      formik.setFieldValue(
                        "admin_signature",
                        empty ? null : padRef.current?.toDataURL() ?? null,
                      );
                    }}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-xs text-gray-600 underline"
                      onClick={() => {
                        padRef.current?.clear();
                        formik.setFieldValue("admin_signature", null);
                      }}
                    >
                      Clear
                    </button>
                    {initialValues?.admin_signature_url && (
                      <button
                        type="button"
                        className="text-xs text-gray-600 underline"
                        onClick={() => {
                          padRef.current?.clear();
                          formik.setFieldValue("admin_signature", null);
                          setShowPad(false);
                        }}
                      >
                        Keep existing
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Contact Details */}
          <div className="space-y-3">
            <p className="font-medium text-gray-900">Contact Details</p>
            <Input
              label="Name"
              labelIcon={<User size={14} />}
              name="contact_name"
              value={formik.values.contact_name}
              onChange={formik.handleChange}
            />
            <Input
              label="Telephone Number"
              labelIcon={<Phone size={14} />}
              name="telephone_number"
              value={formik.values.telephone_number}
              onChange={formik.handleChange}
            />
            <Input
              label="Email"
              type="email"
              labelIcon={<Mail size={14} />}
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
            />
            <Input
              label="Website"
              labelIcon={<Globe size={14} />}
              name="website"
              value={formik.values.website}
              onChange={formik.handleChange}
            />
            <Input
              label="Instagram"
              labelIcon={<BsInstagram size={14} />}
              name="instagram"
              value={formik.values.instagram}
              onChange={formik.handleChange}
            />
            <Input
              label="Facebook"
              labelIcon={<FaFacebook size={14} />}
              name="facebook"
              type="url"
              placeholder="https://facebook.com/yourcompany"
              value={formik.values.facebook}
              onChange={formik.handleChange}
            />
          </div>

          {/* Column 3: Address Details */}
          <div className="space-y-3">
            <p className="font-medium text-gray-900">Address Details</p>
            <Input
              label="Address Name Number"
              labelIcon={<NotebookTabs size={14} />}
              name="address_name"
              value={formik.values.address_name}
              onChange={formik.handleChange}
            />
            <Input
              label="Street"
              name="street"
              value={formik.values.street}
              onChange={formik.handleChange}
            />
            <Input
              label="City"
              labelIcon={<Building2 size={14} />}
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
            />
            <Input
              label="Postal Code"
              labelIcon={<FaEnvelopesBulk size={14} />}
              name="postal_code"
              value={formik.values.postal_code}
              onChange={formik.handleChange}
            />
          </div>

          {/* Column 4: Bank Details */}
          <div className="space-y-3">
            <p className="font-medium text-gray-900">Bank Details</p>
            <Input
              label="Bank Name"
              labelIcon={<Landmark size={14} />}
              name="bank_name"
              value={formik.values.bank_name}
              onChange={formik.handleChange}
            />
            <Input
              label="Account Number"
              name="account_number"
              value={formik.values.account_number}
              onChange={formik.handleChange}
            />
            <Input
              label="Sort Code"
              labelIcon={<Landmark size={14} />}
              name="sort_code"
              value={formik.values.sort_code}
              onChange={formik.handleChange}
            />
            <Input
              label="Vat"
              labelIcon={<Percent size={14} />}
              name="vat"
              value={formik.values.vat}
              onChange={formik.handleChange}
            />
            <Input
              label="Vat Percentage"
              labelIcon={<Percent size={14} />}
              name="vat_percentage"
              value={formik.values.vat_percentage}
              onChange={formik.handleChange}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <ModalFooter
            loading={loading}
            mode={isEditMode ? "edit" : "add"}
            onCancel={handleCancel}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CompanyModal;
