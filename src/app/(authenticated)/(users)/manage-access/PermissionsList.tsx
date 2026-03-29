"use client";
import { useEffect, useMemo, useState } from "react";
import { Checkbox, Spin, Button } from "antd";
import { usePermissions, useRolePermissions, useAssignRolePermissions } from "@/src/api/permissions";

interface Props {
  roleId?: string | number;
}

const PermissionsList = ({ roleId }: Props) => {
  const { data: all = [], isLoading: allLoading } = usePermissions();
  const { data: rolePerms = [], isLoading: roleLoading } = useRolePermissions(roleId);
  const { mutate: assignMutate, isPending: assignLoading } = useAssignRolePermissions(roleId);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!rolePerms) return;
    const ids = new Set((rolePerms || []).map((p: any) => String(p.id)));
    setSelected(ids);
  }, [rolePerms]);

  const permissions = useMemo(() => (all || []).map((p: any) => ({ id: String(p.id), name: p.name })), [all]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleSave = async () => {
    if (!roleId) return;
    const payload = { permissions: Array.from(selected) };
    assignMutate(payload);
  };

  if (allLoading || roleLoading) return <div className="p-6 flex items-center justify-center"><Spin /></div>;

  if (!roleId) return <div className="p-6 text-sm text-gray-600">Select a role to manage permissions.</div>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 max-h-80 overflow-auto pb-3">
        {permissions.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <Checkbox checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            <span className="text-sm">{p.name}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="primary" onClick={handleSave} loading={assignLoading} disabled={assignLoading}>Save</Button>
        <Button onClick={() => { setSelected(new Set((rolePerms || []).map((p: any) => String(p.id)))); }}>Reset</Button>
      </div>
    </div>
  );
};

export default PermissionsList;
