import Button from "../Button";

const ModalFooter = ({
  onCancel,
  mode,
  loading,
}: {
  onCancel: VoidFunction;
  mode: "edit" | "add";
  loading: boolean;
}) => {
  return (
    <div className="flex gap-3 justify-end">
      <Button onClick={onCancel} disabled={loading} className="bg-white border border-gray-200 text-gray-700 px-5">
        Cancel
      </Button>
      <Button
        htmlType="submit"
        type="primary"
        loading={loading}
        disabled={loading}
        className="px-5"
      >
        {mode === "edit" ? "Update" : "Add"}
      </Button>
    </div>
  );
};

export default ModalFooter;
