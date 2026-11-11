"use client";
import {practiceOptions,scopeRights} from "../../lib/business.mjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../account/profile";
const roles = [
  "owner",
  "administrator",
  "publisher",
  "editor",
  "property_manager",
  "procurement_manager",
  "marketing_manager",
  "sales",
  "auditor",
  "client",
  "vendor",
];
function useAction() {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return {
    message,
    busy,
    run: async (module, payload) => {
      setBusy(true);
      setMessage("");
      try {
        const result = await portalAction(module, payload);
        setMessage(result?.notice || "Saved.");
        router.refresh();
        return true;
      } catch (e) {
        setMessage(e.message);
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
function Result({ state }) {
  return (
    <p role="status" className="portal-message">
      {state.message}
    </p>
  );
}
export function TaxonomyManager({ items }) {
  const state = useAction(),
    [selected, setSelected] = useState(null);
  return (
    <section className="workspace-card">
      <h2>Categories & tags</h2>
      <p>
        Classification is managed independently from listing text. Referenced
        tags cannot be deleted; retire them or remove their listing assignments
        first.
      </p>
      <form
        key={selected?.id || "new"}
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const ok = await state.run("taxonomy", {
            action: selected ? "update" : "create",
            id: selected?.id,
            version: selected?.version,
            dimension: f.get("dimension"),
            slug: f.get("slug"),
            label: f.get("label"),
            description: f.get("description"),
            active: f.get("active") === "on",
          });
          if (ok) setSelected(null);
        }}
      >
        <label>
          Dimension
          <select
            name="dimension"
            defaultValue={selected?.dimension || "opportunity-context"}
            disabled={!!selected}
          >
            {[
              "asset-class",
              "transaction-type",
              "opportunity-context",
              "practice",
              "product-category",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Stable slug
          <input
            name="slug"
            defaultValue={selected?.slug || ""}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={80}
            disabled={!!selected}
          />
        </label>
        <label>
          Label
          <input
            name="label"
            defaultValue={selected?.label || ""}
            required
            maxLength={100}
          />
        </label>
        <label>
          Description
          <input
            name="description"
            defaultValue={selected?.description || ""}
            maxLength={500}
          />
        </label>
        <label className="check">
          <input
            name="active"
            type="checkbox"
            defaultChecked={selected?.active ?? true}
          />
          Active
        </label>
        <div className="workspace-actions">
          <button disabled={state.busy} className="primary">
            {selected ? "Save category" : "Create category"}
          </button>
          {selected && (
            <button type="button" onClick={() => setSelected(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <Result state={state} />
      <div className="table-scroll">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Label</th>
              <th>State</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>{x.dimension}</td>
                <td>{x.label}</td>
                <td>{x.active ? "Active" : "Retired"}</td>
                <td>
                  <button
                    className="text-button"
                    onClick={() => setSelected(x)}
                  >
                    Edit
                  </button>
                  {" · "}
                  <button
                    disabled={state.busy}
                    className="text-button"
                    onClick={() => {
                      if (
                        confirm(
                          "Permanently delete " +
                            x.label +
                            "? Referenced categories must be unassigned first.",
                        )
                      )
                        state.run("taxonomy", {
                          action: "delete",
                          id: x.id,
                          version: x.version,
                        });
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export function UserManager({ users, invitations, isOwner }) {
  const state = useAction(),
    [selected, setSelected] = useState(null);
  return (
    <section className="workspace-card">
      <h2>Users & invitations</h2>
      <p>
        Invite staff by their work email. They must verify that email, accept
        policies and complete MFA before activating the assignment. Role or
        status changes revoke existing sessions.
      </p>
      <form
        key={selected?.id || "invite"}
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const ok = await state.run("users", {
            action: selected ? "update" : "invite",
            id: selected?.id,
            email: f.get("email"),
            display_name: f.get("name"),
            company: f.get("company"),
            status: f.get("status"),
            roles: f.getAll("roles"),
            practice_grants: Object.fromEntries(practiceOptions.map(([key])=>[key,f.getAll("scope_"+key)]).filter(([,rights])=>rights.length)),
          });
          if (ok) setSelected(null);
        }}
      >
        <label>
          Email
          <input
            name="email"
            type="email"
            defaultValue={selected?.email || ""}
            disabled={!!selected}
            required
          />
        </label>
        {selected && (
          <>
            <label>
              Name
              <input
                name="name"
                maxLength={120}
                defaultValue={selected.display_name}
              />
            </label>
            <label>
              Organisation
              <input
                name="company"
                maxLength={180}
                defaultValue={selected.company}
              />
            </label>
            <label>
              Account state
              <select name="status" defaultValue={selected.status}>
                {["active", "suspended", "closed"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <fieldset className="wide role-grid">
          <legend>Roles</legend>
          {roles
            .filter((x) => isOwner || x !== "owner")
            .map((x) => (
              <label className="check" key={x}>
                <input
                  type="checkbox"
                  name="roles"
                  value={x}
                  defaultChecked={
                    selected?.roles.includes(x) || (!selected && x === "editor")
                  }
                />
                {x.replaceAll("_", " ")}
              </label>
            ))}
        </fieldset>
        {isOwner&&<fieldset className="wide"><legend>Practice permissions</legend><p>Each practice requires View access. Roles still limit the actions below.</p><div className="table-scroll"><table className="workspace-table"><thead><tr><th>Practice</th>{scopeRights.map(([key,label])=><th key={key}>{label}</th>)}</tr></thead><tbody>{practiceOptions.map(([key,label])=><tr key={key}><th>{label}</th>{scopeRights.map(([right,rightLabel])=><td key={right}><input aria-label={label+': '+rightLabel} type="checkbox" name={'scope_'+key} value={right} defaultChecked={selected?.practice_grants?.[key]?.includes(right)||false}/></td>)}</tr>)}</tbody></table></div></fieldset>}
        <div className="workspace-actions wide">
          <button className="primary" disabled={state.busy}>
            {selected ? "Save and revoke sessions" : "Create invitation"}
          </button>
          {selected && (
            <button type="button" onClick={() => setSelected(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <Result state={state} />
      <div className="table-scroll">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>State</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {users.map((x) => (
              <tr key={x.id}>
                <td>
                  {x.display_name}
                  <br />
                  {x.email}
                </td>
                <td>{x.roles.join(", ")}</td>
                <td>{x.status}</td>
                <td>
                  <button
                    className="text-button"
                    onClick={() => setSelected(x)}
                  >
                    Edit
                  </button>
                  {" · "}
                  <button
                    className="text-button"
                    disabled={state.busy}
                    onClick={() => {
                      if (confirm("Sign this user out of every device?"))
                        state.run("users", {
                          action: "revoke_sessions",
                          id: x.id,
                        });
                    }}
                  >
                    Revoke sessions
                  </button>
                  {" · "}
                  <button
                    className="text-button"
                    disabled={state.busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Close this account? Access will stop. Audit records are retained.",
                        )
                      )
                        state.run("users", { action: "close", id: x.id });
                    }}
                  >
                    Close account
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Invitations</h3>
      <ul>
        {invitations.map((x) => (
          <li key={x.id}>
            {x.email} · {x.roles.join(", ")} ·{" "}
            {x.revoked ? "Revoked" : x.accepted_by ? "Accepted" : "Pending"}{" "}
            {!x.revoked && !x.accepted_by && (
              <button
                className="text-button"
                onClick={() => state.run("invitation_revoke", { id: x.id })}
              >
                Revoke invitation
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="workspace-small">
        Closing an account retains business and audit records. Erasure requests
        need a retention review. Invitation emails are not sent until the mail
        service is activated.
      </p>
    </section>
  );
}
export function EnquiryManager({ items, outbox }) {
  const state = useAction();
  return (
    <section className="workspace-card">
      <h2>Enquiries</h2>
      <Result state={state} />
      {items.length ? (
        items.map((x) => (
          <details key={x.id} className="enquiry-record">
            <summary>
              {x.name} · {x.practice} · {x.status}
            </summary>
            <p>{x.email}</p>
            <p className="preserve-lines">{x.message}</p>
            <form
              className="workspace-form"
              onSubmit={(e) => {
                e.preventDefault();
                state.run("enquiry", {
                  id: x.id,
                  status: new FormData(e.currentTarget).get("status"),
                  assigned_to: x.assigned_to,
                });
              }}
            >
              <label>
                Status
                <select name="status" defaultValue={x.status}>
                  {["new", "assigned", "in_progress", "closed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="workspace-actions">
                <button disabled={state.busy}>Save status</button>
              </div>
            </form>
            <h3>Message delivery record</h3>
            {outbox
              .filter((j) => j.enquiry_id === x.id)
              .map((j) => (
                <p className="workspace-small" key={j.id}>
                  {j.recipient} · {j.kind} · {j.status}
                </p>
              ))}
          </details>
        ))
      ) : (
        <p>No enquiries available to this account.</p>
      )}
    </section>
  );
}
