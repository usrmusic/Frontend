import { useAddVenue, useEditVenue } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";

interface VenueModalProps {
  modalOpen: boolean;
  onCancel: VoidFunction;
}

interface VenueData {
  venue: string;
  venue_address: string;
  stage: string;
  power: string;
  access: string;
  rigging_point: string;
  notes: string;
  id: string | number;
}

interface VenueModalProps {
  modalOpen: boolean;
  onCancel: VoidFunction;
  initialValues: VenueData | null;
}

const getInitialVenueValues = (venue: VenueData | null): VenueData => ({
  venue: venue?.venue || "",
  venue_address: venue?.venue_address || "",
  stage: venue?.stage || "",
  power: venue?.power || "",
  access: venue?.access || "",
  rigging_point: venue?.rigging_point || "",
  notes: venue?.notes || "",
  id: venue?.id || "",
});

const VenueModal = ({
  modalOpen,
  onCancel,
  initialValues,
}: VenueModalProps) => {
  const isEditMode = !!initialValues;
  const addVenue = useAddVenue();
  const editVenue = useEditVenue();
  const loading = addVenue.isPending || editVenue.isPending;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialVenueValues(initialValues),
    onSubmit: (values) => {
      // Add or Edit logic goes here
      if (isEditMode) {
        editVenue.mutate(values, {
          onSuccess: () => {
            onCancel();
            notification.success({
              message: "Success",
              description: "Venue Successfully updated",
            });
          },
        });
      } else {
        addVenue.mutate(values, {
          onSuccess: () => {
            onCancel();
            notification.success({
              message: "Success",
              description: "Venue Successfully added",
            });
          },
        });
      }
    },
  });

  return (
    <Modal
      open={modalOpen}
      onCancel={onCancel}
      title={isEditMode ? "Edit Venue" : "Add Venue"}
      footer={null}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Venue"
            name="venue"
            value={formik.values.venue}
            onChange={formik.handleChange}
            required
          />
          <Input
            label="Address"
            name="venue_address"
            value={formik.values.venue_address}
            onChange={formik.handleChange}
          />
          <Input
            label="Stage"
            name="stage"
            value={formik.values.stage}
            onChange={formik.handleChange}
          />
          <Input
            label="Power"
            name="power"
            value={formik.values.power}
            onChange={formik.handleChange}
          />
          <Input
            label="Access"
            name="access"
            value={formik.values.access}
            onChange={formik.handleChange}
          />
          <Input
            label="Rigging Point"
            name="rigging_point"
            value={formik.values.rigging_point}
            onChange={formik.handleChange}
          />
          <Input
            label="Notes"
            name="notes"
            value={formik.values.notes}
            onChange={formik.handleChange}
          />
        </div>
        <div className="mt-4">
          <ModalFooter
            loading={loading}
            onCancel={onCancel}
            mode={isEditMode ? "edit" : "add"}
          />
        </div>
      </form>
    </Modal>
  );
};

export default VenueModal;
