import { useAddCompany, useEditCompany } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
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
      formData.append("admin_signature", "dummy signature value");
      if (values.company_logo) {
        formData.append("company_logo", values.company_logo);
      }
      if (values.brochure) {
        formData.append("brochure", values.brochure);
      }
      if (isEditMode) {
        editCompany.mutate({ id: initialValues.id, payload: formData });
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
      title="Add Company"
      centered
      footer={false}
      width={700}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-center font-medium">Company Details</p>
            <Input
              label="Company Name"
              labelIcon={<Building2 size={14} />}
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
            />
          </div>
          <div className="space-y-3">
            <p className="text-center font-medium">Files</p>
            <Input
              label="Company Logo"
              type="file"
              labelIcon={<FileInput size={14} />}
              name="company_logo"
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                formik.setFieldValue(
                  "brochure",
                  e.currentTarget.files?.[0] || null,
                );
              }}
            />
          </div>
          <div className="space-y-3">
            <p className="text-center font-medium">Contact Details</p>
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
          <div className="space-y-3">
            <p className="text-center font-medium">Address Details</p>
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
          <div className="space-y-3">
            <p className="text-center font-medium">Bank Details</p>
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
        <div className="mt-4">
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
