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
      <Button onClick={onCancel} disabled={loading}>Cancel</Button>
      <Button
        htmlType="submit"
        type="primary"
        loading={loading}
        disabled={loading}
      >
        {mode === "edit" ? "Update" : "Add"}
      </Button>
    </div>
  );
};

export default ModalFooter;
