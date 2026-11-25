"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Users } from "lucide-react";
import { Alert, Button, CheckboxChoice, ChoiceGroup, LoadingState, Modal, TextField } from "@/components/ui";
import { useWorkspaceResource } from "@/hooks/useWorkspaceResource";
import api from "@/lib/api";
import { requestError } from "@/lib/workspace";
import type { CompanyMember, Dimension } from "@/types";
import { ResourceError } from "./WorkspaceUI";
import styles from "./company-workspace.module.css";

export function MemberEditor({ member, roles, onClose, onSaved }: { member?: CompanyMember; roles: string[]; onClose: () => void; onSaved: () => void }) {
    const dimensions = useWorkspaceResource<{ dimensions: Dimension[] }>("/dimensions");
    const [name, setName] = useState(member?.name ?? "");
    const [email, setEmail] = useState(member?.email ?? "");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(member?.memberRole ?? "");
    const [selected, setSelected] = useState(member?.allowedDimensions?.map(dimension => dimension._id) ?? []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const requestLock = useRef(false);
    const rolesId = useId();
    async function save(event: FormEvent) {
        event.preventDefault();
        if (requestLock.current) return;
        if (!name.trim()) { setError("Enter the team member's name."); return; }
        requestLock.current = true; setSaving(true); setError("");
        const payload = { name: name.trim(), memberRole: role.trim(), allowedDimensions: selected, ...(password ? { password } : {}) };
        try {
            if (member) await api.put(`/company/members/${member._id}`, payload);
            else await api.post("/company/members", { ...payload, email: email.trim() });
            onSaved();
        } catch (cause) { setError(requestError(cause, "Couldn't save this member. Check the details and try again.")); }
        finally { requestLock.current = false; setSaving(false); }
    }
    return <Modal open title={member ? "Edit team member" : "Add team member"} description="Create an assessor account and choose the dimensions this person can access." icon={<Users />} onClose={onClose} closeDisabled={saving} dismissOnBackdrop={false}>
        <form className={styles.form} onSubmit={save} aria-busy={saving}>
            <fieldset className={styles.formFieldset} disabled={saving}>
                <TextField label="Full name" hint="The name shown in assessments and team responses." autoComplete="name" required value={name} onChange={event => setName(event.target.value)} />
                <TextField label="Email address" hint={member ? "Email cannot be changed for an existing account." : "This email will be used to sign in to Karta."} type="email" autoComplete="email" required disabled={Boolean(member)} value={email} onChange={event => setEmail(event.target.value)} />
                <TextField label={member ? "New password (optional)" : "Password"} hint={member ? "Leave blank to keep the current password. Use at least 6 characters for a new one." : "Use at least 6 characters. Share the account details with your member securely."} type="password" autoComplete="new-password" minLength={6} required={!member} value={password} onChange={event => setPassword(event.target.value)} />
                <TextField label="Team or department" hint="Choose a suggested team or enter a department name." list={rolesId} value={role} onChange={event => setRole(event.target.value)} /><datalist id={rolesId}>{roles.map(value => <option key={value} value={value} />)}</datalist>
                {dimensions.loading ? <LoadingState inline>Loading dimensions.</LoadingState> : dimensions.error ? <ResourceError message="Couldn't load accessible dimensions." retry={dimensions.refresh} /> : <ChoiceGroup label={`Accessible dimensions (${selected.length})`} hint="Select the dimensions this member is responsible for assessing.">
                    {dimensions.data?.dimensions.map(dimension => <CheckboxChoice key={dimension._id} label={dimension.name} checked={selected.includes(dimension._id)} onChange={() => setSelected(values => values.includes(dimension._id) ? values.filter(value => value !== dimension._id) : [...values, dimension._id])} />)}
                </ChoiceGroup>}
                {!selected.length && <Alert>No dimensions selected. Assign dimensions so this member can contribute to assessments.</Alert>}
            </fieldset>
            {error && <Alert variant="error">{error}</Alert>}
            <div className={styles.formActions}><Button variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" loading={saving} disabled={dimensions.loading || dimensions.error}>{member ? "Save changes" : "Create account"}</Button></div>
        </form>
    </Modal>;
}
